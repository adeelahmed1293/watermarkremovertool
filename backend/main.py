import os
import time
import shutil
import logging
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, Query
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Tuple
import cv2
import numpy as np
import aiofiles
import zipfile
from pathlib import Path
import tempfile

from processor import WatermarkProcessor
import utils

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Watermark Remover API", version="1.0.0")

# Add CORS middleware
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://vercel.app",
    "https://watermarkremovertool-1.onrender.com",
    "*",  # Allow all origins for now, restrict in production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active jobs for progress tracking
JOBS = {}


# ==================== Models ====================

class BoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int


class ProcessRequest(BaseModel):
    video_id: str
    bbox: BoundingBox


class ProcessBulkRequest(BaseModel):
    items: List[ProcessRequest]


class UploadResponse(BaseModel):
    video_id: str
    filename: str
    thumbnail_url: str
    width: int
    height: int
    fps: float


class PreviewResponse(BaseModel):
    video_id: str
    preview_url: str


class ProcessResponse(BaseModel):
    video_id: str
    status: str


class StatusResponse(BaseModel):
    job_id: str
    progress: int
    status: str
    estimated_time_remaining: int  # seconds


# ==================== Utility Functions ====================

def encode_image_to_base64(image: np.ndarray) -> str:
    """Encode numpy image to base64 string."""
    import base64
    _, buffer = cv2.imencode('.jpg', image)
    return base64.b64encode(buffer).decode('utf-8')


def cleanup_video_delayed(video_id: str, delay_seconds: int = 3600):
    """Schedule cleanup after delay (1 hour default) to allow download time."""
    logger.info(f"Scheduling cleanup for {video_id} in {delay_seconds} seconds")
    time.sleep(delay_seconds)
    utils.cleanup_video(video_id)


def save_thumbnail(frame: np.ndarray, video_id: str) -> Path:
    """Save video frame as thumbnail."""
    thumb_path = utils.get_thumbnail_path(video_id)
    cv2.imwrite(str(thumb_path), frame)
    return thumb_path


# ==================== Endpoints ====================

@app.post("/upload", response_model=List[UploadResponse])
async def upload_videos(files: List[UploadFile] = File(...)):
    """
    Upload single or multiple video files.
    Returns video IDs and thumbnails for each video.
    """
    allowed_extensions = {'.mp4', '.mov', '.avi', '.mkv', '.webm'}
    max_size = 500 * 1024 * 1024  # 500MB
    
    responses = []
    
    for file in files:
        try:
            # Validate file extension
            file_ext = Path(file.filename).suffix.lower()
            if file_ext not in allowed_extensions:
                logger.warning(f"Invalid file type: {file.filename}")
                continue
            
            # Generate video ID
            video_id = utils.generate_video_id()
            upload_path = utils.get_upload_path(video_id, file.filename)
            
            # Read and save file
            contents = await file.read()
            if len(contents) > max_size:
                raise HTTPException(status_code=400, detail="File too large (max 500MB)")
            
            async with aiofiles.open(upload_path, 'wb') as f:
                await f.write(contents)
            
            # Extract first frame and video info
            processor = WatermarkProcessor(str(upload_path))
            
            first_frame = processor.get_first_frame()
            if first_frame is None:
                raise HTTPException(status_code=400, detail=f"Could not read video: {file.filename}")
            
            width, height = processor.get_frame_dimensions()
            fps = processor.get_fps()
            
            # Save thumbnail
            save_thumbnail(first_frame, video_id)
            
            processor.close_video()
            
            responses.append(UploadResponse(
                video_id=video_id,
                filename=file.filename,
                thumbnail_url=f"/thumbnail/{video_id}",
                width=width,
                height=height,
                fps=fps
            ))
            
            logger.info(f"Successfully uploaded video: {video_id}")
            
        except Exception as e:
            logger.error(f"Error uploading file {file.filename}: {e}")
            continue
    
    if not responses:
        raise HTTPException(status_code=400, detail="No valid videos uploaded")
    
    return responses


