# Proximity Backend

This backend is built for a Hackathon. It utilizes Express.js, Socket.io, and a PostgreSQL database (with PostGIS enabled) to track physical proximity and compute "Passing Encounters". 

This is tailored for easy deployment on **DigitalOcean App Platform** or pushing to a DO Droplet.

## Requirements
- Node.js (v16+)
- PostgreSQL (v12+) with PostGIS Extension installed

## Environment Setup
Create a `.env` file in the root:
```env
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/proximitydb
NODE_ENV=development
```
*(When deploying to DigitalOcean App Platform, add `DATABASE_URL` directly in the App environment variables).*

## Database Initialization
1. Ensure your Postgres instance is running.
2. Run the SQL located in `src/schema.sql` to generate the PostGIS tables (`users`, `encounters`, `friendships`, `messages`).
   - If using DigitalOcean Managed Database, connect via `psql` or a tool like TablePlus and execute the schema commands.

## Running Locally
```bash
npm install
npm run dev
```

## Core API Flow
1. **Pinging Location**
   The Mobile App calls `POST /api/location/ping` every 30-60 seconds. This updates the database coordinates and automatically checks for nearby users using PostGIS (`ST_DWithin`).
2. **Encounters**
   If a user is within 50 meters, the SQL query increments an `encounter_count` to tally how many times people have passed each other.
3. **Friend Suggestions**
   `GET /api/friends/:userId/list` pulls people you've passed by more than 3 times as "suggestions".
4. **Chat**
   The mobile app connects via Socket.io. Emit `'identify'` with the user ID upon connection. Emitting `'send_message'` automatically logs it in PostgreSQL and broadcasts it instantly.
