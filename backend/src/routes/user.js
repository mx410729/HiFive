const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * @route   POST /api/user/profile
 * @desc    Create or update user profile
 * @access  Protected
 */
router.post('/profile', async (req, res) => {
    const auth0_id = req.auth.payload.sub;
    const { first_name, firstName, last_name, lastName, interests, hobbies } = req.body;
    
    const fName = first_name || firstName;
    const lName = last_name || lastName;
    const ints = interests || hobbies;

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
        const result = await db.query(query, [auth0_id, fName, lName, ints]);
        
        res.json({ 
            success: true, 
            message: 'Profile saved successfully',
            user: result.rows[0] 
        });
    } catch (err) {
        console.error('Profile save error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route   GET /api/user/profile
 * @desc    Get current user profile
 */
router.get('/profile', async (req, res) => {
    const auth0_id = req.auth.payload.sub;

    try {
        const query = 'SELECT * FROM users WHERE auth0_id = $1';
        const result = await db.query(query, [auth0_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, ...result.rows[0] });
    } catch (err) {
        console.error('Profile fetch error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route   PUT /api/user/profile
 * @desc    Update current user profile
 */
router.put('/profile', async (req, res) => {
    const auth0_id = req.auth.payload.sub;
    const { first_name, firstName, last_name, lastName, interests, hobbies } = req.body;
    
    const fName = first_name || firstName;
    const lName = last_name || lastName;
    const ints = interests || hobbies;

    try {
        const query = `
            UPDATE users 
            SET first_name = $2, last_name = $3, interests = $4, last_ping_time = CURRENT_TIMESTAMP
            WHERE auth0_id = $1
            RETURNING *;
        `;
        const result = await db.query(query, [auth0_id, fName, lName, ints]);
        
        if (result.rowCount === 0) {
            // If not found, insert
            const insertQuery = `INSERT INTO users (auth0_id, first_name, last_name, interests) VALUES ($1, $2, $3, $4) RETURNING *`;
            const insertRes = await db.query(insertQuery, [auth0_id, fName, lName, ints]);
            return res.json({ success: true, user: insertRes.rows[0] });
        }

        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route   GET /api/user/search
 * @desc    Search for users
 */
router.get('/search', async (req, res) => {
    const { q } = req.query;
    const currentAuth0Id = req.auth.payload.sub;

    try {
        const query = `
            SELECT id, auth0_id, first_name as "firstName", last_name as "lastName", interests as hobbies, 
                   (COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) as username,
                   CASE WHEN last_ping_time > NOW() - INTERVAL '5 minutes' THEN true ELSE false END as "isOnline"
            FROM users 
            WHERE auth0_id != $1 
              AND (first_name ILIKE $2 OR last_name ILIKE $2 OR auth0_id ILIKE $2)
            LIMIT 20;
        `;
        const result = await db.query(query, [currentAuth0Id, `%${q}%`]);
        res.json(result.rows);
    } catch (err) {
        console.error('User search error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route   GET /api/user/profile/:auth0_id
 * @desc    Get user profile by Auth0 ID (legacy support)
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
