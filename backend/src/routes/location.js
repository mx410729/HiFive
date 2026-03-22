const express = require('express');
const router = express.Router();
const db = require('../db');

// Haversine formula — returns distance between two GPS points in meters
function getDistanceMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// POST /api/location/ping
// Input: { userId, lat, lng }
router.post('/ping', async (req, res) => {
    const { userId, lat, lng } = req.body;

    if (!userId || !lat || !lng) {
        return res.status(400).json({ error: 'Missing userId, lat, or lng' });
    }

    try {
        // 1. Update this user's location
        const updateQuery = `
            UPDATE users 
            SET lat = $1, lng = $2, last_ping_time = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING id;
        `;
        const userRes = await db.query(updateQuery, [lat, lng, userId]);

        if (userRes.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 2. Get all recently active users
        const nearbyQuery = `
            SELECT id, username, lat, lng 
            FROM users 
            WHERE id != $1 
            AND last_ping_time > CURRENT_TIMESTAMP - INTERVAL '5 minutes'
            AND lat IS NOT NULL;
        `;
        const allUsers = await db.query(nearbyQuery, [userId]);

        // 3. Filter to users within 50 meters using Haversine
        const nearbyUsers = allUsers.rows.filter(u =>
            getDistanceMeters(lat, lng, u.lat, u.lng) <= 50
        );

        // 4. Log encounters for nearby users
        const updates = nearbyUsers.map(nearbyUser => {
            const userA = Math.min(userId, nearbyUser.id);
            const userB = Math.max(userId, nearbyUser.id);

            return db.query(`
                INSERT INTO encounters (user_a_id, user_b_id, encounter_count, last_seen_date)
                VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
                ON CONFLICT (user_a_id, user_b_id) 
                DO UPDATE SET 
                    encounter_count = encounters.encounter_count + 1,
                    last_seen_date = CURRENT_TIMESTAMP
                RETURNING encounter_count;
            `, [userA, userB]);
        });

        const encounterResults = await Promise.all(updates);

        // 5. Check if any encounters hit the suggestion threshold (3+)
        const suggestions = encounterResults
            .map((r, i) => ({
                user: nearbyUsers[i],
                count: r.rows[0]?.encounter_count
            }))
            .filter(e => e.count >= 3);

        res.json({
            success: true,
            passedBy: nearbyUsers.map(u => ({ id: u.id, username: u.username })),
            suggestions: suggestions.map(s => ({
                id: s.user.id,
                username: s.user.username,
                encounterCount: s.count
            }))
        });

    } catch (err) {
        console.error('Location ping error:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

module.exports = router;