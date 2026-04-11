const fs = require('fs');
const { spawnSync } = require('child_process');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const lines = envContent.split('\n');

for (const line of lines) {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    let value = valueParts.join('=').replace(/^"/, '').replace(/"$/, '').trim();
    
    if (key && value) {
      const trimmedKey = key.trim();
      console.log(`Fixing ${trimmedKey}...`);
      
      try {
        // Remove existing for production and preview
        spawnSync('npx', ['vercel', 'env', 'rm', trimmedKey, 'production', '-y'], { shell: true });
        spawnSync('npx', ['vercel', 'env', 'rm', trimmedKey, 'preview', '-y'], { shell: true });
        
        // Add new for production
        spawnSync('npx', ['vercel', 'env', 'add', trimmedKey, 'production'], {
          input: value,
          shell: true
        });
        
        // Add new for preview
        spawnSync('npx', ['vercel', 'env', 'add', trimmedKey, 'preview'], {
          input: value,
          shell: true
        });
        
        console.log(`Successfully fixed ${trimmedKey}`);
      } catch (err) {
        console.error(`Error updating ${trimmedKey}:`, err);
      }
    }
  }
}
console.log('Finished fixing env vars');
