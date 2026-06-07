# Deployment Guide

## Overview

This guide covers deploying the Video Watermark Remover application to production using:
- **Frontend**: Vercel
- **Backend**: Railway or Render
- **Files**: GitHub

Total deployment time: ~15 minutes

---

## Prerequisites

- GitHub account with your code repository
- Vercel account (free at vercel.com)
- Railway or Render account (free tier available)
- Your backend API URL (will get after deployment)

---

## Step 1: Prepare Your Repository

### 1.1 Create GitHub Repository

```bash
git init
git add .
git commit -m "Initial commit: Video Watermark Remover"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/watermark-remover.git
git push -u origin main
```

### 1.2 Verify Repository Structure

Your GitHub repo should have:
```
watermark-remover/
├── backend/
├── frontend/
├── vercel.json
├── docker-compose.yml
├── README.md
└── ...
```

---

## Step 2: Deploy Backend (Railway)

### 2.1 Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign up with GitHub

### 2.2 Deploy from GitHub

1. Click "Deploy from GitHub"
2. Select your `watermark-remover` repository
3. Choose branch: `main`
4. Railway will auto-detect the Python project

### 2.3 Configure Environment

1. Go to your Railway project settings
2. Click "Variables" tab
3. Add environment variables:

```env
CORS_ORIGINS=https://watermark-remover-YOUR_USERNAME.vercel.app
MAX_UPLOAD_SIZE_MB=500
TEMP_FILES_CLEANUP_HOURS=0.5
```

### 2.4 Get Backend URL

1. Go to project "Settings"
2. Look for "Public URL" (example: `https://watermark-remover-backend-production.up.railway.app`)
3. **Copy this URL** - you'll need it for frontend

### 2.5 Monitor Deployment

```
Expected steps:
1. Build stage: Installing Python packages with uv (1-2 min)
2. Deploy stage: Starting Uvicorn server (1 min)
3. Watch status → Should say "Running"
```

**Troubleshooting:**
- Check "Deployments" tab for build logs
- Ensure all dependencies in `pyproject.toml`
- Check FFmpeg is included in Dockerfile

---

## Step 3: Deploy Frontend (Vercel)

### 3.1 Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize access

### 3.2 Import Project

1. Click "Add New" → "Project"
2. Click "Import Git Repository"
3. Select your `watermark-remover` repo
4. Click "Import"

### 3.3 Configure Build Settings

Vercel should auto-detect settings, but verify:

**Framework Preset:** React

**Root Directory:** Leave blank (uses project root)

**Build Command:** `cd frontend && npm run build`

**Output Directory:** `frontend/dist`

### 3.4 Set Environment Variables

1. Go to "Settings" → "Environment Variables"
2. Add variable:
   ```
   Name: VITE_API_BASE_URL
   Value: https://watermark-remover-backend-production.up.railway.app
   ```
   *(Use your Railway URL from Step 2.4)*

3. Click "Add" and save

### 3.5 Deploy

1. Click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. You'll get a URL: `https://watermark-remover-YOUR_USERNAME.vercel.app`
4. Visit it to test!

### 3.6 Update CORS on Backend

Now that you have your Vercel URL, update your Railway backend:

1. Go back to Railway project
2. Click "Variables"
3. Update `CORS_ORIGINS`:
   ```
   https://watermark-remover-YOUR_USERNAME.vercel.app
   ```
4. Save and redeploy

---

## Step 4: Test Deployment

### 4.1 Frontend Health Check

Visit your Vercel URL: `https://your-domain.vercel.app`

Should see:
- Header with app title ✓
- Upload zone ✓
- Step indicators ✓

### 4.2 Backend Health Check

Test the health endpoint:
```bash
curl https://your-backend-url.up.railway.app/health
```

Response should be:
```json
{"status": "healthy"}
```

### 4.3 Full Workflow Test

1. Upload a small test video
2. Select watermark region
3. Preview removal
4. Process video
5. Download result

---

## Step 5: Set Up Custom Domain (Optional)

### 5.1 Vercel Custom Domain

1. Go to Vercel Project Settings
2. Click "Domains"
3. Enter your domain: `watermark.example.com`
4. Add DNS records as instructed
5. Wait for verification (5-15 minutes)

### 5.2 Railway Custom Domain

For backend:
1. Railway project → Settings → Domain
2. Add your domain: `api.watermark.example.com`
3. Update DNS records
4. Update frontend `VITE_API_BASE_URL` to new domain

---

## Step 6: Configure Domain Email (Optional)

To receive deployment notifications:

**Vercel:**
- Settings → Notifications → Email

**Railway:**
- Account → Notifications → Email

---

## Deployment Checklist

- [ ] Code pushed to GitHub main branch
- [ ] Backend deployed on Railway
- [ ] Backend environment variables set
- [ ] Backend health check passes
- [ ] Frontend deployed on Vercel
- [ ] Frontend environment variables set
- [ ] CORS configured with frontend domain
- [ ] Full workflow test passed
- [ ] Backend URL stable and responding
- [ ] Frontend loads and displays correctly
- [ ] Upload functionality works
- [ ] Canvas selection works
- [ ] Preview works
- [ ] Processing works
- [ ] Download works

---

## Performance Optimization

### Backend (Railway)

1. **Increase Resources:**
   ```yaml
   - Go to Settings → Plan
   - Upgrade to higher tier if needed
   - Default (free) handles ~1000 videos/day
   ```

