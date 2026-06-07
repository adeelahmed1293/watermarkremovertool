# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   React App (Vite)                         │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  App.jsx (Main Component)                           │ │ │
│  │  │  - Step 1: UploadZone (Upload videos)               │ │ │
│  │  │  - Step 2: PreviewPanel (Select region)             │ │ │
│  │  │  - Step 3: ProgressBar (Processing)                 │ │ │
│  │  │  - Step 4: DownloadPanel (Download results)         │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │  CanvasSelector (⭐ Core Component)                  │ │ │
│  │  │  - Displays first frame as canvas                   │ │ │
│  │  │  - Interactive rectangle drawing                    │ │ │
│  │  │  - Scale handling (display vs actual resolution)    │ │ │
│  │  │  - Live coordinate display                          │ │ │
│  │  │  - Preview image comparison                         │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  api.js (HTTP Client)                                      │ │
│  │  - Axios instance                                         │ │
│  │  - 9 API endpoints                                        │ │
│  │                                                            │ │
│  │  Dark theme CSS                                           │ │
│  │  - index.css (global)                                     │ │
│  │  - Component-specific CSS                                │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────┬────────────────────────────────────┬─────────────────┘
           │ HTTPS Requests                     │ HTTPS Responses
           │ (JSON + Multipart)                 │ (JSON + Video)
           ▼                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FastAPI Backend Server                        │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  main.py (10 API Endpoints)                              │ │
│  │                                                           │ │
│  │  POST /upload ─────────────────────┐                     │ │
│  │  GET /thumbnail/:id ────────────┐  │                     │ │
│  │  POST /preview ─────────────────┼──┼─→ processor.py      │ │
│  │  GET /preview-image/:id         │  │   (WatermarkProcessor) │
│  │  POST /process ─────────────────┤  │   - OpenCV inpaint  │ │
│  │  POST /process-bulk ────────────┤  │   - Frame processing│ │
│  │  GET /download/:id ─────────────┼──┤   - Audio handling  │ │
│  │  GET /status/:id ───────────────┤  │                     │ │
│  │  DELETE /cleanup/:id ───────────┤  │                     │ │
│  │  GET /health ───────────────────┘  │                     │ │
│  │                                    │                     │ │
│  │  CORS Middleware                   └─→ utils.py         │ │
│  │  - Validate origin                     - File I/O        │ │
│  │  - Set CORS headers                    - FFmpeg calls    │ │
│  │  - Handle preflight                    - Cleanup         │ │
│  │                                                          │ │
│  │  Background Tasks                                        │ │
│  │  - Auto-delete temp files (30 min)                      │ │
│  │  - Cleanup on startup                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Processor Logic (processor.py)                          │ │
│  │                                                           │ │
│  │  def process_video(bbox):                                │ │
│  │    1. Open video file (cv2.VideoCapture)                │ │
│  │    2. Get video properties (fps, resolution)            │ │
│  │    3. Create binary mask from bbox                      │ │
│  │    4. For each frame:                                   │ │
│  │       - cv2.inpaint() with INPAINT_TELEA               │ │
│  │       - Write to output video                           │ │
│  │    5. Merge original audio back (FFmpeg)                │ │
│  │    6. Save as MP4 (H.264)                               │ │
│  │                                                           │ │
│  │  Algorithm: cv2.inpaint()                                │ │
│  │  - Takes frame, mask, radius                            │ │
│  │  - Returns inpainted frame                              │ │
│  │  - Fast algorithm suitable for real-time processing     │ │
│  │                                                           │ │
│  │  Audio Handling:                                         │ │
│  │  - Extract with FFmpeg: ffmpeg -i input -q:a 9 output.aac │ │
│  │  - Process video                                         │ │
│  │  - Merge with FFmpeg: ffmpeg -i video -i audio -c:a aac │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  File System (tmp/)                                      │ │
│  │                                                           │ │
│  │  tmp/uploads/      (Raw uploaded videos)                 │ │
│  │  ├── {uuid}_video.mp4                                   │ │
│  │  ├── {uuid}_video.mp4                                   │ │
│  │  └── ...                                                │ │
│  │                                                           │ │
│  │  tmp/processed/    (Processed videos + artifacts)        │ │
│  │  ├── thumb_{uuid}.jpg                                  │ │
│  │  ├── preview_{uuid}.jpg                                │ │
│  │  ├── processed_{uuid}.mp4                              │ │
│  │  └── ...                                                │ │
│  │                                                           │ │
│  │  Auto-cleanup:                                           │ │
│  │  - Delete after download or 30 min idle                 │ │
│  │  - Triggered by background task                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  External Dependencies:                                        │
│  - FFmpeg (audio extraction/merge)                           │ │
│  - OpenCV (video reading/writing, inpainting)               │ │
│  - NumPy (numerical operations)                             │ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Video Upload
```
Browser
  │ (File Input)
  ├─→ formData = new FormData()
  ├─→ formData.append('files', file)
  │
  └─→ POST /upload
       │
       Server
       ├─→ Validate file (ext, size)
       ├─→ Generate UUID (video_id)
       ├─→ Save to tmp/uploads/{video_id}_filename
       ├─→ Extract first frame (cv2 capture, read 1st frame)
       ├─→ Save thumbnail to tmp/processed/thumb_{video_id}.jpg
       ├─→ Get video info (width, height, fps)
       │
       └─→ Return UploadResponse
            ├─ video_id
            ├─ filename
            ├─ thumbnail_url: "/thumbnail/{video_id}"
            ├─ width, height, fps
            │
            └─→ Browser
                 └─→ Display thumbnail + region selection
```

