# Icon Generation Script for Hatchlands PWA

## Required Icons

The PWA requires icons in the following sizes:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152 (iOS)
- 192x192
- 384x384
- 512x512

## Quick Setup Options

### Option 1: Use Online Generator
1. Visit https://realfavicongenerator.net/
2. Upload a source image (at least 512x512px)
3. Download the generated icons
4. Place in `client/public/icons/` directory

### Option 2: Use ImageMagick (Command Line)
```bash
# Install ImageMagick first
# Then run from your source image:

convert source.png -resize 72x72 icon-72x72.png
convert source.png -resize 96x96 icon-96x96.png
convert source.png -resize 128x128 icon-128x128.png
convert source.png -resize 144x144 icon-144x144.png
convert source.png -resize 152x152 icon-152x152.png
convert source.png -resize 192x192 icon-192x192.png
convert source.png -resize 384x384 icon-384x384.png
convert source.png -resize 512x512 icon-512x512.png
```

### Option 3: Create Simple Placeholder Icons

For development, you can create simple colored squares:

```javascript
// Run this in browser console or Node.js with canvas
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

function createIcon(size) {
  canvas.width = size;
  canvas.height = size;
  
  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Dragon emoji or text
  ctx.font = `${size * 0.6}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText('🐉', size / 2, size / 2);
  
  // Download
  const link = document.createElement('a');
  link.download = `icon-${size}x${size}.png`;
  link.href = canvas.toDataURL();
  link.click();
}

// Generate all sizes
[72, 96, 128, 144, 152, 192, 384, 512].forEach(createIcon);
```

## Design Recommendations

**Best practices for PWA icons:**
- Use a simple, recognizable symbol (dragon, creature silhouette)
- Ensure contrast works on both light and dark backgrounds
- Avoid text (it becomes unreadable at small sizes)
- Use the brand colors: #667eea and #764ba2
- Test on actual devices
- Use PNG format with transparency

**Source Image Requirements:**
- Minimum 512x512px (1024x1024px recommended)
- Square aspect ratio
- PNG format
- Transparent or solid background

## Icon Placement

All icons should be placed in:
```
client/public/icons/
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png
├── icon-384x384.png
└── icon-512x512.png
```

## Splash Screens (Optional)

For iOS splash screens, add:
```html
<link rel="apple-touch-startup-image" href="/splash/iphone5.png" media="(device-width: 320px) and (device-height: 568px)">
<link rel="apple-touch-startup-image" href="/splash/iphone6.png" media="(device-width: 375px) and (device-height: 667px)">
<link rel="apple-touch-startup-image" href="/splash/iphoneplus.png" media="(device-width: 621px) and (device-height: 1104px)">
<link rel="apple-touch-startup-image" href="/splash/iphonex.png" media="(device-width: 375px) and (device-height: 812px)">
<link rel="apple-touch-startup-image" href="/splash/ipad.png" media="(device-width: 768px) and (device-height: 1024px)">
```

## Testing

After adding icons:
1. Clear browser cache
2. Refresh the page
3. Check manifest in DevTools > Application > Manifest
4. Test "Add to Home Screen" on actual device
5. Verify icon appears correctly on home screen
6. Check splash screen (iOS)

## Automated Icon Generation (Node.js)

If you want to automate icon generation:

```bash
npm install sharp --save-dev
```

```javascript
// scripts/generate-icons.js
const sharp = require('sharp');
const fs = require('fs');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceImage = 'source-icon.png'; // Your source image

async function generateIcons() {
  if (!fs.existsSync('client/public/icons')) {
    fs.mkdirSync('client/public/icons', { recursive: true });
  }

  for (const size of sizes) {
    await sharp(sourceImage)
      .resize(size, size)
      .toFile(`client/public/icons/icon-${size}x${size}.png`);
    console.log(`Generated icon-${size}x${size}.png`);
  }
}

generateIcons().then(() => console.log('All icons generated!'));
```

Run with:
```bash
node scripts/generate-icons.js
```