2. **Monitor Usage:**
   - Check "Metrics" tab for CPU/Memory
   - Watch "Deployments" for crashes

3. **Enable Auto-scaling:**
   - Not available on free tier
   - Consider upgrading for production

### Frontend (Vercel)

1. **Caching:**
   - Vercel handles CDN caching automatically
   - Images cached at edge

2. **Analytics:**
   - Vercel → Analytics tab
   - Monitor Core Web Vitals

3. **Serverless Functions:**
   - Currently not used
   - Can add for advanced features

---

## Monitoring & Maintenance

### Daily Monitoring

1. **Check Backend Status:**
   ```bash
   curl https://your-backend-url.up.railway.app/health
   ```

2. **Monitor Vercel:**
   - Dashboard → Activity
   - Check for deployment errors
   - Monitor error rate

3. **Monitor Railway:**
   - Dashboard → Deployments
   - Check for crashes
   - Monitor CPU/Memory

### Weekly Maintenance

1. Check error logs
2. Review deployment logs
3. Test critical features
4. Check disk usage (temp files)

### Monthly Maintenance

1. Update dependencies
   ```bash
   # Backend
   pip install --upgrade -r requirements.txt

   # Frontend
   npm update
   ```

2. Review analytics
3. User feedback review
4. Security updates

---

## Troubleshooting Deployment Issues

### Issue: "Backend connection failed"

**Solution:**
1. Check Railway deployment status
2. Verify `VITE_API_BASE_URL` in Vercel
3. Check CORS settings in Railway
4. Test health endpoint: `curl https://backend-url/health`

### Issue: "Upload fails with 413 error"

**Solution:**
1. File exceeds 500MB
2. Backend `MAX_UPLOAD_SIZE_MB=500`
3. Ask user to use smaller file

### Issue: "Video processing hangs"

**Solution:**
1. Check Railway logs for errors
2. Increase timeout (currently no timeout)
3. Restart deployment
4. Check disk space

### Issue: "Preview not working"

**Solution:**
1. Ensure FFmpeg is installed in backend Dockerfile
2. Check video format is supported
3. Try with different bounding box

### Issue: "Audio is missing after processing"

**Solution:**
1. Backend couldn't extract audio
2. Original video may have no audio track
3. This is expected for some videos

---

## Security Best Practices

### Enable HTTPS
✓ Automatic on Vercel and Railway

### Secure Environment Variables

✓ Never commit `.env` files
✓ Use `.env.example` template
✓ Vercel/Railway encrypt env vars

### CORS Configuration

Update to specific origins only:
```env
CORS_ORIGINS=https://yourdomain.vercel.app
```

### Rate Limiting

Add to backend `main.py` (optional):
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/upload")
@limiter.limit("10/minute")
async def upload_videos(...):
    ...
```

### Monitoring & Logging

Set up error tracking:
1. **Sentry** (error tracking)
   - Add to backend: `pip install sentry-sdk`
   - Configure DSN in Railway

2. **LogRocket** (frontend monitoring)
   - Add to frontend: `npm install logrocket`

---

## Scaling for Production

### For 1000+ videos/day:

1. **Backend Upgrade:**
   - Railway: Upgrade to paid tier
   - Or migrate to cloud provider (AWS, GCP, Azure)

2. **Database:** (Optional)
   - Add PostgreSQL for video history
   - Cache processed videos

3. **CDN:**
   - Already provided by Vercel
   - Consider Cloudflare for backend

4. **Load Balancing:**
   - Multiple backend instances
   - Use load balancer

5. **Processing Queue:**
   - Add Celery + Redis for background processing
   - Currently processes synchronously

---

## Disaster Recovery

### Backup Strategy

1. **Code:** GitHub (automatic)
2. **Database:** None currently (stateless)
3. **Processed Videos:** Auto-delete after 30 min

### Restore Process

1. Redeploy from GitHub
2. Railway/Vercel auto-restore from builds

### Backup Important Config

```bash
# Save environment variables
echo $VITE_API_BASE_URL > backup.env

# Save custom domain setup
# Screenshot Railway/Vercel settings
```

---

## Cost Analysis (Monthly)

| Service | Free Tier | Pro Tier |
|---------|-----------|----------|
| Vercel | $0 | $20 |
| Railway | $5 credit | $5-20 |
| Domain | (own) | (own) |
| **Total** | **~$5** | **~$25** |

Free tier should handle:
- 10,000+ frontend page views
- 1000+ video uploads/day
- 100+ concurrent users

---

## Next Steps

1. **Test Deployment:** Follow "Step 4: Test Deployment"
2. **Monitor Performance:** Check metrics daily
3. **Gather Feedback:** Ask users for improvements
4. **Iterate:** Update features and redeploy

---

## Support Contacts

**Vercel Support:**
- Help: vercel.com/help
- Email: support@vercel.com

**Railway Support:**
- Docs: docs.railway.app
- Discord: https://discord.gg/railway

---

## Deployment Success Checklist

After completing this guide, you should have:

- ✓ Backend running on Railway
- ✓ Frontend running on Vercel
- ✓ Both services connected
- ✓ Environment variables configured
- ✓ Custom domain (optional)
- ✓ Monitoring set up
- ✓ Full workflow tested
- ✓ Production-ready application

**Congratulations! Your app is live! 🎉**

---

**Happy watermark removing!**
