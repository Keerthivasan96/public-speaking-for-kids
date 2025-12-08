// frontend/api/generate.js
// DEBUG VERSION - Will return raw Gemini response for troubleshooting

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'prompt'" });
    }

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!GEMINI_KEY) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
    }

    // Try with query parameter authentication (simpler)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;

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

    console.log("🔧 DEBUG: Making request to:", url.replace(GEMINI_KEY, "***"));
    console.log("🔧 DEBUG: Request body:", JSON.stringify(requestBody, null, 2));

    const apiResp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    console.log("🔧 DEBUG: Response status:", apiResp.status);
    console.log("🔧 DEBUG: Response headers:", JSON.stringify([...apiResp.headers.entries()]));

    const raw = await apiResp.json();

    console.log("🔧 DEBUG: Raw response:", JSON.stringify(raw, null, 2));

    // 🚨 TEMPORARILY RETURN THE RAW RESPONSE FOR DEBUGGING
    return res.status(200).json({
      debug: true,
      apiStatus: apiResp.status,
      rawResponse: raw,
      responseKeys: Object.keys(raw),
      candidatesExists: !!raw?.candidates,
      firstCandidate: raw?.candidates?.[0] || null,
      message: "This is a debug response - check the rawResponse field"
    });

  } catch (err) {
    console.error("❌ ERROR:", err);
    return res.status(500).json({
      error: err.message,
      stack: err.stack
    });
  }
}