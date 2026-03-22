const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/messages/:userA/:userB — load chat history
router.get('/:userA/:userB', async (req, res) => {
    const { userA, userB } = req.params;
    try {
        const result = await db.query(`
            SELECT m.id, m.content, m.created_at, 
                   u1.auth0_id as sender_id, 
                   u2.auth0_id as recipient_id
            FROM messages m
            JOIN users u1 ON m.sender_id = u1.id
            JOIN users u2 ON m.recipient_id = u2.id
            WHERE (u1.auth0_id = $1 AND u2.auth0_id = $2)
               OR (u1.auth0_id = $2 AND u2.auth0_id = $1)
            ORDER BY m.created_at ASC
        `, [userA, userB]);
        res.json({ messages: result.rows });
    } catch (err) {
        console.error('Messages fetch error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/messages — save a message
router.post('/', async (req, res) => {
    const { sender_id, recipient_id, content } = req.body;
    try {
        const usersRes = await db.query('SELECT auth0_id, id FROM users WHERE auth0_id IN ($1, $2)', [sender_id, recipient_id]);
        const userMap = {};
        usersRes.rows.forEach(u => userMap[u.auth0_id] = u.id);
        
        const sId = userMap[sender_id];
        const rId = userMap[recipient_id];
        
        if (!sId || !rId) return res.status(404).json({ error: 'User not found' });

        const result = await db.query(`
            INSERT INTO messages (sender_id, recipient_id, content)
            VALUES ($1, $2, $3)
            RETURNING id, created_at
        `, [sId, rId, content]);
        
        res.json({ 
            message: {
                id: result.rows[0].id,
                sender_id,
                recipient_id,
                content,
                created_at: result.rows[0].created_at
            }
        });
    } catch (err) {
        console.error('Message save error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
