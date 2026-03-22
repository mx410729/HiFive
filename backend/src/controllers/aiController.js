const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const env = require('../config/env');

const DEFAULT_QUESTION = "If you could have any superpower, what would it be?";

exports.getIcebreaker = async (req, res) => {
  const { conversationId } = req.query;
  const apiKey = env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return res.json({ question: DEFAULT_QUESTION });
  }

  let prompt = "Generate a single random conversation starter question. It must be engaging, safe for general audiences, encourage both users to respond personally, and be short (1-2 sentences max). Only return the question itself, nothing else.";

  if (conversationId) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          participants: {
            include: {
              user: true
            }
          }
        }
      });

      if (conversation && conversation.participants.length >= 2) {
        const u1 = conversation.participants[0].user;
        const u2 = conversation.participants[1].user;
        const h1 = u1.hobbies || "not specified";
        const h2 = u2.hobbies || "not specified";

        prompt = `Generate a single short icebreaker question for two users about to start a chat.
User 1 Hobbies: ${h1}
User 2 Hobbies: ${h2}
Instructions:
1. Examine the hobbies for any overlapping interests. If found, ask a direct question about that shared interest.
2. If no overlap, create a question that playfully bridges their different hobbies.
3. Keep it to 1-2 sentences. 
4. Be engaging and friendly.
5. Only return the question itself, no preamble or extra text.`;
      }
    } catch (e) {
      console.error('Error fetching users for icebreaker:', e);
    }
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });
    
    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    
    const data = await response.json();
    const question = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || DEFAULT_QUESTION;
    
    res.json({ question });
  } catch (error) {
    console.error('Icebreaker generation error:', error);
    res.json({ question: DEFAULT_QUESTION });
  }
};
