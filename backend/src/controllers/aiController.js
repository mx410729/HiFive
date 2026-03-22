const env = require('../config/env');

const DEFAULT_QUESTION = "If you could have any superpower, what would it be?";

exports.getIcebreaker = async (req, res) => {
  // Catch placeholder or missing keys
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return res.json({ question: DEFAULT_QUESTION });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: "Generate a single random conversation starter question. It must be engaging, safe for general audiences, encourage both users to respond personally, and be short (1-2 sentences max). Only return the question itself, nothing else." }] }]
        })
    });
    
    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    
    const data = await response.json();
    const question = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || DEFAULT_QUESTION;
    
    res.json({ question });
  } catch (error) {
    console.error('Icebreaker generation error:', error);
    // Fallback instead of 500 to keep the chat functional
    res.json({ question: DEFAULT_QUESTION });
  }
};
