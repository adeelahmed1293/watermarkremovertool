# Quick Start Guide

## Local Development (5 minutes)

### 1. Install Prerequisites
- Python 3.9+
- Node.js 16+
- FFmpeg
- uv (modern Python package manager)

```bash
# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh
# Windows: powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 2. Backend Setup (Terminal 1)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
uv pip install -e .
python main.py
```

You should see: `INFO:     Uvicorn running on http://0.0.0.0:8000`

### 3. Frontend Setup (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Browser will open at `http://localhost:5173`

### 4. Start Using!
- Upload a video with a watermark
- Draw a rectangle around the watermark
- Click "Preview Removal" to see results
- Click "Remove Watermark" to process
- Download your cleaned video!

## Production Deployment

### Option A: Railway + Vercel (Recommended)

**Backend (Railway):**
1. Push code to GitHub
2. Go to railway.app → New Project → Deploy from GitHub
3. Select your repo and branch
4. Add environment variable `CORS_ORIGINS=https://yourdomain.vercel.app`
5. Copy the Railway URL (e.g., `https://backend-uuid.railway.app`)

**Frontend (Vercel):**
1. Go to vercel.com → Add New → Project
2. Import your GitHub repo
3. Add environment variable `VITE_API_BASE_URL=<your-railway-url>`
4. Deploy!

### Option B: Docker (Self-Hosted)

```bash
# Build backend image
cd backend
docker build -t watermark-remover .

# Run backend
docker run -p 8000:8000 watermark-remover

# Build and run frontend separately or use Docker Compose
```

## Troubleshooting

**"FFmpeg not found"**
- Install FFmpeg: `brew install ffmpeg` (macOS) or `choco install ffmpeg` (Windows)

**"Port 8000 already in use"**
- Change port in `main.py`: `uvicorn.run(app, host="0.0.0.0", port=8001)`

**"Videos not uploading"**
- Check file size < 500MB
- Check video format is MP4, MOV, AVI, MKV, or WEBM
- Check backend is running at `http://localhost:8000`

**"Inpainting looks bad"**
- Try selecting a smaller region (just the watermark)
- Ensure watermark is on a relatively uniform background
- The algorithm works best on simple, flat watermarks

## Environment Variables

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8000
```

### Backend (.env)
```
CORS_ORIGINS=http://localhost:5173
MAX_UPLOAD_SIZE_MB=500
TEMP_FILES_CLEANUP_HOURS=0.5
```

## API Base URLs

**Development:**
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

**Production (Railway/Vercel):**
- Frontend: `https://yourdomain.vercel.app`
- Backend: `https://yourdomain-backend.railway.app`

## Next Steps

1. Try removing watermarks from your videos
2. Customize styling in `frontend/src/App.css`
3. Modify watermark algorithm in `backend/processor.py`
4. Deploy to production when ready

Need help? Check README.md for detailed documentation.
