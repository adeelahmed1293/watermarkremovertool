import os
import shutil
import uuid
from pathlib import Path
from typing import Optional
import subprocess
import logging

logger = logging.getLogger(__name__)

# Create temp directories
UPLOAD_DIR = Path("tmp/uploads")
PROCESSED_DIR = Path("tmp/processed")

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


def generate_video_id() -> str:
    """Generate a unique video ID."""
    return str(uuid.uuid4())


def get_upload_path(video_id: str, filename: str) -> Path:
    """Get the path for an uploaded video."""
    return UPLOAD_DIR / f"{video_id}_{filename}"


def get_processed_path(video_id: str) -> Path:
    """Get the path for a processed video."""
    return PROCESSED_DIR / f"processed_{video_id}.mp4"


def get_thumbnail_path(video_id: str) -> Path:
    """Get the path for a video thumbnail."""
    return PROCESSED_DIR / f"thumb_{video_id}.jpg"


def cleanup_video(video_id: str) -> None:
    """Delete all temporary files associated with a video."""
    try:
        # Remove upload file
        upload_files = list(UPLOAD_DIR.glob(f"{video_id}_*"))
        for f in upload_files:
            f.unlink()
        
        # Remove processed file
        processed_file = get_processed_path(video_id)
        if processed_file.exists():
            processed_file.unlink()
        
        # Remove thumbnail
        thumb_file = get_thumbnail_path(video_id)
        if thumb_file.exists():
            thumb_file.unlink()
        
        logger.info(f"Cleaned up files for video {video_id}")
    except Exception as e:
        logger.error(f"Error cleaning up video {video_id}: {e}")


def extract_audio(input_video: str, output_audio: str) -> bool:
    """Extract audio from video using ffmpeg."""
    try:
        cmd = [
            "ffmpeg",
            "-i", input_video,
            "-q:a", "9",
            "-n",  # Don't overwrite
            output_audio
        ]
        result = subprocess.run(cmd, capture_output=True, timeout=300)
        return result.returncode == 0
    except Exception as e:
        logger.warning(f"Could not extract audio: {e}")
        return False


def merge_audio(input_video: str, audio_file: str, output_video: str) -> bool:
    """Merge audio back into video using ffmpeg."""
    try:
        cmd = [
            "ffmpeg",
            "-i", input_video,
            "-i", audio_file,
            "-c:v", "copy",
            "-c:a", "aac",
            "-map", "0:v:0",
            "-map", "1:a:0",
            "-n",  # Don't overwrite
            output_video
        ]
        result = subprocess.run(cmd, capture_output=True, timeout=300)
        return result.returncode == 0
    except Exception as e:
        logger.warning(f"Could not merge audio: {e}")
        return False


def get_video_info(video_path: str) -> Optional[dict]:
    """Get video dimensions and FPS using ffprobe."""
    try:
        cmd = [
            "ffprobe",
            "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "stream=width,height,r_frame_rate",
            "-of", "csv=p=0",
            video_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            parts = result.stdout.strip().split(',')
            width = int(parts[0])
            height = int(parts[1])
            fps_str = parts[2]
            
            # Parse FPS (could be "30/1" or "60000/1001")
            if '/' in fps_str:
                num, den = map(int, fps_str.split('/'))
                fps = num / den
            else:
                fps = float(fps_str)
            
            return {
                "width": width,
                "height": height,
                "fps": fps
            }
    except Exception as e:
        logger.warning(f"Could not get video info: {e}")
    
    return None


def cleanup_old_files(max_age_seconds: int = 1800) -> None:
    """Clean up old temporary files (30 minutes by default)."""
    try:
        import time
        current_time = time.time()
        
        for directory in [UPLOAD_DIR, PROCESSED_DIR]:
            for file_path in directory.glob("*"):
                if current_time - file_path.stat().st_mtime > max_age_seconds:
                    file_path.unlink()
                    logger.info(f"Cleaned up old file: {file_path}")
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")
