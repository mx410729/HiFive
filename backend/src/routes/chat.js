const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/chat/sessions — get or create a conversation "id"
// In this simple pg implementation, the "id" is just a composite of the two user IDs
router.post('/sessions', async (req, res) => {
    const auth0_id = req.auth.payload.sub;
    const { targetUserId } = req.body;
    
    try {
        const res1 = await db.query('SELECT id FROM users WHERE auth0_id = $1', [auth0_id]);
        const res2 = await db.query('SELECT id FROM users WHERE auth0_id = $1', [targetUserId]);
        
        if (res1.rowCount === 0 || res2.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const uId1 = res1.rows[0].id;
        const uId2 = res2.rows[0].id;
        
        // Use a consistent ID for the pair
        const conversationId = [uId1, uId2].sort().join('_');
        
        res.json({ id: conversationId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/chat/:id/history
router.get('/:id/history', async (req, res) => {
    const { id } = req.params; // e.g. "1_2"
    const [u1, u2] = id.split('_');
    
    try {
        const result = await db.query(`
            SELECT m.id, m.content, m.created_at, 
                   u.auth0_id as sender_auth0, u.first_name as sender_fn, (u.first_name || ' ' || u.last_name) as username
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE (m.sender_id = $1 AND m.recipient_id = $2)
               OR (m.sender_id = $2 AND m.recipient_id = $1)
            ORDER BY m.created_at ASC
        `, [u1, u2]);
        
        const messages = result.rows.map(r => ({
            id: r.id,
            content: r.content,
            sender: {
                auth0_id: r.sender_auth0,
                username: r.username
            },
            created_at: r.created_at
        }));
        
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
