# ⚡ Quick Vercel Deployment - 5 Minutes

## 🚀 Step-by-Step

### 1️⃣ Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push
```

### 2️⃣ Go to Vercel
- Visit: https://vercel.com
- Click **"Add New Project"**
- Import your GitHub repo
- Click **"Deploy"** (don't add env vars yet)

### 3️⃣ Add Environment Variables

After first deployment, go to **Settings** → **Environment Variables**:

#### **Required:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_...
CLERK_SECRET_KEY = sk_test_...
```

#### **Optional (for real AI):**
```
GOOGLE_AI_API_KEY = key1,key2,key3
GEMINI_SIMULATION_MODE = false
```

#### **Optional (for database):**
```
DATABASE_URL = postgresql://...
```

**Important:** Select all environments (Production, Preview, Development) for each variable!

### 4️⃣ Redeploy
- Go to **Deployments** tab
- Click **"..."** on latest deployment
- Click **"Redeploy"**

### 5️⃣ Update Clerk
- Go to Clerk Dashboard
- Add your Vercel URL: `https://your-project.vercel.app`

### 6️⃣ Done! ✅
Visit your site and test it!

---

## 🔥 Quick Tips

- **No API keys?** Set `GEMINI_SIMULATION_MODE=true` for testing
- **Build fails?** Check build logs in Vercel
- **Auth not working?** Verify Clerk URLs are added

---

**Full guide:** See `DEPLOYMENT_GUIDE.md` for detailed instructions.
