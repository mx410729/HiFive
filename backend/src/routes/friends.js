const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper — get numeric id from auth0_id
async function getNumericId(auth0Id) {
    const res = await db.query('SELECT id FROM users WHERE auth0_id = $1', [auth0Id]);
    if (res.rowCount === 0) return null;
    return res.rows[0].id;
}

// POST /api/friends/request
router.post('/request', async (req, res) => {
    // requesterId is the authenticated user from the token
    const requesterAuth0Id = req.auth.payload.sub;
    const { targetUserId } = req.body; // frontend sends targetUserId
    
    try {
        const rId = await getNumericId(requesterAuth0Id);
        const aId = await getNumericId(targetUserId); 
        
        if (!rId || !aId) return res.status(404).json({ error: 'User not found' });

        const result = await db.query(`
            INSERT INTO friendships (requester_id, addressee_id, status)
            VALUES ($1, $2, 'pending')
            ON CONFLICT (requester_id, addressee_id)
            DO UPDATE SET status = 'pending'
            RETURNING *
        `, [rId, aId]);
        
        // Notify the target user via socket (this would be handled in sockets.js usually)
        // For now, just return success
        res.json({ success: true, friendship: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/friends/accept
router.post('/accept', async (req, res) => {
    const acceptorAuth0Id = req.auth.payload.sub;
    const { requestId } = req.body; // Backup frontend might send requestId or targetUserId
    
    try {
        const aId = await getNumericId(acceptorAuth0Id);
        if (!aId) return res.status(404).json({ error: 'User not found' });

        // If requestId is provided (which is the friendship id)
        const query = requestId 
            ? `UPDATE friendships SET status = 'accepted' WHERE id = $1 AND addressee_id = $2 RETURNING *`
            : `UPDATE friendships SET status = 'accepted' WHERE requester_id = $1 AND addressee_id = $2 RETURNING *`;
        
        const params = requestId ? [requestId, aId] : [req.body.targetUserId, aId];

        const result = await db.query(query, params);
        
        if (result.rowCount === 0) return res.status(404).json({ error: 'Friend request not found' });
        
        res.json({ success: true, friendship: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/friends
router.get('/', async (req, res) => {
    const auth0_id = req.auth.payload.sub;
    try {
        const uId = await getNumericId(auth0_id);
        if (!uId) return res.status(404).json({ error: 'User not found' });

        // Get all friendships for this user
        const friendships = await db.query(`
            SELECT f.id, f.requester_id, f.addressee_id, f.status,
                   u1.auth0_id as req_auth0, u1.first_name as req_fn, u1.last_name as req_ln, (u1.first_name || ' ' || u1.last_name) as req_username,
                   u2.auth0_id as add_auth0, u2.first_name as add_fn, u2.last_name as add_ln, (u2.first_name || ' ' || u2.last_name) as add_username
            FROM friendships f
            JOIN users u1 ON f.requester_id = u1.id
            JOIN users u2 ON f.addressee_id = u2.id
            WHERE f.requester_id = $1 OR f.addressee_id = $1
        `, [uId]);

        const friends = [];
        const pendingSent = [];
        const pendingReceived = [];

        friendships.rows.forEach(row => {
            const isRequester = row.requester_id === uId;
            const otherUser = isRequester ? {
                id: row.add_auth0,
                username: row.add_username,
                first_name: row.add_fn,
                last_name: row.add_ln,
                isOnline: true 
            } : {
                id: row.req_auth0,
                username: row.req_username,
                first_name: row.req_fn,
                last_name: row.req_ln,
                isOnline: true
            };

            if (row.status === 'accepted') {
                friends.push({ ...otherUser, unreadCount: 0 });
            } else if (row.status === 'pending') {
                if (isRequester) {
                    pendingSent.push({ id: row.id, user: otherUser });
                } else {
                    pendingReceived.push({ id: row.id, user: otherUser });
                }
            }
        });

        res.json({ friends, pendingSent, pendingReceived });
    } catch (err) {
        console.error('getFriends error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