@app.get("/thumbnail/{video_id}")
async def get_thumbnail(video_id: str):
    """Get thumbnail for a video."""
    thumb_path = utils.get_thumbnail_path(video_id)
    
    if not thumb_path.exists():
        raise HTTPException(status_code=404, detail="Thumbnail not found")
    
    return FileResponse(thumb_path, media_type="image/jpeg")


@app.post("/preview", response_model=PreviewResponse)
async def preview_removal(request: ProcessRequest):
    """
    Preview watermark removal on first frame.
    Returns the inpainted frame.
    """
    try:
        # Find the uploaded video
        video_files = list(utils.UPLOAD_DIR.glob(f"{request.video_id}_*"))
        if not video_files:
            raise HTTPException(status_code=404, detail="Video not found")
        
        video_path = video_files[0]
        bbox = (request.bbox.x, request.bbox.y, request.bbox.width, request.bbox.height)
        
        processor = WatermarkProcessor(str(video_path))
        preview_frame = processor.get_preview_frame(bbox)
        processor.close_video()
        
        if preview_frame is None:
            raise HTTPException(status_code=400, detail="Could not generate preview")
        
        # Save preview temporarily
        preview_path = utils.PROCESSED_DIR / f"preview_{request.video_id}.jpg"
        cv2.imwrite(str(preview_path), preview_frame)
        
        logger.info(f"Generated preview for video: {request.video_id}")
        
        return PreviewResponse(
            video_id=request.video_id,
            preview_url=f"/preview-image/{request.video_id}"
        )
        
    except Exception as e:
        logger.error(f"Error generating preview: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/preview-image/{video_id}")
async def get_preview_image(video_id: str):
    """Get preview image."""
    preview_path = utils.PROCESSED_DIR / f"preview_{video_id}.jpg"
    
    if not preview_path.exists():
        raise HTTPException(status_code=404, detail="Preview not found")
    
    return FileResponse(preview_path, media_type="image/jpeg")


@app.post("/process", response_model=ProcessResponse)
async def process_video(request: ProcessRequest, background_tasks: BackgroundTasks):
    """
    Process a single video to remove watermark.
    Returns the processed video file.
    """
    try:
        # Create job entry
        JOBS[request.video_id] = {
            "status": "processing",
            "progress": 0,
            "start_time": time.time(),
        }
        
        # Find the uploaded video
        video_files = list(utils.UPLOAD_DIR.glob(f"{request.video_id}_*"))
        if not video_files:
            JOBS[request.video_id]["status"] = "failed"
            raise HTTPException(status_code=404, detail="Video not found")
        
        video_path = video_files[0]
        bbox = (request.bbox.x, request.bbox.y, request.bbox.width, request.bbox.height)
        output_path = utils.get_processed_path(request.video_id)
        
        # Process video with progress tracking
        def update_progress(progress):
            JOBS[request.video_id]["progress"] = progress
        
        processor = WatermarkProcessor(str(video_path))
        success = processor.process_video(bbox, str(output_path), progress_callback=update_progress)
        processor.close_video()
        
        if not success:
            JOBS[request.video_id]["status"] = "failed"
            raise HTTPException(status_code=500, detail="Video processing failed")
        
        # Extract audio and merge if available
        try:
            temp_audio = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
            if utils.extract_audio(str(video_path), temp_audio):
                output_with_audio = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False).name
                if utils.merge_audio(str(output_path), temp_audio, output_with_audio):
                    shutil.move(output_with_audio, str(output_path))
                    logger.info(f"Audio merged successfully for {request.video_id}")
                else:
                    logger.warning(f"Audio merge command failed for {request.video_id}")
            else:
                logger.warning(f"Audio extraction failed for {request.video_id} - video may have no audio track")
        except Exception as e:
            logger.warning(f"Could not merge audio: {e}")
        
        # Mark as completed
        JOBS[request.video_id]["status"] = "completed"
        JOBS[request.video_id]["progress"] = 100
        
        # DO NOT cleanup here - user needs to download first
        # Schedule cleanup for later (after download window)
        background_tasks.add_task(cleanup_video_delayed, request.video_id)
        
        logger.info(f"Successfully processed video: {request.video_id}")
        
        return ProcessResponse(
            video_id=request.video_id,
            status="completed"
        )
        
    except Exception as e:
        logger.error(f"Error processing video: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/download/{video_id}")
