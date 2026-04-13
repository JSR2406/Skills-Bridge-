async function testFetch() {
  console.log("Testing Production API...");
  try {
    const res = await fetch("https://skillsbridge-jet.vercel.app/api/productivity/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tasks: [
          { title: "Review math formulas", category: "study", isCompleted: false, priority: "high" }
        ],
        reputation: 50
      })
    });
    
    if (!res.ok) {
        console.error("error status:", res.status, res.statusText);
        const text = await res.text();
        console.error("error text:", text);
        return;
    }
    const data = await res.json();
    console.log("Success Response:", JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e.message);
  }
}
testFetch();
