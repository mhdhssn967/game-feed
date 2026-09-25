const fs = require('fs');
const path = require('path');
const https = require('https');

const dir = path.join(__dirname, 'profilepictures');
const bucket = 'gamefaktory-1b0b8.firebasestorage.app';

async function uploadFile(filePath, destPath) {
  const content = fs.readFileSync(filePath);
  
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'firebasestorage.googleapis.com',
      port: 443,
      path: `/v0/b/${bucket}/o?name=${encodeURIComponent(destPath)}`,
      method: 'POST',
      headers: {
        'Content-Type': 'image/webp',
        'Content-Length': content.length
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`Success: ${destPath}`);
          resolve(JSON.parse(data));
        } else {
          console.error(`Error ${res.statusCode} on ${destPath}: ${data}`);
          reject(new Error(data));
        }
      });
    });

    req.on('error', reject);
    req.write(content);
    req.end();
  });
}

async function main() {
  try {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.webp'));
    for (const file of files) {
      const filePath = path.join(dir, file);
      const destPath = `profile_pictures/${file}`;
      console.log(`Uploading ${file}...`);
      await uploadFile(filePath, destPath);
    }
    console.log('All done!');
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

main();
