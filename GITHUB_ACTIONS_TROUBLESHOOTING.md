# GitHub Actions Build Troubleshooting

## Common Build Failure Reasons

### 1. ✅ **FIXED: Workspace Build Order**
**Symptom:** `Cannot find module '@hatchlands/shared'` or TypeScript errors

**Cause:** The `shared` package must be **built** before `client` can import from it.

**Solution:** The workflow now builds shared first:
```yaml
- name: Build shared package first
  run: npm run build --workspace=shared

- name: Build client
  run: npm run build --workspace=client
```

### 2. ✅ **FIXED: Cross-Platform Clean Script**
**Symptom:** `rm: command not found` on some systems

**Cause:** `rm -rf` doesn't work on all platforms.

**Solution:** Now uses Node.js for cross-platform file deletion:
```json
"clean": "node -e \"require('fs').rmSync('dist', {recursive: true, force: true})\""
```

### 3. **Missing Dependencies**
**Symptom:** `Cannot find module 'vite-plugin-pwa'` or similar

**Solution:** Run `npm install` locally first to ensure all dependencies are in package-lock.json:
```bash
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### 4. **TypeScript Errors**
**Symptom:** Build fails during `tsc` step

**Solution:** Check TypeScript locally first:
```bash
cd shared
npm run build

cd ../client
npx tsc --noEmit
```

Fix any type errors before pushing.

### 5. **Missing Icon Files**
**Symptom:** Build succeeds but PWA manifest warnings

**Issue:** Icons referenced in manifest.json don't exist yet.

**Solution:** Either:
- Generate icons (see `client/public/icons/README.md`)
- Or temporarily comment out icon paths in `vite.config.ts`

**Note:** App will still work; icons are optional for testing.

### 6. **GitHub Pages Not Enabled**
**Symptom:** Workflow succeeds but no deployment

**Solution:**
1. Go to repository **Settings** > **Pages**
2. Set Source to: **GitHub Actions**
3. Save and re-run workflow

### 7. **Permissions Issues**
**Symptom:** `Resource not accessible by integration`

**Solution:** Check workflow has correct permissions:
```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

### 8. **Node Version Mismatch**
**Symptom:** `Unsupported engine` or dependency install failures

**Solution:** Workflow uses Node 18, same as required in package.json:
```yaml
node-version: '18'
```

Match this in your local development.

---

## How to Debug Build Failures

### Step 1: Check Action Logs
1. Go to your repository on GitHub
2. Click **Actions** tab
3. Click the failed workflow run
4. Expand the failed step to see error details

### Step 2: Reproduce Locally
```bash
# Clean everything
rm -rf node_modules */node_modules
rm -f package-lock.json */package-lock.json

# Fresh install (simulates CI)
npm ci

# Build in same order as CI
npm run build --workspace=shared
npm run build --workspace=client

# Check output
ls -la client/dist
```

### Step 3: Common Fixes

**If `npm ci` fails:**
```bash
# Regenerate lockfile
rm package-lock.json
npm install
git add package-lock.json
git commit -m "Fix package-lock.json"
```

**If TypeScript fails:**
```bash
cd client
npx tsc --noEmit
# Fix all errors shown
```

**If Vite build fails:**
```bash
cd client
npm run build
# Check error message
```

### Step 4: Test Build Script Locally
```bash
# Run exact same command as GitHub Actions
npm run build --workspace=shared && npm run build --workspace=client
```

---

## Workflow Overview

Your GitHub Actions workflow does this:

```
1. Checkout code
2. Setup Node.js 18
3. npm ci (install all dependencies, including workspaces)
4. Build shared package (typescript → dist/)
5. Build client (uses shared types, outputs to dist/)
6. Upload client/dist folder
7. Deploy to GitHub Pages
```

---

## Quick Fixes for Specific Errors

### Error: `Cannot find module '@hatchlands/shared'`
```bash
cd shared
npm run build
cd ../client
npm run build
```

### Error: `Module '"vite-plugin-pwa"' has no exported member 'VitePWA'`
```bash
cd client
npm install vite-plugin-pwa@latest
```

### Error: `tsc: command not found`
```bash
npm install typescript --save-dev
```

### Error: `Unable to find module '@react-three/fiber'`
```bash
cd client
npm install
```

### Error: Build succeeds but 404 on deployed site
Update `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/your-repo-name/', // Add your GitHub repo name
  // ...
});
```

---

## Verify Successful Build

After workflow completes:

1. **Check Actions Tab**: "✅ All checks passed"
2. **Check Pages**: Settings > Pages shows green deployment
3. **Visit Site**: `https://yourusername.github.io/hatchlands/`
4. **Test PWA**: Open DevTools > Application > Manifest

---

## Still Failing?

### Check these files exist:
- `client/public/manifest.json` ✅
- `client/public/sw.js` ✅
- `client/src/pwa.ts` ✅
- `client/index.html` (with PWA meta tags) ✅

### Check package.json has build script:
```json
{
  "scripts": {
    "build": "npm run build:shared && npm run build:client"
  }
}
```

### Check client/package.json:
```json
{
  "scripts": {
    "build": "tsc && vite build"
  },
  "devDependencies": {
    "vite-plugin-pwa": "^0.17.4"
  }
}
```

### Run Full Clean Build Test:
```bash
# This is what GitHub Actions does
git clean -fdx
npm ci
npm run build --workspace=shared
npm run build --workspace=client
ls client/dist  # Should show index.html and assets/
```

---

## Need More Help?

**View Logs:**
- GitHub Actions logs are your best friend
- Look for the red ❌ step and expand it
- Read error message carefully

**Common Log Search Terms:**
- `error TS` - TypeScript errors
- `Cannot find module` - Missing dependency
- `ENOENT` - Missing file
- `Failed to load` - Import issue

**Test Deployment Locally:**
```bash
cd client
npm run build
npm run preview
# Open http://localhost:4173
```

If preview works locally but GitHub Actions fails, it's likely:
- Missing dependency in package-lock.json
- Build order issue (shared not built first)
- Environment variable issue

---

## Post-Deployment Checklist

✅ Workflow shows green checkmark  
✅ Pages deployment shows green  
✅ Site loads at GitHub Pages URL  
✅ Service worker registers (check DevTools)  
✅ Manifest loads (check DevTools > Application)  
✅ Can install on mobile  
✅ Works offline (after first visit)  

🎉 **Your PWA is live!**
