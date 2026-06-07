# API Documentation

## Base URL
```
http://localhost:8000  (Development)
https://your-backend-url.railway.app  (Production)
```

## Endpoints

### 1. Upload Videos
**POST** `/upload`

Upload single or multiple video files.

**Headers:**
```
Content-Type: multipart/form-data
```

**Request:**
- `files` (FormData): List of video files to upload

**Supported Formats:**
- MP4, MOV, AVI, MKV, WEBM
- Max 500MB per file

**Response (200 OK):**
```json
[
  {
    "video_id": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "video.mp4",
    "thumbnail_url": "/thumbnail/550e8400-e29b-41d4-a716-446655440000",
    "width": 1920,
    "height": 1080,
    "fps": 30.0
  }
]
```

**Errors:**
- `400`: Invalid file type or file too large
- `500`: Server error

---

### 2. Get Thumbnail
**GET** `/thumbnail/{video_id}`

Get the thumbnail (first frame) of an uploaded video.

**Parameters:**
- `video_id` (path): UUID of the uploaded video

**Response:**
- Image file (JPEG, 200x200px recommended)

**Errors:**
- `404`: Thumbnail not found

---

### 3. Preview Watermark Removal
**POST** `/preview`

Generate a preview of the watermark removal without processing the entire video.

**Headers:**
```
Content-Type: application/json
```

**Request:**
```json
{
  "video_id": "550e8400-e29b-41d4-a716-446655440000",
  "bbox": {
    "x": 100,
    "y": 200,
    "width": 200,
    "height": 100
  }
}
```

**Parameters:**
- `video_id` (string): UUID of the uploaded video
- `bbox` (object):
  - `x` (int): X-coordinate of top-left corner (pixels)
  - `y` (int): Y-coordinate of top-left corner (pixels)
  - `width` (int): Width of selection (pixels)
  - `height` (int): Height of selection (pixels)

**Response (200 OK):**
```json
{
  "video_id": "550e8400-e29b-41d4-a716-446655440000",
  "preview_url": "/preview-image/550e8400-e29b-41d4-a716-446655440000"
}
```

**Errors:**
- `404`: Video not found
- `400`: Invalid bounding box
- `500`: Inpainting failed

---

### 4. Get Preview Image
**GET** `/preview-image/{video_id}`

Get the preview image showing the inpainting result.

**Parameters:**
- `video_id` (path): UUID of the video

**Response:**
- Image file (JPEG)

**Errors:**
- `404`: Preview not found

---

### 5. Process Single Video
**POST** `/process`

Process a single video to remove the watermark.

**Headers:**
```
Content-Type: application/json
```

**Request:**
```json
{
  "video_id": "550e8400-e29b-41d4-a716-446655440000",
  "bbox": {
    "x": 100,
    "y": 200,
    "width": 200,
    "height": 100
  }
}
```

**Parameters:**
- `video_id` (string): UUID of the video to process
- `bbox` (object): Bounding box coordinates (same format as preview)

**Response (200 OK):**
```json
{
  "video_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed"
}
```

**Processing includes:**
- Frame-by-frame inpainting
- Audio extraction and remerge (if available)
- Original FPS and resolution preservation
- H.264 MP4 output

**Errors:**
- `404`: Video not found
- `400`: Invalid parameters
- `500`: Processing failed

---

### 6. Process Bulk Videos
**POST** `/process-bulk`

Process multiple videos and return as a ZIP file.

**Headers:**
```
Content-Type: application/json
```

**Request:**
```json
{
  "items": [
    {
      "video_id": "550e8400-e29b-41d4-a716-446655440000",
      "bbox": {
        "x": 100,
        "y": 200,
        "width": 200,
        "height": 100
      }
    },
    {
      "video_id": "660e8400-e29b-41d4-a716-446655440001",
      "bbox": {
        "x": 150,
        "y": 250,
        "width": 180,
        "height": 90
      }
    }
  ]
}
```

**Parameters:**
- `items` (array): List of video processing requests
  - `video_id` (string): UUID of video
  - `bbox` (object): Bounding box coordinates

