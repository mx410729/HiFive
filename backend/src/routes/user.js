const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * @route   POST /api/user/profile
 * @desc    Create or update user profile
 * @access  Public (should be protected by Auth0 middleware in production)
 */
router.post('/profile', async (req, res) => {
    const { auth0_id, first_name, last_name, interests } = req.body;

    if (!auth0_id) {
        return res.status(400).json({ error: 'Missing auth0_id' });
    }

    try {
        const query = `
            INSERT INTO users (auth0_id, first_name, last_name, interests)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (auth0_id) 
            DO UPDATE SET 
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                interests = EXCLUDED.interests,
                last_ping_time = CURRENT_TIMESTAMP
            RETURNING *;
        `;
        const result = await db.query(query, [auth0_id, first_name, last_name, interests]);
        
        res.json({ 
            success: true, 
            message: 'Profile saved successfully',
            user: result.rows[0] 
        });
    } catch (err) {
        console.error('Profile save error:', err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

/**
 * @route   GET /api/user/profile/:auth0_id
 * @desc    Get user profile by Auth0 ID
 */
router.get('/profile/:auth0_id', async (req, res) => {
    const { auth0_id } = req.params;

    try {
        const query = 'SELECT * FROM users WHERE auth0_id = $1';
        const result = await db.query(query, [auth0_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error('Profile fetch error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
