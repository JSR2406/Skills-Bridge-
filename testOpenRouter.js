const key = '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';
const fullPrompt = '{"message":"Give me a mock JSON study plan. ONLY JSON."}';

fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    models: ["meta-llama/llama-3.3-70b-instruct:free", "nvidia/nemotron-3-super-120b-a12b:free", "qwen/qwen3-coder:free"], 
    messages: [{role:'user',content:fullPrompt}] 
  })
}).then(r => r.json()).then(d => {
  if (d.choices) console.log('SUCCESS:', d.choices[0].message.content.substring(0, 50));
  else console.log(d);
}).catch(console.error);
