# Fix Vercel 404 Error

## Step 1: Set Root Directory (CRITICAL)

1. Go to [vercel.com](https://vercel.com) → Your project → **Settings**
2. Under **General** → **Root Directory**
3. Click **Edit**
4. Enter: **Neurofro**
5. Click **Save**

## Step 2: Redeploy

1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. Wait for build to complete

## Step 3: Verify

Visit your deployment URL (e.g. `https://your-project.vercel.app`). The homepage should load.

---

**Why this fixes 404:** Your Next.js app lives in the `Neurofro` folder. Vercel was building from the repo root (which has no app), so it returned 404. Setting Root Directory to `Neurofro` tells Vercel where the app is.
