const env = require('./src/config/env');
const apiKey = env.GEMINI_API_KEY;

let h1 = "Dih riding, big fat chunky people";
let h2 = "Coding, Imagine dragons, playing tennis, watching anime, travelling to japan, gooning";

let prompt = `Generate a single short icebreaker question for two users about to start a chat.
User 1 Hobbies: ${h1}
User 2 Hobbies: ${h2}
Instructions:
1. Examine the hobbies for any overlapping interests. If found, ask a direct question about that shared interest.
2. If no overlap, create a question that playfully bridges their different hobbies.
3. Keep it to 1-2 sentences. 
4. Be engaging and friendly.
5. Only return the question itself, no preamble or extra text.`;

async function test() {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API 400 error body:', errorText);
  } else {
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  }
}

test();
