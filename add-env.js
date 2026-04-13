const { execSync } = require('child_process');

const apiKey = "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";

console.log("Adding key...");
try {
  execSync(`npx vercel env add OPENROUTER_API_KEY production`, { 
    input: apiKey,
    stdio: ['pipe', 'inherit', 'inherit']
  });
  console.log("Success.");
} catch (e) {
  console.error("Failed.");
}