### 2. Region Selection & Preview
```
Browser
  │ (User draws rectangle on canvas)
  │ canvasRef → onMouseDown, onMouseMove, onMouseUp
  │ Converts display coords to actual coords (handles scaling)
  │
  └─→ POST /preview
       {video_id, bbox: {x, y, width, height}}
       │
       Server
       ├─→ Get first frame
       ├─→ Create binary mask from bbox
       ├─→ cv2.inpaint(frame, mask, radius=3, INPAINT_TELEA)
       ├─→ Save preview: tmp/processed/preview_{video_id}.jpg
       │
       └─→ Return PreviewResponse
            ├─ video_id
            ├─ preview_url: "/preview-image/{video_id}"
            │
            └─→ Browser
                 └─→ Show side-by-side comparison
                     ├─ Original (thumbnail)
                     └─ Preview (inpainted result)
```

### 3. Video Processing
```
Browser
  │ (Click "Remove Watermark")
  │
  └─→ POST /process
       {video_id, bbox}
       │
       Server
       ├─→ Get uploaded video file
       ├─→ WatermarkProcessor.process_video(bbox):
       │   │
       │   ├─→ Open video with cv2.VideoCapture
       │   ├─→ Get properties: fps, width, height, frame_count
       │   ├─→ Create VideoWriter with output path
       │   │   Codec: mp4v, FPS: original, Resolution: original
       │   │
       │   ├─→ For each frame (frame_count times):
       │   │   ├─→ cap.read() → get frame
       │   │   ├─→ cv2.inpaint(frame, mask, 3, INPAINT_TELEA)
       │   │   └─→ writer.write(inpainted_frame)
       │   │
       │   └─→ Release video writer
       │
       ├─→ Audio merge (if audio exists):
       │   ├─→ FFmpeg: ffmpeg -i original -q:a 9 temp.aac
       │   ├─→ FFmpeg: ffmpeg -i processed -i temp.aac output.mp4
       │   └─→ Replace processed file
       │
       ├─→ Schedule cleanup (BackgroundTasks)
       │
       └─→ Return ProcessResponse {status: "completed"}
            │
            └─→ Browser
                 └─→ Move to Step 4: Download
```

### 4. Download
```
Browser
  │ (Click "Download")
  │
  └─→ GET /download/{video_id}
       │
       Server
       ├─→ Check if processed_{video_id}.mp4 exists
       ├─→ Stream file with headers:
       │   ├─ Content-Type: video/mp4
       │   └─ Content-Disposition: attachment; filename=...
       │
       └─→ Download as watermark_removed_{video_id}.mp4
            │
            └─→ Browser
                 └─→ User saves file to Downloads folder
```

---

## Component Communication

### Frontend State Flow

