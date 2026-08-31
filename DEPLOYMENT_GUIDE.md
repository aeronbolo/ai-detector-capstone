# AI Detector — Deployment Guide

This guide explains how to deploy the AI Detector application to production using:
- **Frontend**: Firebase Hosting (free, CDN-backed)
- **Backend**: Render.com (free tier with limitations, or $7/mo Starter plan)

---

## Prerequisites

1. **Firebase CLI** — already installed ✓
2. **Git** — for version control
3. **GitHub account** — to host the code repository
4. **Render.com account** — sign up at https://render.com (free)

---

## Part 1 — Deploy Frontend to Firebase Hosting

### Step 1.1 — Login to Firebase

```powershell
cd "C:\Users\temp\Desktop\Capstone Project"
firebase login
```

This opens your browser to authenticate with Google.

### Step 1.2 — Deploy

```powershell
firebase deploy --only hosting
```

**Your frontend will be live at:**
```
https://capstone-project-96d2e.web.app
https://capstone-project-96d2e.firebaseapp.com
```

Both URLs work identically.

### Step 1.3 — Update Backend CORS

After deployment, update `backend/.env` or Render environment variables to allow your production frontend:

```
ALLOWED_ORIGINS=https://capstone-project-96d2e.web.app,https://capstone-project-96d2e.firebaseapp.com,http://localhost:5174
```

---

## Part 2 — Deploy Backend to Render.com

### Step 2.1 — Push Code to GitHub

```powershell
cd "C:\Users\temp\Desktop\Capstone Project"

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - AI Detector backend + frontend"

# Create a new GitHub repo at https://github.com/new
# Then push to it:
git remote add origin https://github.com/YOUR_USERNAME/ai-detector.git
git branch -M main
git push -u origin main
```

### Step 2.2 — Deploy on Render.com

1. Go to https://render.com/dashboard
2. Click **New +** → **Web Service**
3. Connect your GitHub account
4. Select the `ai-detector` repository
5. Render auto-detects `backend/render.yaml` and pre-fills:
   - **Name**: `ai-detector-backend`
   - **Runtime**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **Region**: Oregon (or choose Singapore for lower latency to Philippines)
   - **Plan**: Free (or Starter $7/mo for 1 GB RAM + no sleep)

6. **Set Environment Variables** in the Render dashboard:

   | Key | Value |
   |-----|-------|
   | `FIREBASE_PROJECT_ID` | `capstone-project-96d2e` |
   | `FIREBASE_SERVICE_ACCOUNT_JSON` | Paste the **entire** contents of `capstone-project-96d2e-firebase-adminsdk-fbsvc-1848a2c079.json` as a **single-line string** (use an online JSON minifier if needed) |
   | `ALLOWED_ORIGINS` | `https://capstone-project-96d2e.web.app,https://capstone-project-96d2e.firebaseapp.com` |
   | `MAX_IMAGE_SIZE_MB` | `50` |
   | `MAX_VIDEO_SIZE_MB` | `500` |
   | `SKIP_AUTH` | `false` |

7. Click **Create Web Service**

Render will:
- Build the Docker image (~5-10 minutes first time)
- Download ML models into the image (~330 MB + 200 MB)
- Deploy the backend

**Your backend will be live at:**
```
https://ai-detector-backend.onrender.com
```

(The exact URL is shown in the Render dashboard)

### Step 2.3 — Update Frontend API URL

Update `frontend/.env` (or create `frontend/.env.production`):

```env
VITE_API_URL=https://ai-detector-backend.onrender.com
```

Then rebuild and redeploy the frontend:

```powershell
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

---

## Part 3 — Post-Deployment Configuration

### Update Firebase Rules (if not already done)

Go to **Firebase Console → Firestore → Rules** and ensure the production rules are published:

https://console.firebase.google.com/project/capstone-project-96d2e/firestore/rules

### Test the Deployment

1. Open https://capstone-project-96d2e.web.app
2. Register a new account
3. Upload an image → verify detection works
4. Go to History page → verify past analyses load
5. Login as admin → verify admin dashboard loads

---

## Render.com Free Tier Limitations

⚠️ **The free tier has important limitations:**

1. **512 MB RAM** — tight fit for both models (~530 MB total). Upgrade to Starter ($7/mo) for 1 GB.
2. **Sleeps after 15 min inactivity** — first request after sleep takes ~30 seconds to wake up.
3. **No custom domain** — use `*.onrender.com` subdomain only.

**Recommended:** Upgrade to Starter plan ($7/mo) for:
- 1 GB RAM (comfortable fit for models)
- No sleep (instant responses)
- Better performance

---

## Alternative Backend Hosting Options

If Render.com free tier is too slow:

### Option A — Render.com Starter Plan
- **Cost**: $7/month
- **Pros**: 1 GB RAM, no sleep, fast
- **Cons**: Still limited to 1 vCPU

### Option B — AWS EC2 t3.medium
- **Cost**: ~$30/month (on-demand) or ~$18/month (1-year reserved)
- **Pros**: 4 GB RAM, 2 vCPU, full control
- **Cons**: Requires manual setup (Docker, reverse proxy, SSL)

### Option C — Google Cloud Run
- **Cost**: Pay-per-request (first 2M requests/month free)
- **Pros**: Auto-scales, generous free tier
- **Cons**: Coldstart latency, complex setup

**For your capstone demo, Render.com Starter ($7/mo) is the best balance of cost and performance.**

---

## Troubleshooting

### Frontend builds but shows blank page
- Check browser console for errors
- Verify API URL in `.env.production` matches your Render backend URL

### Backend deploys but returns 500 errors
- Check Render logs: Dashboard → your service → Logs
- Verify `FIREBASE_SERVICE_ACCOUNT_JSON` is set correctly (entire JSON as single line)

### "CORS policy" errors
- Add your frontend URL to `ALLOWED_ORIGINS` in Render environment variables
- Redeploy backend after changing env vars

### Models fail to load (OOM errors)
- Upgrade to Render Starter plan (1 GB RAM)
- Or reduce model cache in Dockerfile by commenting out the pre-download step

---

## Summary

✅ **Frontend**: https://capstone-project-96d2e.web.app  
✅ **Backend**: https://ai-detector-backend.onrender.com  
✅ **Admin Dashboard**: https://capstone-project-96d2e.web.app/admin  
✅ **Firestore**: Already configured  
✅ **Firebase Auth**: Already configured  

**Your application is now publicly accessible!**

---

## Next Steps

1. Share the URL with your capstone committee
2. Monitor usage in Firebase Console (Analytics, Firestore)
3. Check Render logs for backend errors
4. Consider upgrading to Starter plan before your defense for reliable performance

Good luck with your defense! 🎓