**Response (200 OK):**
- ZIP file containing all processed videos

**File naming in ZIP:**
```
watermark_removed_{video_id}.mp4
```

**Errors:**
- `404`: Video(s) not found
- `400`: Invalid parameters
- `500`: Processing failed

---

### 7. Download Processed Video
**GET** `/download/{video_id}`

Download the processed video file.

**Parameters:**
- `video_id` (path): UUID of the processed video

**Response:**
- MP4 video file (H.264 codec, original resolution & FPS)

**Headers:**
```
Content-Type: video/mp4
Content-Disposition: attachment; filename="watermark_removed_{video_id}.mp4"
```

**Errors:**
- `404`: Processed video not found

---

### 8. Get Processing Status
**GET** `/status/{video_id}`

Get current processing status of a video.

**Parameters:**
- `video_id` (path): UUID of the video

**Response (200 OK):**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "progress": 45,
  "status": "processing",
  "estimated_time_remaining": 120
}
```

**Status Values:**
- `processing`: Currently processing
- `completed`: Processing finished
- `failed`: Processing failed

**Errors:**
- `404`: Job not found

---

### 9. Cleanup Video Files
**DELETE** `/cleanup/{video_id}`

Manually delete all temporary files for a video (upload, thumbnail, preview, processed).

**Parameters:**
- `video_id` (path): UUID of the video

**Response (200 OK):**
```json
{
  "status": "cleaned"
}
```

**Errors:**
- `500`: Cleanup failed

---

### 10. Health Check
**GET** `/health`

Check if the API is running.

**Response (200 OK):**
```json
{
  "status": "healthy"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes
- `200`: Success
- `400`: Bad request (invalid parameters)
- `404`: Resource not found
- `500`: Server error
- `413`: Request entity too large (file too big)

---

## Bounding Box Coordinates

**Important:** Coordinates should be in the **original video resolution**, not the display canvas size!

If the video is 1920x1080 but displayed at 400x225:
- Display selection: (50, 40, 100, 60)
- Scale factor X: 1920 / 400 = 4.8
- Scale factor Y: 1080 / 225 = 4.8
- Actual coordinates: (240, 192, 480, 288)

The frontend handles this scaling automatically.

---

## Rate Limiting

Currently, no rate limiting is implemented. In production, consider adding:
- Max 10 concurrent uploads per IP
- Max 100 videos per day per IP
- API key authentication

---

## CORS Headers

The backend allows requests from:
- Development: `http://localhost:5173`
- Production: Your Vercel domain (e.g., `https://app.example.com`)

Configure in backend `.env`:
```
CORS_ORIGINS=http://localhost:5173,https://yourdomain.vercel.app
```

---

## Example Request Workflow

1. **Upload video:**
   ```bash
   curl -X POST http://localhost:8000/upload \
     -F "files=@video.mp4"
   ```

2. **Preview removal:**
   ```bash
   curl -X POST http://localhost:8000/preview \
     -H "Content-Type: application/json" \
     -d '{
       "video_id": "550e8400-e29b-41d4-a716-446655440000",
       "bbox": {"x": 100, "y": 200, "width": 200, "height": 100}
     }'
   ```

3. **Process video:**
   ```bash
   curl -X POST http://localhost:8000/process \
     -H "Content-Type: application/json" \
     -d '{
       "video_id": "550e8400-e29b-41d4-a716-446655440000",
       "bbox": {"x": 100, "y": 200, "width": 200, "height": 100}
     }'
   ```

4. **Download result:**
   ```bash
   curl -X GET http://localhost:8000/download/550e8400-e29b-41d4-a716-446655440000 \
     -o watermark_removed.mp4
   ```

---

## Performance Metrics

**Typical Processing Times** (1080p video @ 30fps):
- 1 minute video: ~2-3 seconds
- 5 minute video: ~10-15 seconds
- 10 minute video: ~20-30 seconds

*Times vary based on server specs and video complexity*

---

## Support

For API issues or questions:
1. Check this documentation
2. Review backend logs: `tail -f backend.log`
3. Test endpoints with curl or Postman
4. Open an issue on GitHub
