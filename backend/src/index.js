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
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const aiRoutes = require('./routes/ai');
const userRoutes = require('./routes/users');
const chatSocket = require('./sockets/chatSocket');

// Serve the static frontend HTML files
app.use(express.static(path.join(__dirname, '../../')));

// The root route / now automatically serves index.html via express.static

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', require('./routes/friends'));

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
