# GitHub Pages Setup Guide

## Required: First-Time Setup

Before the workflow can deploy, you **MUST** configure GitHub Pages:

### 1. Enable GitHub Pages (REQUIRED)

1. Go to your repository on GitHub
2. Click **Settings** (top navigation)
3. Click **Pages** in the left sidebar
4. Under "Build and deployment":
   - **Source**: Select **"GitHub Actions"**
   - ❌ DO NOT use "Deploy from a branch"
5. Click **Save**

### 2. Configure Workflow Permissions (REQUIRED)

1. In **Settings**, click **Actions** > **General**
2. Scroll to **Workflow permissions** (bottom of page)
3. Select: **"Read and write permissions"**
4. ✅ Check: "Allow GitHub Actions to create and approve pull requests"
5. Click **Save**

### 3. Verify Repository Settings

**Repository must be PUBLIC** (or you need GitHub Pro for private repos)

Check visibility:
- **Settings** > Scroll to **Danger Zone**
- Look for "Change repository visibility"
- If private and you don't have Pro: Click "Change visibility" > "Make public"

### 4. Push Code or Re-run Workflow

**Option A - Push Code:**
```bash
git push origin main
```

**Option B - Re-run Failed Workflow:**
1. Go to **Actions** tab
2. Click the failed workflow run
3. Click **Re-run all jobs** (top right button)

---

## Troubleshooting

### ❌ Error: "Pages build and deployment failed"

**Cause:** GitHub Pages not configured as "GitHub Actions" source

**Fix:**
1. Settings > Pages
2. Change Source to "GitHub Actions"
3. Re-run workflow

### ❌ Error: "Resource not accessible by integration"

**Cause:** Insufficient workflow permissions

**Fix:**
1. Settings > Actions > General
2. Workflow permissions: "Read and write"
3. Save and re-run

### ❌ Error: "404 - Page not found" after deployment

**Cause:** Wrong base path in vite.config.ts

**Fix for GitHub Pages:**
```typescript
// client/vite.config.ts
export default defineConfig({
  base: '/your-repo-name/', // Add your GitHub repo name
  // ... rest of config
});
```

**Fix for Custom Domain:**
```typescript
base: '/', // Use root path
```

### ❌ Build succeeds but no page appears

**Possible causes:**
1. Pages source not set to "GitHub Actions"
2. Deployment takes 1-2 minutes after build
3. DNS propagation (if using custom domain)

**How to check:**
1. Settings > Pages - should show green checkmark and URL
2. Wait 2-3 minutes after successful deploy
3. Clear browser cache
4. Try incognito/private window

---

## Workflow Explanation

Your `.github/workflows/deploy.yml` does this:

```
┌─────────────────────────┐
│ 1. Trigger             │  Push to 'main' branch
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐
│ 2. Build Job           │
│  • Checkout code       │
│  • Install Node 18     │
│  • npm ci              │
│  • Build shared pkg    │
│  • Build client        │
│  • Upload artifact     │
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐
│ 3. Deploy Job          │  Needs Pages enabled!
│  • Download artifact   │
│  • Deploy to Pages     │
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐
│ 4. Live Site!          │  https://you.github.io/repo/
└─────────────────────────┘
```

---

## Verification Checklist

Before pushing code, verify:

- [ ] Repository Settings > Pages > Source = "GitHub Actions"
- [ ] Repository Settings > Actions > Workflow permissions = "Read and write"
- [ ] Repository is public (or you have GitHub Pro)
- [ ] File exists: `.github/workflows/deploy.yml`
- [ ] `client/package.json` has `"build": "tsc && vite build"`
- [ ] `vite.config.ts` has correct `base` path
- [ ] package-lock.json is committed

After first successful deployment:

- [ ] Green checkmark in Actions tab
- [ ] Settings > Pages shows deployment URL
- [ ] Can access site at GitHub Pages URL
- [ ] No 404 errors on navigation

---

## First Deployment Timeline

1. **Push code** → Immediate
2. **Workflow starts** → ~10 seconds
3. **Build completes** → 2-5 minutes
4. **Deploy completes** → 30 seconds
5. **Page available** → 1-2 minutes
6. **Total time** → 5-10 minutes

Be patient on first deploy! Subsequent deploys are faster (2-3 minutes).

---

## Alternative: Simple Static Deployment

If GitHub Actions deployment keeps failing, try the simpler static deployment:

1. Build locally:
```bash
cd client
npm run build
```

2. Install GitHub Pages CLI:
```bash
npm install -g gh-pages
```

3. Deploy:
```bash
gh-pages -d client/dist
```

This bypasses GitHub Actions and directly uploads the build.

---

## Success Indicators

You'll know it worked when you see:

✅ **In Actions Tab:**
- Green checkmark next to workflow run
- "Deploy to GitHub Pages" step shows success

✅ **In Settings > Pages:**
- Green banner: "Your site is live at https://..."
- Shows last deployment time

✅ **In Browser:**
- Site loads at GitHub Pages URL
- No 404 errors
- DevTools > Application shows manifest and service worker

---

## Getting Help

If still failing:

1. **Copy the error message** from Actions tab
2. **Check specific error** in troubleshooting guide
3. **Verify all setup steps** above
4. **Try a fresh push** after fixing settings

Common solutions:
- 90% of issues = Pages source not set to "GitHub Actions"
- 9% of issues = Permissions not set correctly
- 1% of issues = Actual build/code problems