```
App.jsx (State Manager)
  │
  ├─→ step: 1-4 (Upload → Select → Process → Download)
  ├─→ uploadedVideos: [{video_id, filename, thumbnail_url, ...}]
  ├─→ videoRegions: {video_id: {x, y, width, height}, ...}
  ├─→ processedVideos: [{...processed video info...}]
  ├─→ errors: [{id, message}] (toast notifications)
  │
  ├─→ Step 1: UploadZone
  │   └─→ Calls: uploadVideos() → API /upload
  │   └─→ Updates: uploadedVideos, moves to step 2
  │
  ├─→ Step 2: PreviewPanel
  │   └─→ Manages: CanvasSelector for each video
  │   └─→ CanvasSelector
  │       ├─→ Calls: previewRemoval() → API /preview
  │       ├─→ Displays: thumbnail + preview comparison
  │       └─→ Returns: {video_id, bbox}
  │   └─→ Updates: videoRegions, moves to step 3
  │
  ├─→ Step 3: ProgressBar
  │   └─→ Shows: Progress for each video
  │   └─→ Calls: processSingleVideo() → API /process
  │   └─→ Updates: processingStatus
  │
  └─→ Step 4: DownloadPanel
      └─→ Calls: downloadVideo() → API /download/:id
      └─→ Triggers: Browser download
```

---

## OpenCV Algorithm Details

### Inpainting Process

```
def inpaint_frame(frame, mask):
    # Input:
    # - frame: RGB image (1920x1080x3, uint8)
    # - mask: Binary mask (1920x1080, uint8)
    #   255 = region to inpaint
    #   0 = keep as-is
    
    # Process:
    result = cv2.inpaint(
        frame,                      # Input image
        mask,                       # Inpaint region
        radius=3,                   # Inpaint radius (pixels)
        flags=cv2.INPAINT_TELEA    # Algorithm (Telea's method)
    )
    # cv2.INPAINT_TELEA uses:
    # - Fast marching algorithm
    # - Propagates image gradient
    # - Good for simple, uniform backgrounds
    
    return result  # Output: Inpainted frame
```

**Why INPAINT_TELEA?**
- ✅ Fast (suitable for real-time processing)
- ✅ Works on simple watermarks
- ✅ Preserves edges well
- ✅ Good for bottom-right corner watermarks (common)

**Alternative: INPAINT_NS** (Navier-Stokes)
- ✓ Better quality but slower
- ✓ Use if TELEA doesn't work

---

## Audio Handling

### Why Separate Audio?

OpenCV's VideoWriter doesn't support audio:
1. Strip audio from original video
2. Process video with OpenCV
3. Re-merge audio with processed video

### FFmpeg Commands

```bash
# Extract audio
ffmpeg -i input.mp4 -q:a 9 -n temp.aac
# -q:a 9: Highest quality AAC
# -n: Don't overwrite

# Merge audio back
ffmpeg -i processed.mp4 -i temp.aac \
  -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 \
  -n output.mp4
# -c:v copy: Copy video (no re-encoding)
# -c:a aac: Encode audio
# -map: Select streams
# -n: Don't overwrite
```

---

## File Lifecycle

```
Timeline of a Video Processing:

T0: User uploads video.mp4
    └─→ Saved: tmp/uploads/uuid_video.mp4
    └─→ Thumbnail: tmp/processed/thumb_uuid.jpg

T1: User previews watermark region
    └─→ Preview: tmp/processed/preview_uuid.jpg

T2: User confirms region and processes

T3: Processing starts
    └─→ Intermediate: temp audio file (auto-deleted)
    └─→ Output: tmp/processed/processed_uuid.mp4

T4: User downloads
    └─→ File streamed to browser
    └─→ Cleanup scheduled (30 min)

T5: Auto-cleanup (30 min after processing)
    └─→ Delete: tmp/uploads/uuid_video.mp4
    └─→ Delete: tmp/processed/thumb_uuid.jpg
    └─→ Delete: tmp/processed/preview_uuid.jpg
    └─→ Delete: tmp/processed/processed_uuid.mp4
    
Result: No files on server
```

---

## Error Handling Strategy

### Frontend (React)

```javascript
try {
    response = await uploadVideos(files);
} catch (error) {
    addError(`Upload failed: ${error.message}`);
    // User sees toast notification
    // Can retry upload
}
```

### Backend (FastAPI)

```python
@app.post("/upload")
async def upload_videos(files: List[UploadFile]):
    for file in files:
        if file.size > 500MB:
            raise HTTPException(400, "File too large")
        if not file.content_type in ALLOWED:
            raise HTTPException(400, "Invalid format")
        # Process...
```

