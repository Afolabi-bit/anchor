const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const TERRACOTTA = '#C86D51';
const ESPRESSO = '#1C1917';
const PEDESTAL = '#2A1D19';
const PEDESTAL_BORDER = '#3D2820';

const publicDir = path.resolve(__dirname, '../public');
const appDir = path.resolve(__dirname, '../app');

// Master Favicon Vector (Clean, minimal, 32x32 viewBox)
const masterFaviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="6.5" r="4" fill="none" stroke="${TERRACOTTA}" stroke-width="2.6" />
  <line x1="7" y1="13.5" x2="25" y2="13.5" stroke="${TERRACOTTA}" stroke-width="2.6" stroke-linecap="round" />
  <line x1="16" y1="9.5" x2="16" y2="27.5" stroke="${TERRACOTTA}" stroke-width="2.8" stroke-linecap="round" />
  <path d="M 4.5 17.5 C 4.5 25, 11 28, 16 28 C 21 28, 27.5 25, 27.5 17.5" fill="none" stroke="${TERRACOTTA}" stroke-width="2.8" stroke-linecap="round" />
</svg>`;

// Safari Pinned Tab Mask SVG (Monochrome Black)
const safariPinnedTabSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <circle cx="16" cy="6.5" r="4" fill="none" stroke="#000000" stroke-width="2.6" />
  <line x1="7" y1="13.5" x2="25" y2="13.5" stroke="#000000" stroke-width="2.6" stroke-linecap="round" />
  <line x1="16" y1="9.5" x2="16" y2="27.5" stroke="#000000" stroke-width="2.8" stroke-linecap="round" />
  <path d="M 4.5 17.5 C 4.5 25, 11 28, 16 28 C 21 28, 27.5 25, 27.5 17.5" fill="none" stroke="#000000" stroke-width="2.8" stroke-linecap="round" />
</svg>`;

// Apple Touch Icon 180x180 SVG (Solid background, no transparency)
function getAppleTouchSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <defs>
    <radialGradient id="appleGlow" cx="50%" cy="30%" r="65%">
      <stop offset="0%" stop-color="#C86D51" stop-opacity="0.18" />
      <stop offset="100%" stop-color="${ESPRESSO}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="180" height="180" fill="${ESPRESSO}" />
  <rect width="180" height="180" fill="url(#appleGlow)" />
  <circle cx="90" cy="90" r="54" fill="${PEDESTAL}" stroke="${PEDESTAL_BORDER}" stroke-width="1.5" />
  <g transform="translate(48, 48) scale(2.625)">
    <circle cx="16" cy="6.5" r="4" fill="none" stroke="${TERRACOTTA}" stroke-width="2.6" />
    <line x1="7" y1="13.5" x2="25" y2="13.5" stroke="${TERRACOTTA}" stroke-width="2.6" stroke-linecap="round" />
    <line x1="16" y1="9.5" x2="16" y2="27.5" stroke="${TERRACOTTA}" stroke-width="2.8" stroke-linecap="round" />
    <path d="M 4.5 17.5 C 4.5 25, 11 28, 16 28 C 21 28, 27.5 25, 27.5 17.5" fill="none" stroke="${TERRACOTTA}" stroke-width="2.8" stroke-linecap="round" />
  </g>
</svg>`;
}

// PWA Standard App Icon 512x512 SVG
function getPwaStandardSvg(size = 512) {
  const scale = size / 32 * 0.52;
  const offset = (size - 32 * scale) / 2;
  const pedestalR = size * 0.32;
  const strokeW = (size / 512) * 3;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <radialGradient id="pwaStdGlow" cx="50%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#C86D51" stop-opacity="0.2" />
      <stop offset="100%" stop-color="${ESPRESSO}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="${ESPRESSO}" />
  <rect width="${size}" height="${size}" fill="url(#pwaStdGlow)" />
  <circle cx="${size / 2}" cy="${size / 2}" r="${pedestalR}" fill="${PEDESTAL}" stroke="${PEDESTAL_BORDER}" stroke-width="${strokeW}" />
  <g transform="translate(${offset}, ${offset}) scale(${scale})">
    <circle cx="16" cy="6.5" r="4" fill="none" stroke="${TERRACOTTA}" stroke-width="2.6" />
    <line x1="7" y1="13.5" x2="25" y2="13.5" stroke="${TERRACOTTA}" stroke-width="2.6" stroke-linecap="round" />
    <line x1="16" y1="9.5" x2="16" y2="27.5" stroke="${TERRACOTTA}" stroke-width="2.8" stroke-linecap="round" />
    <path d="M 4.5 17.5 C 4.5 25, 11 28, 16 28 C 21 28, 27.5 25, 27.5 17.5" fill="none" stroke="${TERRACOTTA}" stroke-width="2.8" stroke-linecap="round" />
  </g>
</svg>`;
}

