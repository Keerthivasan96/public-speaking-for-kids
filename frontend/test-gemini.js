// test-gemini.js
// Run this locally to test Gemini API directly
// Usage: node test-gemini.js

const GEMINI_KEY = "AIzaSyDmAqv0mB49C4VMns4rCZsIdnyKL6s6a3I"; // Replace with your actual key
const GEMINI_MODEL = "gemini-2.5-flash";

async function testGemini() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: "Hello, please introduce yourself as an English teacher for kids."
          }
        ]
      }
    ]
  };

  console.log("📤 Sending request to Gemini...");
  console.log("Model:", GEMINI_MODEL);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    console.log("\n📥 Response Status:", response.status);

    const data = await response.json();
    
    console.log("\n📄 RAW RESPONSE:");
    console.log(JSON.stringify(data, null, 2));

    console.log("\n🔍 PARSING ATTEMPT:");
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (text) {
      console.log("✅ Successfully extracted text:");
      console.log(text);
    } else {
      console.log("❌ Could not find text in response");
      console.log("Available keys:", Object.keys(data));
      if (data.candidates) {
        console.log("First candidate structure:", Object.keys(data.candidates[0]));
      }
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testGemini();