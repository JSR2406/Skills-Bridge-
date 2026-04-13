async function getModels() {
    const res = await fetch("https://openrouter.ai/api/v1/models");
    const data = await res.json();
    const freeModels = data.data.filter(m => m.pricing && m.pricing.prompt === "0" && m.pricing.completion === "0");
    console.log(freeModels.map(m => m.id).join("\n"));
}
getModels();