// PWA Maskable Icon 512x512 SVG (all critical content strictly within center 75% circle)
function getPwaMaskableSvg() {
  const size = 512;
  // Center 75% safe area = diameter 384px (safe circle r=192)
  const scale = 7.0; // 32 * 7 = 224px glyph height
  const offset = (size - 32 * scale) / 2; // 144px
  const pedestalR = 150;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="pwaMaskGlow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#C86D51" stop-opacity="0.18" />
      <stop offset="100%" stop-color="${ESPRESSO}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <!-- Full bleed background so mask clipping looks seamless -->
  <rect width="512" height="512" fill="${ESPRESSO}" />
  <rect width="512" height="512" fill="url(#pwaMaskGlow)" />
  <circle cx="256" cy="256" r="${pedestalR}" fill="${PEDESTAL}" stroke="${PEDESTAL_BORDER}" stroke-width="3" />
  <g transform="translate(${offset}, ${offset}) scale(${scale})">
    <circle cx="16" cy="6.5" r="4" fill="none" stroke="${TERRACOTTA}" stroke-width="2.6" />
    <line x1="7" y1="13.5" x2="25" y2="13.5" stroke="${TERRACOTTA}" stroke-width="2.6" stroke-linecap="round" />
    <line x1="16" y1="9.5" x2="16" y2="27.5" stroke="${TERRACOTTA}" stroke-width="2.8" stroke-linecap="round" />
    <path d="M 4.5 17.5 C 4.5 25, 11 28, 16 28 C 21 28, 27.5 25, 27.5 17.5" fill="none" stroke="${TERRACOTTA}" stroke-width="2.8" stroke-linecap="round" />
  </g>
</svg>`;
}

// Multi-resolution ICO generator helper
function createIcoFromPngs(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + count * dirEntrySize;
  
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(count, 4);

  const entries = [];
  for (const img of pngBuffers) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // image data size
    entry.writeUInt32LE(offset, 12); // offset
    entries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers.map(p => p.buffer)]);
}

async function generateAll() {
  console.log('Generating Anchor icon suite...');

  // 1. favicon.svg
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), masterFaviconSvg.trim());
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), masterFaviconSvg.trim());
  console.log('✓ Created public/favicon.svg and public/icon.svg');

  // 2. safari-pinned-tab.svg
  fs.writeFileSync(path.join(publicDir, 'safari-pinned-tab.svg'), safariPinnedTabSvg.trim());
  console.log('✓ Created public/safari-pinned-tab.svg');

  // 3. favicon-16x16.png
  await sharp(Buffer.from(masterFaviconSvg))
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('✓ Created public/favicon-16x16.png');

  // 4. favicon-32x32.png
  await sharp(Buffer.from(masterFaviconSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('✓ Created public/favicon-32x32.png');

  // 5. favicon.ico (16, 32, 48px)
  const icoSizes = [16, 32, 48];
  const icoPngs = [];
  for (const s of icoSizes) {
    const buf = await sharp(Buffer.from(masterFaviconSvg))
      .resize(s, s)
      .png()
      .toFile ? await sharp(Buffer.from(masterFaviconSvg)).resize(s, s).png().toBuffer() : null;
    icoPngs.push({ width: s, height: s, buffer: buf });
  }
  const icoBuffer = createIcoFromPngs(icoPngs);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuffer);
  console.log('✓ Created public/favicon.ico and app/favicon.ico (multi-res 16/32/48)');

  // 6. apple-touch-icon.png (180x180)
  const appleSvg = getAppleTouchSvg();
  await sharp(Buffer.from(appleSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Created public/apple-touch-icon.png (180x180)');

  // 7. icon-192.png & icon-192x192.png
  const pwa192Svg = getPwaStandardSvg(192);
  const pwa192Buf = await sharp(Buffer.from(pwa192Svg)).resize(192, 192).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), pwa192Buf);
  fs.writeFileSync(path.join(publicDir, 'icon-192x192.png'), pwa192Buf);
  console.log('✓ Created public/icon-192.png and public/icon-192x192.png');

  // 8. icon-512.png & icon-512x512.png
  const pwa512Svg = getPwaStandardSvg(512);
  const pwa512Buf = await sharp(Buffer.from(pwa512Svg)).resize(512, 512).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), pwa512Buf);
  fs.writeFileSync(path.join(publicDir, 'icon-512x512.png'), pwa512Buf);
  console.log('✓ Created public/icon-512.png and public/icon-512x512.png');

  // 9. icon-maskable-512.png & icon-maskable-512x512.png
  const pwaMaskSvg = getPwaMaskableSvg();
  const pwaMaskBuf = await sharp(Buffer.from(pwaMaskSvg)).resize(512, 512).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'icon-maskable-512.png'), pwaMaskBuf);
  fs.writeFileSync(path.join(publicDir, 'icon-maskable-512x512.png'), pwaMaskBuf);
  console.log('✓ Created public/icon-maskable-512.png and public/icon-maskable-512x512.png');

  console.log('All icons generated successfully!');
}

generateAll().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
