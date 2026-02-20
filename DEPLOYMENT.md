# Deploying Hatchlands to GitHub Pages

## Quick Setup

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** > **Pages**
3. Under "Build and deployment":
   - Source: **GitHub Actions**

### 2. Configure Base URL (if needed)

If you're NOT using a custom domain, update `client/vite.config.ts`:

```typescript
export default defineConfig({
  // ...
  base: '/your-repo-name/', // Change this to your repository name
});
```

If using a custom domain, keep `base: '/'`

### 3. Set API URL Secret (Optional)

If you have a production API:

1. Go to repository **Settings** > **Secrets and variables** > **Actions**
2. Add new secret:
   - Name: `API_URL`
   - Value: `https://your-api-domain.com/api`

### 4. Push to Deploy

```bash
git add .
git commit -m "Add PWA and GitHub Pages deployment"
git push origin main
```

The GitHub Action will automatically:
- Install dependencies
- Build the shared package
- Build the client
- Deploy to GitHub Pages

### 5. Access Your App

After deployment completes (2-5 minutes):
- **GitHub Pages URL**: `https://yourusername.github.io/hatchlands/`
- Or your custom domain if configured

---

## Manual Deployment (Alternative)

If you prefer manual deployment:

```bash
# Build the app
cd client
npm run build

# The dist/ folder contains your built app
# You can deploy this to any static hosting service
```

---

## Custom Domain Setup

### 1. Add CNAME file

Create `client/public/CNAME`:
```
yourdomain.com
```

### 2. Configure DNS

Add DNS records with your domain provider:
```
Type: A
Name: @
Value: 185.199.108.153

Type: A
Name: @
Value: 185.199.109.153

Type: A
Name: @
Value: 185.199.110.153

Type: A
Name: @
Value: 185.199.111.153
```

Or for subdomain (www):
```
Type: CNAME
Name: www
Value: yourusername.github.io
```

### 3. Configure in GitHub

1. Go to **Settings** > **Pages**
2. Enter your custom domain
3. Enable "Enforce HTTPS"

---

## Environment Variables

For production, you can configure:

### Client Environment
Create `client/.env.production`:
```env
VITE_API_URL=https://your-api.com/api
```

### Build-time Variables
Pass via GitHub Actions secrets (already configured in deploy.yml)

---

## Alternative Hosting Platforms

### Vercel
```bash
npm i -g vercel
cd client
vercel --prod
```

### Netlify
```bash
npm i -g netlify-cli
cd client
npm run build
netlify deploy --prod --dir=dist
```

### Firebase Hosting
```bash
npm i -g firebase-tools
firebase init hosting
firebase deploy
```

### Cloudflare Pages
1. Connect GitHub repository
2. Build command: `cd client && npm run build`
3. Output directory: `client/dist`

---

## Testing Locally Before Deploy

### Test Production Build
```bash
cd client
npm run build
npm run preview
```

Visit `http://localhost:4173` to test the production build

### Test PWA Features
1. Open DevTools > Application
2. Check Manifest
3. Check Service Worker
4. Test offline mode (Network tab > Offline)

### Test Mobile
1. Open DevTools
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device
4. Test touch interactions

---

## Troubleshooting

### Icons Not Showing
- Make sure icons exist in `client/public/icons/`
- Follow instructions in `client/public/icons/README.md`
- Clear cache and hard refresh

### Service Worker Not Registering
- Check browser console for errors
- Verify HTTPS (localhost and HTTPS only)
- Clear application data in DevTools

### GitHub Actions Failing
- Check Actions tab for error logs
- Verify all dependencies install correctly
- Ensure `npm ci` works locally

### 404 on Deployed Site
- Check base URL in `vite.config.ts`
- Verify GitHub Pages is enabled
- Check repository visibility (public)

### API Not Working
- CORS must be configured on server
- API must support HTTPS in production
- Check API_URL environment variable

---

## Performance Optimization

### Enable Compression
GitHub Pages automatically compresses files, but you can pre-compress:

```bash
npm install -D vite-plugin-compression
```

Update `vite.config.ts`:
```typescript
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({...}),
    viteCompression({ algorithm: 'gzip' }),
    viteCompression({ algorithm: 'brotliCompress' }),
  ],
});
```

### Optimize Images
- Use WebP format
- Compress icons
- Lazy load images

### Code Splitting
Vite automatically splits code. Monitor bundle size:
```bash
npm run build -- --report
```

---

## Monitoring

### Analytics
Add to `client/index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Error Tracking
Consider Sentry for production error tracking:
```bash
npm install @sentry/react
```

---

## Security

### Content Security Policy
Add meta tag to `index.html`:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:;">
```

### HTTPS Only
- GitHub Pages enforces HTTPS automatically
- Set `Secure` flag on cookies if using auth

---

## Maintenance

### Update Dependencies
```bash
npm outdated
npm update
```

### Monitor Bundle Size
```bash
npm run build
ls -lh client/dist/assets
```

Target: < 500KB initial bundle

### Test PWA Score
Use Lighthouse in Chrome DevTools:
1. Open DevTools
2. Lighthouse tab
3. Select "Progressive Web App"
4. Generate report

Aim for 90+ score

---

## Next Steps

1. ✅ Deploy to GitHub Pages
2. 📱 Test on actual mobile devices
3. 🎨 Add app icons (see icons/README.md)
4. 🔔 Implement push notifications
5. 📊 Add analytics
6. 🔒 Configure CSP headers
7. ⚡ Optimize bundle size
8. 🧪 Add E2E tests
