-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    auth0_id VARCHAR(255) UNIQUE NOT NULL, -- Integrated with Auth0
    username VARCHAR(100), -- Optional if using Auth0
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    interests TEXT,
    geom GEOMETRY(Point, 4326), -- PostGIS Point geometry (Longitude, Latitude)
    last_ping_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Encounters Table
CREATE TABLE IF NOT EXISTS encounters (
    id SERIAL PRIMARY KEY,
    user_a_id INTEGER REFERENCES users(id),
    user_b_id INTEGER REFERENCES users(id),
    encounter_count INTEGER DEFAULT 1,
    last_seen_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_a_id, user_b_id) -- Only one record per pair
);

-- 3. Friendships Table (Status: 'pending', 'accepted', 'blocked')
CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER REFERENCES users(id),
    addressee_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(requester_id, addressee_id)
);

-- 4. Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id),
    recipient_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for fast distance queries
CREATE INDEX IF NOT EXISTS users_geom_idx ON users USING GIST (geom);
