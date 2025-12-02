/**
 * Generate favicon.ico from logo.svg
 * Requires: npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicon() {
  console.log('🎨 Generating favicon.ico from logo.svg...\n');

  const logoPath = path.resolve(__dirname, '../public/logo.svg');
  const outputPath = path.resolve(__dirname, '../app/favicon.ico');

  try {
    // Read SVG
    const svgBuffer = fs.readFileSync(logoPath);

    // Generate PNG at different sizes for ICO
    const sizes = [16, 32, 48];
    const pngBuffers = [];

    for (const size of sizes) {
      console.log(`  📐 Creating ${size}x${size} PNG...`);
      const png = await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toBuffer();
      pngBuffers.push(png);
    }

    // For ICO, we'll use the 32x32 version
    console.log('\n  💾 Saving favicon.ico...');
    await sharp(svgBuffer)
      .resize(32, 32)
      .toFile(outputPath);

    console.log('  ✅ favicon.ico created successfully!\n');
    console.log(`  📁 Location: ${outputPath}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Tip: Install sharp with: npm install sharp');
  }
}

generateFavicon();
