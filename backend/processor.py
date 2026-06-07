import cv2
import numpy as np
from pathlib import Path
import logging
from typing import Tuple, Optional
import tempfile

logger = logging.getLogger(__name__)


class WatermarkProcessor:
    """Handles video watermark removal using OpenCV inpainting."""
    
    def __init__(self, video_path: str):
        self.video_path = video_path
        self.cap = None
        self.video_writer = None
        
    def open_video(self) -> bool:
        """Open video file."""
        try:
            self.cap = cv2.VideoCapture(self.video_path)
            return self.cap.isOpened()
        except Exception as e:
            logger.error(f"Failed to open video: {e}")
            return False
    
    def close_video(self) -> None:
        """Close video file."""
        if self.cap:
            self.cap.release()
        if self.video_writer:
            self.video_writer.release()
    
    def get_frame_count(self) -> int:
        """Get total number of frames in video."""
        if not self.cap:
            if not self.open_video():
                return 0
        return int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    def get_first_frame(self) -> Optional[np.ndarray]:
        """Extract and return the first frame."""
        if not self.cap:
            if not self.open_video():
                return None
        
        self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        ret, frame = self.cap.read()
        
        if ret:
            return frame
        return None
    
    def get_frame_dimensions(self) -> Tuple[int, int]:
        """Get video frame dimensions (width, height)."""
        if not self.cap:
            if not self.open_video():
                return (0, 0)
        
        width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        return (width, height)
    
    def get_fps(self) -> float:
        """Get video FPS."""
        if not self.cap:
            if not self.open_video():
                return 30.0
        
        fps = self.cap.get(cv2.CAP_PROP_FPS)
        return fps if fps > 0 else 30.0
    
    def create_mask(self, bbox: Tuple[int, int, int, int], 
                   frame_shape: Tuple[int, int, int]) -> np.ndarray:
        """Create a binary mask from bounding box."""
        x, y, w, h = bbox
        mask = np.zeros((frame_shape[0], frame_shape[1]), dtype=np.uint8)
        
        # Clamp to frame boundaries
        x1 = max(0, x)
        y1 = max(0, y)
        x2 = min(frame_shape[1], x + w)
        y2 = min(frame_shape[0], y + h)
        
        mask[y1:y2, x1:x2] = 255
        return mask
    
    def inpaint_frame(self, frame: np.ndarray, mask: np.ndarray) -> np.ndarray:
        """Apply inpainting to a single frame."""
        try:
            # Use INPAINT_TELEA algorithm for better results
            inpainted = cv2.inpaint(
                frame,
                mask,
                3,  # inpaint radius
                cv2.INPAINT_TELEA
            )
            return inpainted
        except Exception as e:
            logger.error(f"Inpainting failed: {e}")
            return frame
    
    def process_video(self, bbox: Tuple[int, int, int, int], 
                     output_path: str, progress_callback=None) -> bool:
        """
        Process entire video to remove watermark.
        
        Args:
            bbox: (x, y, width, height) of watermark region
            output_path: Path to save processed video
            progress_callback: Optional callback function for progress updates
        
        Returns:
            True if successful, False otherwise
        """
        try:
            if not self.open_video():
                logger.error("Could not open video")
                return False
            
            # Get video properties
            width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = self.cap.get(cv2.CAP_PROP_FPS)
            if fps <= 0:
                fps = 30.0
            
            total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            # Create mask once
            frame_shape = (height, width, 3)
            mask = self.create_mask(bbox, frame_shape)
            
            # Check if mask is too large
            if np.sum(mask) / (width * height) > 0.15:
                logger.warning("Watermark region is quite large (>15% of frame)")
            
            # Setup video writer
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            self.video_writer = cv2.VideoWriter(
                output_path,
                fourcc,
                fps,
                (width, height)
            )
            
            if not self.video_writer.isOpened():
                logger.error("Could not create video writer")
                return False
            
            # Process each frame
            frame_count = 0
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            
            while True:
                ret, frame = self.cap.read()
                if not ret:
                    break
                
                # Apply inpainting
                inpainted = self.inpaint_frame(frame, mask)
                self.video_writer.write(inpainted)
                
                frame_count += 1
                if progress_callback:
                    progress = int((frame_count / total_frames) * 100)
                    progress_callback(progress)
                
                if frame_count % 100 == 0:
                    logger.info(f"Processed {frame_count}/{total_frames} frames")
            
            self.close_video()
            logger.info(f"Successfully processed video: {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error processing video: {e}")
            self.close_video()
            return False
    
    def get_preview_frame(self, bbox: Tuple[int, int, int, int]) -> Optional[np.ndarray]:
        """Get a preview of the inpainted first frame."""
        try:
            frame = self.get_first_frame()
            if frame is None:
                return None
            
            mask = self.create_mask(bbox, frame.shape)
            preview = self.inpaint_frame(frame, mask)
            return preview
            
        except Exception as e:
            logger.error(f"Error generating preview: {e}")
            return None