### Errors Handled

- ✅ File too large (> 500MB)
- ✅ Invalid video format
- ✅ Corrupted video file
- ✅ Audio extraction failure (skip silently)
- ✅ Inpainting failure
- ✅ Video processing timeout
- ✅ Network disconnection
- ✅ Missing required parameters

---

## Scalability Considerations

### Current Limitations

- **Sequential Processing**: Videos processed one at a time
- **Memory**: Entire frame held in memory
- **Storage**: Temp files deleted after 30 minutes
- **Concurrency**: Single backend instance

### Scaling Options

1. **Horizontal Scaling** (Multiple Instances)
   - Load balancer in front
   - Shared temp storage (S3, GCS)
   - Redis for job queue

2. **Async Processing**
   - Add Celery + Redis
   - Background job queue
   - Webhook notifications

3. **Chunked Processing**
   - Process video in 1-minute chunks
   - Reduce memory usage
   - Better for very large videos

4. **GPU Acceleration**
   - Use CUDA with OpenCV
   - 10-100x faster processing
   - Requires GPU-capable server

---

## Security Considerations

### Input Validation
- ✅ File extension check
- ✅ File size limit (500MB)
- ✅ Mimetype validation
- ✅ Bounding box bounds check

### Output Security
- ✅ Files stream (not direct path exposure)
- ✅ Auto-delete after use
- ✅ No server-side storage of processed videos

### CORS Protection
- ✅ Whitelist allowed origins
- ✅ Reject cross-origin requests
- ✅ Environment-specific configuration

### No Auth (By Design)
- ✅ Intentionally anonymous (no user tracking)
- ✅ Session-based state (client-side)
- ✅ Could add JWT if needed

---

## Performance Optimization

### Backend

```python
# Chunked frame processing
CHUNK_SIZE = 100  # Process 100 frames at a time
while True:
    frames = cap.read_batch(CHUNK_SIZE)
    if not frames:
        break
    process_frames(frames)  # Batch inpainting
```

### Frontend

```javascript
// Lazy load components
const UploadZone = lazy(() => import('./UploadZone'));
const CanvasSelector = lazy(() => import('./CanvasSelector'));

// Memoize expensive renders
const MemoizedCanvas = memo(CanvasSelector);
```

---

## Deployment Architecture

### Development
```
Localhost:5173 (React) → Localhost:8000 (FastAPI)
```

### Production
```
Vercel (Frontend)  →  Railway (Backend)
https://app...     →  https://api...
```

### Docker
```
docker-compose.yml
├─ backend (port 8000)
└─ frontend (port 5173)
```

---

## Database Schema (None!)

**Key Design Decision:** Stateless architecture

- No database needed
- All state client-side
- Temp files auto-delete
- Reduces complexity & cost
- Perfect for this use case

If needed in future:
```sql
CREATE TABLE videos (
    id UUID PRIMARY KEY,
    user_id UUID,
    filename VARCHAR,
    upload_time TIMESTAMP,
    processed_time TIMESTAMP,
    watermark_region JSONB,
    status VARCHAR,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Monitoring & Observability

### Backend Logs

```python
logger.info(f"Processing video: {video_id}")
logger.warning(f"Large watermark region: {bbox}")
logger.error(f"Inpainting failed: {error}")
```

### Frontend Console

```javascript
console.log('Upload started', videoId);
console.warn('Preview failed', error);
console.error('Processing error', error);
```

### Metrics to Track

- Upload success rate
- Average processing time
- Peak concurrent users
- Error rate
- Storage usage

---

## Summary

**Architecture Principles:**
1. ✅ **Stateless**: No server-side state (except temp files)
2. ✅ **Scalable**: Horizontal scaling possible
3. ✅ **Simple**: No database, no complex dependencies
4. ✅ **Fast**: Direct processing, minimal overhead
5. ✅ **Reliable**: Error handling throughout
6. ✅ **Secure**: Input validation, CORS protected

**Tech Decisions:**
- FastAPI: Modern, fast, easy to use
- React: Component-based, reactive UI
- OpenCV: Mature, fast computer vision library
- Vercel/Railway: Serverless-like simplicity
- No database: Keeps it simple

**Production Ready:**
- Error handling ✅
- CORS configured ✅
- Docker support ✅
- Deployment configs ✅
- Documentation ✅

---
