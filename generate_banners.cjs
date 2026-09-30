const fs = require('fs');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

const brands = [
  { name: 'mouzy', file: 'mouzy.png', colors: ['#ff9900', '#ff5500'], subtitle: 'Avil Milk' },
  { name: 'peni', file: 'peni.png', colors: ['#ff758c', '#ff7eb3'], subtitle: 'Ice Cream' },
  { name: 'railrolls', file: 'railrolls.png', colors: ['#b31217', '#e52d27'], subtitle: 'Rolls' },
  { name: 'altaza', file: 'altaza.png', colors: ['#e65c00', '#f9d423'], subtitle: 'Shawarma' },
  { name: 'signlaban', file: 'signlaban.png', colors: ['#8e2de2', '#4a00e0'], subtitle: 'Desserts' },
  { name: 'crunchys', file: 'crunchys.png', colors: ['#cb2d3e', '#ef473a'], subtitle: 'Fried Chicken' },
  { name: 'labanstudio', file: 'labanstudio.png', colors: ['#2193b0', '#6dd5ed'], subtitle: 'Labans' },
  { name: 'fishbae', file: 'fishbae.png', colors: ['#00c6ff', '#0072ff'], subtitle: 'Fish Fries' }
];

const width = 1200;
const height = 400;

const outDir = path.join(__dirname, 'public', 'brand_banners');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function generateBanners() {
  for (const brand of brands) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, brand.colors[0]);
    gradient.addColorStop(1, brand.colors[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Add some decorative elements
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(100, 100, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(1100, 300, 200, 0, Math.PI * 2);
    ctx.fill();

    // 3. Draw text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Main text
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText('PLAY GAMES.', 450, 150);
    ctx.fillStyle = '#ffeaa7';
    ctx.fillText('WIN REWARDS.', 450, 230);

    // Subtitle text
    ctx.fillStyle = '#ffffff';
    ctx.font = '32px sans-serif';
    ctx.fillText(`Exclusive ${brand.subtitle} rewards inside!`, 450, 310);

    // 4. Load and draw the logo
    try {
      const logoPath = path.join(__dirname, 'public', 'brandlogos', brand.file);
      const logo = await loadImage(logoPath);
      
      // Calculate aspect ratio to fit the logo in a 300x300 box
      const maxSize = 300;
      let drawWidth = logo.width;
      let drawHeight = logo.height;
      if (drawWidth > maxSize || drawHeight > maxSize) {
        if (drawWidth > drawHeight) {
          drawHeight = (maxSize / drawWidth) * drawHeight;
          drawWidth = maxSize;
        } else {
          drawWidth = (maxSize / drawHeight) * drawWidth;
          drawHeight = maxSize;
        }
      }
      
      const x = 75 + (maxSize - drawWidth) / 2;
      const y = 50 + (maxSize - drawHeight) / 2;
      
      // Optional: Draw a nice subtle circle behind the logo
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(225, 200, 160, 0, Math.PI * 2);
      ctx.fill();

      ctx.drawImage(logo, x, y, drawWidth, drawHeight);
    } catch (e) {
      console.error(`Could not load logo for ${brand.name}:`, e.message);
    }

    // Save the file
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(outDir, `${brand.name}_banner.png`), buffer);
    console.log(`Generated banner for ${brand.name}`);
  }
}

generateBanners().catch(console.error);
