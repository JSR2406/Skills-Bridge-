const apiKey = "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";

async function testFetch() {
  const fullPrompt = "Explain what 2+2 is using JSON. Reply dynamically using this exact format: { \"success\": true }";
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://skillsbridge-jet.vercel.app",
        "X-Title": "SkillBridge"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          { role: "user", content: fullPrompt }
        ]
      })
    });
    
    if (!res.ok) {
        console.error("error", res.status, res.statusText, await res.text());
        return;
    }
    const data = await res.json();
    console.log("Response:", data.choices?.[0]?.message?.content?.trim());
  } catch(e) {
    console.error(e.message);
  }
}
testFetch();
