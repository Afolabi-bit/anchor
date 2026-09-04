const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function verify() {
  console.log('--- Verifying Anchor Favicon & Icon Set ---');

  const filesToCheck = [
    { file: 'public/favicon.svg', type: 'svg' },
    { file: 'public/safari-pinned-tab.svg', type: 'svg' },
    { file: 'public/favicon-16x16.png', type: 'png', width: 16, height: 16 },
    { file: 'public/favicon-32x32.png', type: 'png', width: 32, height: 32 },
    { file: 'public/apple-touch-icon.png', type: 'png', width: 180, height: 180 },
    { file: 'public/icon-192.png', type: 'png', width: 192, height: 192 },
    { file: 'public/icon-512.png', type: 'png', width: 512, height: 512 },
    { file: 'public/icon-maskable-512.png', type: 'png', width: 512, height: 512 },
    { file: 'public/favicon.ico', type: 'ico' },
    { file: 'app/favicon.ico', type: 'ico' }
  ];

  for (const item of filesToCheck) {
    const filePath = path.resolve(__dirname, '..', item.file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ MISSING: ${item.file}`);
      continue;
    }

    const stats = fs.statSync(filePath);
    if (item.type === 'png') {
      const meta = await sharp(filePath).metadata();
      if (meta.width === item.width && meta.height === item.height) {
        console.log(`✓ ${item.file} [${meta.width}x${meta.height}, ${stats.size} bytes]`);
      } else {
        console.error(`❌ ${item.file} has wrong dimensions: ${meta.width}x${meta.height}, expected ${item.width}x${item.height}`);
      }
    } else if (item.type === 'ico') {
      const buf = fs.readFileSync(filePath);
      const count = buf.readUInt16LE(4);
      console.log(`✓ ${item.file} [ICO with ${count} resolutions, ${stats.size} bytes]`);
    } else {
      console.log(`✓ ${item.file} [${stats.size} bytes]`);
    }
  }

  // Check manifest.json
  const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/manifest.json'), 'utf8'));
  console.log(`✓ public/manifest.json contains ${manifest.icons.length} icon definitions`);

  // Check localhost:3000 if running
  try {
    const res = await fetch('http://localhost:3000');
    if (res.ok) {
      const html = await res.text();
      const hasFaviconIco = html.includes('/favicon.ico');
      const hasFaviconSvg = html.includes('/favicon.svg');
      const hasAppleTouch = html.includes('/apple-touch-icon.png');
      const hasMaskIcon = html.includes('/safari-pinned-tab.svg');
      console.log(`✓ HTML <head> check: favicon.ico (${hasFaviconIco}), favicon.svg (${hasFaviconSvg}), apple-touch-icon (${hasAppleTouch}), safari-pinned-tab (${hasMaskIcon})`);
    }
  } catch (e) {
    console.log('Dev server not reachable for live check, but files and metadata verified.');
  }

  console.log('--- Verification Complete ---');
}

verify().catch(console.error);
