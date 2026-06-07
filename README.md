# 🎬 Video Watermark Remover

A free, easy-to-use web tool to remove watermarks from single or bulk videos. Upload your videos, manually select the watermark region, and download the cleaned video(s) with the watermark removed. **No paid APIs, no limits, all processing via Python/OpenCV on the backend.**

## ✨ Features

- **Bulk Processing**: Upload and process multiple videos at once
- **Visual Region Selection**: Interactive canvas to draw and preview watermark removal
- **Real-time Preview**: See exactly how the removal will look before processing
- **Audio Preservation**: Keeps original audio track intact
- **No Limits**: Process unlimited videos (within server capacity)
- **Mobile Responsive**: Works on desktop, tablet, and mobile devices
- **Dark Theme**: Modern, clean UI with dark mode
- **No Login Required**: Completely anonymous usage
- **No Database**: Stateless file processing only

## 🏗️ Project Structure

```
watermark-remover/
├── backend/                 # FastAPI server
│   ├── main.py             # FastAPI endpoints
│   ├── processor.py        # OpenCV watermark removal logic
│   ├── utils.py            # File handling & utilities
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile          # Docker configuration
│   ├── railway.toml        # Railway deployment config
│   └── .env.example        # Environment variables template
├── frontend/               # React Vite application
│   ├── src/
│   │   ├── App.jsx        # Main app component
│   │   ├── api.js         # API client
│   │   ├── App.css        # Main styles
│   │   ├── index.css      # Global styles
│   │   ├── main.jsx       # Entry point
│   │   └── components/
│   │       ├── UploadZone.jsx      # File upload component
│   │       ├── CanvasSelector.jsx  # Watermark region selection
│   │       ├── PreviewPanel.jsx    # Region preview
│   │       ├── ProgressBar.jsx     # Processing progress
│   │       ├── DownloadPanel.jsx   # Download results
│   │       └── [*.css files]       # Component styles
│   ├── index.html         # HTML entry point
│   ├── package.json       # Dependencies
│   ├── vite.config.js     # Vite configuration
│   └── .env.example       # Environment variables template
├── vercel.json            # Vercel frontend config
└── README.md              # This file
```

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Python 3.9+** (for backend)
- **Node.js 16+** (for frontend)
- **FFmpeg** (for audio extraction/merging)
- **uv** (modern Python package manager)

### Backend Setup

1. **Install uv (if not already installed):**
   ```bash
   # macOS/Linux
   curl -LsSf https://astral.sh/uv/install.sh | sh
   
   # Windows (PowerShell)
   powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```

2. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

3. **Create and activate virtual environment:**
   ```bash
   # On Windows
   python -m venv venv
   venv\Scripts\activate

   # On macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

4. **Install dependencies with uv:**
   ```bash
   uv pip install -e .
   ```

5. **Ensure FFmpeg is installed:**
   ```bash
   # On Windows (with Chocolatey)
   choco install ffmpeg

   # On macOS (with Homebrew)
   brew install ffmpeg

   # On Linux (Ubuntu/Debian)
   sudo apt-get install ffmpeg
   ```

6. **Run the backend:**
   ```bash
   python main.py
   ```

   The backend will start at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory (in a new terminal):**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create .env file:**
   ```bash
   cp .env.example .env
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

   The frontend will open at `http://localhost:5173`

## 📖 Usage Guide

### Step 1: Upload Videos
- Drag and drop video files or click to browse
- Supported formats: MP4, MOV, AVI, MKV, WEBM
- Max 500MB per video
- Select multiple files for bulk processing

### Step 2: Select Watermark Region
- For each video, a preview frame is displayed
- Click and drag on the canvas to draw a rectangle around the watermark
- Live coordinates update (X, Y, Width, Height)
- Click "Preview Removal" to see inpainting result
- Adjust the region if needed
- For bulk: Toggle "Apply same region to all videos" to use the same region for all files

### Step 3: Processing
- Click "Remove Watermark" or "Process All" for bulk
- Progress bar shows processing status
- Processing happens sequentially on the backend

### Step 4: Download
- Download individual videos
- For bulk: Download all as a ZIP file
- Click "Process Another Video" to start over

## 🔧 API Endpoints

### Upload Videos
```http
POST /upload
Content-Type: multipart/form-data

Files: video1.mp4, video2.mp4
```
**Response:**
```json
[
  {
    "video_id": "uuid",
    "filename": "video1.mp4",
    "thumbnail_url": "/thumbnail/uuid",
    "width": 1920,
    "height": 1080,
    "fps": 30.0
  }
]
```

### Preview Removal
```http
POST /preview
Content-Type: application/json

{
  "video_id": "uuid",
  "bbox": {
    "x": 100,
    "y": 200,
    "width": 200,
    "height": 100
  }
}
```

### Process Single Video
```http
POST /process
Content-Type: application/json

{
  "video_id": "uuid",
  "bbox": {
    "x": 100,
    "y": 200,
    "width": 200,
    "height": 100
  }
}
```

### Process Bulk Videos
```http
POST /process-bulk
Content-Type: application/json

{
  "items": [
    {
      "video_id": "uuid1",
      "bbox": {"x": 100, "y": 200, "width": 200, "height": 100}
    },
    {
      "video_id": "uuid2",
      "bbox": {"x": 150, "y": 250, "width": 180, "height": 90}
    }
  ]
}
```

### Download Video
```http
GET /download/{video_id}
```

### Get Thumbnail
```http
GET /thumbnail/{video_id}
```

### Get Processing Status
```http
GET /status/{video_id}
```

### Cleanup Video Files
```http
DELETE /cleanup/{video_id}
```