async def download_video(video_id: str, filename: str = Query(None)):
    """Download processed video."""
    processed_path = utils.get_processed_path(video_id)
    
    if not processed_path.exists():
        raise HTTPException(status_code=404, detail="Processed video not found")
    
    # Use the provided filename if available, otherwise use a default
    if filename:
        download_filename = filename
    else:
        download_filename = f"watermark_removed_{video_id}.mp4"
    
    return FileResponse(
        processed_path,
        media_type="video/mp4",
        filename=download_filename
    )


@app.post("/process-bulk")
async def process_bulk(request: ProcessBulkRequest, background_tasks: BackgroundTasks):
    """
    Process multiple videos and return as ZIP.
    """
    try:
        processed_files = []
        
        for item in request.items:
            JOBS[item.video_id] = {
                "status": "processing",
                "progress": 0,
                "start_time": time.time(),
            }
            
            video_files = list(utils.UPLOAD_DIR.glob(f"{item.video_id}_*"))
            if not video_files:
                logger.warning(f"Video not found: {item.video_id}")
                JOBS[item.video_id]["status"] = "failed"
                continue
            
            video_path = video_files[0]
            bbox = (item.bbox.x, item.bbox.y, item.bbox.width, item.bbox.height)
            output_path = utils.get_processed_path(item.video_id)
            
            # Process video with progress tracking
            def update_progress(progress, vid=item.video_id):
                JOBS[vid]["progress"] = progress
            
            processor = WatermarkProcessor(str(video_path))
            success = processor.process_video(bbox, str(output_path), progress_callback=update_progress)
            processor.close_video()
            
            if success:
                # Try to merge audio
                try:
                    temp_audio = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
                    if utils.extract_audio(str(video_path), temp_audio):
                        output_with_audio = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False).name
                        if utils.merge_audio(str(output_path), temp_audio, output_with_audio):
                            shutil.move(output_with_audio, str(output_path))
                except Exception as e:
                    logger.warning(f"Could not merge audio: {e}")
                
                JOBS[item.video_id]["status"] = "completed"
                JOBS[item.video_id]["progress"] = 100
                processed_files.append((item.video_id, output_path))
            else:
                JOBS[item.video_id]["status"] = "failed"
        
        if not processed_files:
            raise HTTPException(status_code=500, detail="No videos processed successfully")
        
        # Create ZIP file with original filenames
        zip_path = tempfile.NamedTemporaryFile(suffix=".zip", delete=False).name
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for video_id, file_path in processed_files:
                # Recover original filename from upload path
                video_files = list(utils.UPLOAD_DIR.glob(f"{video_id}_*"))
                original_filename = "video.mp4"
                if video_files:
                    upload_name = video_files[0].name
                    original_filename = upload_name[len(video_id) + 1:]
                zipf.write(file_path, arcname=original_filename)
        
        # Schedule cleanup with delay to allow download
        for video_id, _ in processed_files:
            background_tasks.add_task(cleanup_video_delayed, video_id)
        
        logger.info(f"Successfully created bulk ZIP with {len(processed_files)} videos")
        
        return FileResponse(
            zip_path,
            media_type="application/zip",
            filename="watermark_removed_videos.zip"
        )
        
    except Exception as e:
        logger.error(f"Error in bulk processing: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/cleanup/{video_id}")
async def cleanup_video_endpoint(video_id: str):
    """Manually cleanup video files."""
    try:
        utils.cleanup_video(video_id)
        return {"status": "cleaned"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/status/{video_id}")
async def get_status(video_id: str):
    """Get processing status for a video."""
    if video_id not in JOBS:
        # Job not found, might be already completed/cleaned up
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = JOBS[video_id]
    progress = job.get("progress", 0)
    status = job.get("status", "processing")
    
    return StatusResponse(
        job_id=video_id,
        progress=progress,
        status=status,
        estimated_time_remaining=0
    )


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.on_event("startup")
async def startup_event():
    """Startup event - cleanup old files."""
    logger.info("Starting up Watermark Remover API")
    utils.cleanup_old_files()


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event."""
    logger.info("Shutting down Watermark Remover API")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
