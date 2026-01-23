# 🚀 Vercel Deployment Guide - Galaxy AI

Complete step-by-step guide to deploy Galaxy AI on Vercel with all environment variables.

---

## 📋 Prerequisites

1. **GitHub Account** (for code repository)
2. **Vercel Account** (sign up at https://vercel.com)
3. **Clerk Account** (for authentication)
4. **Google AI API Keys** (optional, for real AI responses)
5. **PostgreSQL Database** (optional, for data persistence)

---

## 🎯 Step 1: Prepare Your Code

### 1.1 Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Galaxy AI workflow builder"

# Create repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/galaxy-ai.git
git branch -M main
git push -u origin main
```

**Important:** Make sure `.env.local` is in `.gitignore` (already done ✅)

---

## 🎯 Step 2: Deploy to Vercel

### 2.1 Import Project

1. Go to **https://vercel.com**
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### 2.2 Configure Build Settings

Vercel automatically detects Next.js, but verify:
- **Framework Preset:** Next.js
- **Root Directory:** `./` (default)
- **Build Command:** `npm run build` (auto-detected)
- **Output Directory:** `.next` (auto-detected)
- **Install Command:** `npm install` (auto-detected)

---

## 🔐 Step 3: Add Environment Variables

### 3.1 In Vercel Dashboard

Go to your project → **Settings** → **Environment Variables**

### 3.2 Add These Variables:

#### **Required Variables:**

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database (if using PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

#### **Optional Variables:**

```env
# Google Gemini API (comma-separated for multiple keys)
GOOGLE_AI_API_KEY=key1,key2,key3

# Simulation Mode (set to "true" to bypass API, "false" for real API)
GEMINI_SIMULATION_MODE=false
```

### 3.3 Environment Variable Details:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ Yes | Clerk public key (starts with `pk_`) | `pk_test_...` |
| `CLERK_SECRET_KEY` | ✅ Yes | Clerk secret key (starts with `sk_`) | `sk_test_...` |
| `DATABASE_URL` | ⚠️ Optional | PostgreSQL connection string | `postgresql://...` |
| `GOOGLE_AI_API_KEY` | ⚠️ Optional | Gemini API keys (comma-separated) | `key1,key2,key3` |
| `GEMINI_SIMULATION_MODE` | ⚠️ Optional | Enable simulation mode | `true` or `false` |

### 3.4 Set for All Environments:

For each variable, select:
- ✅ **Production**
- ✅ **Preview**
- ✅ **Development**

---

## 🗄️ Step 4: Setup Database (Optional)

### Option A: Vercel Postgres (Recommended)

1. In Vercel Dashboard → **Storage** → **Create Database**
2. Select **Postgres**
3. Choose region (closest to you)
4. Copy the `DATABASE_URL` from **.env.local** tab
5. Add to Environment Variables

### Option B: External PostgreSQL

Use services like:
- **Supabase** (free tier available)
- **Neon** (free tier available)
- **Railway** (free tier available)

Get connection string and add to `DATABASE_URL`

### 4.1 Run Prisma Migrations

After adding `DATABASE_URL`, run:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push
```

**OR** add to Vercel Build Command:

```json
{
  "buildCommand": "prisma generate && prisma db push && next build"
}
```

---

## 🚀 Step 5: Deploy

### 5.1 First Deployment

1. Click **"Deploy"** button in Vercel
2. Wait for build to complete (2-5 minutes)
3. Check build logs for errors

### 5.2 Verify Deployment

1. Visit your deployment URL: `https://your-project.vercel.app`
2. Test authentication (Clerk login)
3. Test workflow creation
4. Test LLM node (if API keys configured)

---

## 🔧 Step 6: Post-Deployment Setup

### 6.1 Update Clerk Allowed URLs

1. Go to **Clerk Dashboard** → **Domains**
2. Add your Vercel domain:
   - `https://your-project.vercel.app`
   - `https://*.vercel.app` (for preview deployments)

### 6.2 Test Environment Variables

Create a test API route to verify:

```typescript
// app/api/test-env/route.ts
export async function GET() {
  return Response.json({
    hasClerk: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    hasDatabase: !!process.env.DATABASE_URL,
    hasGemini: !!process.env.GOOGLE_AI_API_KEY,
    simulationMode: process.env.GEMINI_SIMULATION_MODE,
  });
}
```

Visit: `https://your-project.vercel.app/api/test-env`

---

## 🐛 Troubleshooting

### Build Fails

**Error:** `Module not found`
- **Fix:** Check `package.json` dependencies are correct

**Error:** `Prisma Client not generated`
- **Fix:** Add `prisma generate` to build command

**Error:** `Environment variable missing`
- **Fix:** Verify all variables are added in Vercel dashboard

### Runtime Errors

**Error:** `Clerk authentication not working`
- **Fix:** Check Clerk keys and allowed URLs

**Error:** `Database connection failed`
- **Fix:** Verify `DATABASE_URL` format and database is accessible

**Error:** `Gemini API rate limit`
- **Fix:** Add more API keys or enable `GEMINI_SIMULATION_MODE=true`

---

## 📝 Quick Checklist

Before deploying, ensure:

- [ ] Code pushed to GitHub
- [ ] `.env.local` is in `.gitignore`
- [ ] All environment variables added to Vercel
- [ ] Clerk URLs configured
- [ ] Database connected (if using)
- [ ] Build command includes Prisma (if using DB)
- [ ] Test deployment works

---

## 🎉 Success!

Your Galaxy AI workflow builder is now live on Vercel!

**Next Steps:**
1. Share your deployment URL
2. Test all features
3. Monitor usage in Vercel dashboard
4. Set up custom domain (optional)

---

## 📞 Support

If you face any issues:
1. Check Vercel build logs
2. Check browser console for errors
3. Verify environment variables
4. Test API routes individually

---

**Happy Deploying! 🚀**
