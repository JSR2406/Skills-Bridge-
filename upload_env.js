const fs = require('fs');
const { execSync } = require('child_process');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const lines = envContent.split('\n');

for (const line of lines) {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    let value = valueParts.join('=').replace(/^"/, '').replace(/"$/, '').trim();
    
    if (key && value) {
      console.log(`Adding ${key}...`);
      try {
        // Vercel CLI interactive bypass using pipe
        execSync(`echo "${value}" | vercel env add ${key.trim()} production`, { stdio: 'pipe' });
        execSync(`echo "${value}" | vercel env add ${key.trim()} preview`, { stdio: 'pipe' });
        console.log(`Successfully added ${key}`);
      } catch (err) {
        console.log(`Warning: Failed to add ${key} or it already exists.`);
      }
    }
  }
}
console.log('Finished uploading env vars');
