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

---

## Environment variable for API (journal, tests, NeuroTwin)

The frontend proxies `/api/backend/*` to your Flask backend. **On Vercel you must set your public API URL**, otherwise rewrites default to `http://localhost:5002`, which is unreachable from Vercel and **saving journal entries (and other API calls) will fail**.

1. Vercel → Project → **Settings** → **Environment Variables**
2. Add:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** your deployed backend base URL **without** `/api` on the end, e.g. `https://your-api.railway.app` or `https://api.yourdomain.com`
3. **Redeploy** the frontend after saving.

**Fallback:** If the API is still unavailable, journal entries can be **saved in the browser** (this device only) and merged when you open the journal page; set the env var and redeploy for full server persistence.

**CORS:** Your Flask app should allow your Vercel origin (e.g. `Access-Control-Allow-Origin`) if you ever call the API directly from the browser; the default rewrite path keeps same-origin fetches to `/api/backend` and avoids CORS for that route.
