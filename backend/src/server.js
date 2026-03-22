require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { auth } = require('express-oauth2-jwt-bearer');

const socketHandler = require('./sockets');
const locationRoutes = require('./routes/location');
const friendsRoutes = require('./routes/friends');
const usersRoutes = require('./routes/user');
const messagesRoutes = require('./routes/messages');
const icebreakerRoutes = require('./routes/icebreaker');

const path = require('path');

const app = express();
const server = http.createServer(app);

// Middlewares first
app.use(cors({
    origin: [
        'https://reese-pagtalunan.github.io',
        'http://localhost:5173'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors({
    origin: [
        'https://reese-pagtalunan.github.io',
        'http://localhost:5173'
    ],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static frontend files from the root directory
app.use(express.static(path.join(__dirname, '../../')));

// Auth0 JWT checker
const checkJwt = auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: process.env.AUTH0_ISSUER,
});

// Socket.io
socketHandler(server);

// Health check (no auth needed)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Protected routes
app.use('/api/location', checkJwt, locationRoutes);
app.use('/api/friends', checkJwt, friendsRoutes);
app.use('/api/user', checkJwt, usersRoutes);
app.use('/api/messages', checkJwt, messagesRoutes);
app.use('/api/icebreaker', checkJwt, icebreakerRoutes);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});