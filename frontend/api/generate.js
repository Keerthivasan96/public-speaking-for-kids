// backend/api/generate.js
// Vercel serverless function that proxies user prompt to your LLM provider
// Replace the fetch call below with the exact HTTP request your provider expects.

export default async function handler(req, res) {
  // Allow CORS from your frontend domain(s)
  const ALLOWED_ORIGINS = [
    process.env.FRONTEND_URL || "https://public-speaking-for-kids-v2.vercel.app",
    "http://localhost:5173"
  ];
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    // For safety in production you may want to restrict or return 403
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGINS[0]);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body ?? {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ ok: false, error: "Missing prompt (string)" });
    }

    // ---------- Replace this block with the actual provider call ----------
    // Example template for calling a generic LLM endpoint. Adjust endpoint,
    // headers and body to match your provider (Gemini / OpenAI / others).
    const providerUrl = process.env.GENERATIVE_ENDPOINT || "https://your-llm-endpoint.example/v1/generate";
    const providerKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || "";

    // Basic safety: ensure key exists
    if (!providerKey) {
      return res.status(500).json({ ok: false, error: "Server misconfigured: missing GEMINI_API_KEY" });
    }

    const providerResp = await fetch(providerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Most providers use an Authorization header — change as required:
        "Authorization": `Bearer ${providerKey}`
      },
      body: JSON.stringify({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        prompt: prompt,
        // Add other provider-specific params here (temperature, max_tokens, etc.)
      })
    });

    if (!providerResp.ok) {
      const txt = await providerResp.text();
      console.error("Provider error:", providerResp.status, txt);
      return res.status(502).json({ ok: false, error: "Upstream LLM error", details: txt });
    }

    const providerJson = await providerResp.json();

    // ---------- Tweak this mapping to match provider response schema ----------
    // Example expected final shape: { ok: true, reply: "..." }
    const replyText = providerJson.result?.content
      || providerJson.output?.text
      || providerJson.reply
      || JSON.stringify(providerJson).slice(0, 2000); // fallback

    return res.status(200).json({ ok: true, reply: String(replyText) });
  } catch (err) {
    console.error("generate error:", err);
    return res.status(500).json({ ok: false, error: "Server error", details: String(err) });
  }
}
