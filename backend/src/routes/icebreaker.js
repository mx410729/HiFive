const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/:userAId/:userBId', async (req, res) => {
    const { userAId, userBId } = req.params;
    
    try {
        const result = await db.query(
            `SELECT auth0_id, first_name, interests 
             FROM users 
             WHERE auth0_id = $1 OR auth0_id = $2`,
            [userAId, userBId]
        );

        if (result.rows.length < 2) {
            return res.json({ question: "If you could have any superpower, what would it be?" });
        }

        const [userA, userB] = result.rows;

        const prompt = `Generate a single icebreaker question for two people who just connected.
Person 1 (${userA.first_name}) interests: ${userA.interests}
Person 2 (${userB.first_name}) interests: ${userB.interests}

Rules:
- Find a shared interest if possible and ask about it
- If no overlap, bridge their interests creatively
- Keep it to one sentence
- Make it fun and specific to them
- Return ONLY the question, nothing else`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );

        const data = await response.json();
        const question = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() 
            || "What's something you've been really into lately?";
        
        res.json({ question });

    } catch (err) {
        console.error('Icebreaker error:', err);
        res.json({ question: "What's something you've been really into lately?" });
    }
});

module.exports = router;