## 🌐 Deployment

### Deploy Backend on Railway

1. **Create Railway account** at [railway.app](https://railway.app)

2. **Connect your GitHub repository:**
   - Click "New Project" → "Deploy from GitHub"
   - Select your repository

3. **Configure environment variables:**
   - Add `CORS_ORIGINS` (your Vercel frontend URL)
   - Example: `https://myapp.vercel.app`

4. **Railway will automatically:**
   - Build the Docker image
   - Deploy the backend
   - Provide a public URL

5. **Note the backend URL** (e.g., `https://myapp-backend.up.railway.app`)

### Deploy Frontend on Vercel

1. **Create Vercel account** at [vercel.com](https://vercel.com)

2. **Import your GitHub repository:**
   - Click "New Project" → "Import Git Repository"
   - Select your repository

3. **Configure environment variables:**
   - Go to Project Settings → Environment Variables
   - Add `VITE_API_BASE_URL` = your Railway backend URL
   - Example: `https://myapp-backend.up.railway.app`

4. **Deploy:**
   - Vercel automatically deploys on push to main branch
   - View your site at the provided URL

### Docker Deployment (Manual)

**Backend:**
```bash
cd backend
docker build -t watermark-remover:latest .
docker run -p 8000:8000 \
  -e CORS_ORIGINS="http://localhost:5173" \
  watermark-remover:latest
```

## ⚙️ Configuration

### Backend Environment Variables

Create `.env` file in `backend/` directory:

```env
# CORS configuration
CORS_ORIGINS=http://localhost:5173,https://yourdomain.vercel.app

# File upload limits (in MB)
MAX_UPLOAD_SIZE_MB=500

# Auto-cleanup old temp files (in hours)
TEMP_FILES_CLEANUP_HOURS=0.5
```

### Frontend Environment Variables

Create `.env` file in `frontend/` directory:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:8000

# For production:
# VITE_API_BASE_URL=https://your-backend-url.railway.app
```

## 🧠 How It Works

### Watermark Removal Algorithm

1. **Region Selection**: User draws a bounding box around the watermark
2. **Mask Creation**: Binary mask is generated from the bounding box
3. **Inpainting**: OpenCV's `cv2.inpaint()` with `INPAINT_TELEA` algorithm fills the masked region
4. **Frame Processing**: Algorithm applies to every frame in the video
5. **Audio Preservation**: Original audio is extracted, video is reprocessed, then audio is remerged
6. **Output**: MP4 file with H.264 codec at original FPS and resolution

### Technical Details

- **Inpainting Algorithm**: INPAINT_TELEA (Telea's algorithm)
- **Video Codec**: H.264 (mp4v)
- **Audio Format**: AAC
- **Frame Rate**: Preserved from original
- **Resolution**: Preserved from original
- **Max Selection Size**: Warning if > 15% of frame

## 🛠️ Development

### Backend Dependencies

- **FastAPI**: Web framework
- **Uvicorn**: ASGI server
- **OpenCV**: Video processing & inpainting
- **NumPy**: Numerical operations
- **python-multipart**: Multipart form support
- **aiofiles**: Async file operations

### Frontend Dependencies

- **React**: UI framework
- **Vite**: Build tool
- **Axios**: HTTP client

### Scripts

**Frontend:**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

**Backend:**
```bash
python main.py   # Run development server
```

## 📝 Error Handling

The application handles various error scenarios:

- **File Too Large**: Shows error if > 500MB
- **Invalid Format**: Only accepts supported video formats
- **Corrupted Videos**: Graceful error message
- **Audio-less Videos**: Skips audio merge silently
- **Large Watermark Region**: Warns if > 15% of frame
- **Network Timeouts**: Shows retry button on frontend

## 🔒 Security & Privacy

- **No User Tracking**: Completely anonymous
- **No Database**: No user data stored
- **No Authentication**: No login required
- **Stateless Processing**: Files deleted after processing or 30 minutes
- **Client-side State**: All state is client-side only
- **CORS Protected**: Backend validates origin

## 📦 Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

## 🐛 Known Limitations

1. **Processing Speed**: Dependent on video length and server resources
2. **Memory Usage**: Large videos may require more memory
3. **Inpainting Quality**: Results depend on watermark clarity and surrounding content
4. **Audio**: Videos without audio streams are processed silently
5. **Concurrent Processing**: Backend processes videos sequentially

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License. See LICENSE file for details.

## ⚠️ Disclaimer

This tool is provided for educational and legitimate purposes. Users are responsible for ensuring they have the right to modify videos they upload. The tool should not be used to:

- Remove watermarks from copyrighted content you don't own
- Violate intellectual property rights
- Remove creator attribution marks without permission

## 🙏 Acknowledgments

- OpenCV for computer vision capabilities
- FastAPI for the backend framework
- React/Vite for the frontend
- Railway and Vercel for hosting platforms

## 💬 Support

For issues, questions, or suggestions:

1. Open an issue on GitHub
2. Check existing issues for similar problems
3. Provide detailed error messages and steps to reproduce

## 📊 Performance Tips

### For Better Results:

1. **Clear Watermarks**: Works best on simple, flat watermarks
2. **Stable Background**: Better results when watermark is on uniform background
3. **Smaller Region**: Select just the watermark, not extra area
4. **Video Quality**: Higher quality videos produce better results

### For Faster Processing:

1. **Smaller Videos**: Process videos with lower resolution when possible
2. **Shorter Duration**: Shorter videos process faster
3. **Server Resources**: Deploy backend with sufficient CPU/memory
4. **Batch Processing**: Process multiple videos in bulk (no overhead per file)

---

**Made with ❤️ for content creators**

