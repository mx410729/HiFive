const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const env = require('./config/env');

const app = express();
const server = http.createServer(app);

// Express Middleware
app.use(cors());
app.use(express.json());

const path = require('path');
const chatRoutes = require('./routes/chat');
const aiRoutes = require('./routes/ai');
const userRoutes = require('./routes/users');
const friendsRoutes = require('./routes/friends');
const chatSocket = require('./sockets/chatSocket');
const { checkJwt, syncUser } = require('./middlewares/authMiddleware');

// Serve the static frontend HTML files
app.use(express.static(path.join(__dirname, '../../')));

// The root route / now automatically serves index.html via express.static

// Protect all API routes with Auth0 middleware
app.use('/api/chat', checkJwt, syncUser, chatRoutes);
app.use('/api/ai', checkJwt, syncUser, aiRoutes);
app.use('/api/users', checkJwt, syncUser, userRoutes);
app.use('/api/friends', checkJwt, syncUser, friendsRoutes);

// Initialize Socket.IO (In-memory for local SQLite dev)
const io = new Server(server, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST']
  }
});

chatSocket(io);
module.exports = { io };

// (Connection listener moved to chatSocket.js)

async function startServer() {
  
  server.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
  });
}

startServer();
