// frontend/api/generate.js
// Vercel Serverless Function for Gemini 2.5 Flash

export default async function handler(req, res) {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'prompt' in request body" });
    }

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!GEMINI_KEY) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY in environment" });
    }

    // ✅ CORRECT endpoint for Gemini 2.5 Flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

    // ✅ CORRECT request body format
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };

    console.log("📤 Sending to Gemini:", {
      model: GEMINI_MODEL,
      promptLength: prompt.length,
      endpoint: url
    });

    // ✅ Call Gemini API with API key in header
    const apiResp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_KEY  // ✅ Correct header name
      },
      body: JSON.stringify(requestBody)
    });

    const raw = await apiResp.json();

    // 📝 Log the full response for debugging
    console.log("📥 GEMINI RAW RESPONSE:", JSON.stringify(raw, null, 2));

    // Check if API call failed
    if (!apiResp.ok) {
      console.error("❌ Gemini API Error:", raw);
      return res.status(apiResp.status).json({
        ok: false,
        error: "Gemini API error",
        details: raw.error?.message || "Unknown error",
        status: apiResp.status
      });
    }

    // ✅ CORRECT parsing for Gemini 2.5 Flash response format
    let reply = null;

    try {
      // Standard Gemini response format
      reply = raw?.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (e) {
      console.error("Parse error:", e);
    }

    // Fallback parsing for other possible formats
    if (!reply) {
      try {
        const parts = raw?.candidates?.[0]?.content?.parts;
        if (Array.isArray(parts) && parts.length > 0) {
          reply = parts.map(p => p?.text || "").filter(Boolean).join("\n\n");
        }
      } catch (e) {}
    }

    // Final fallback
    if (!reply && raw?.text) {
      reply = raw.text;
    }

    if (!reply || !reply.trim()) {
      console.error("❌ Could not extract text from response");
      console.error("Response structure:", Object.keys(raw));
      
      return res.status(500).json({
        ok: false,
        error: "Model returned unexpected response format",
        hint: "Check function logs for GEMINI RAW RESPONSE",
        responseKeys: Object.keys(raw)
      });
    }

    console.log("✅ Successfully extracted reply, length:", reply.length);

    // Return successful response
    return res.status(200).json({
      ok: true,
      reply: reply.trim()
    });

  } catch (err) {
    console.error("❌ SERVERLESS FUNCTION ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Server error",
      message: err.message
    });
  }
}