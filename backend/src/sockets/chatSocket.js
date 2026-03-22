const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const env = require('../config/env');

const prisma = new PrismaClient();

// In-memory icebreaker state: conversationId -> { question: string, answers: { userId: { username, answer } } }
const icebreakerAnswers = new Map();

module.exports = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    
    jwt.verify(token, env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Authentication error'));
      socket.user = decoded;
      next();
    });
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.userId;
    console.log(`User connected: ${socket.user.username} (${userId})`);

    // Update online status
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: true, lastSeen: new Date() }
      });
    } catch (err) { console.error('Error updating online status:', err); }
    
    // Join personal room for guaranteed delivery
    socket.join(`user_${socket.user.userId}`);

    // Normal chat message
    socket.on('send_message', async (data) => {
      const { conversationId, content } = data;
      const senderId = socket.user.userId;

      try {
        const message = await prisma.message.create({
          data: { conversationId, senderId, content },
          include: { sender: { select: { id: true, username: true } } }
        });

        const conv = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { participants: true }
        });

        if (conv) {
          conv.participants.forEach(p => {
            io.to(`user_${p.userId}`).emit('new_message', message);
          });
        }
      } catch (error) {
        console.error('send_message error:', error);
      }
    });

    // Icebreaker answer submission
    socket.on('icebreaker_answer', async ({ conversationId, question, answer }) => {
      const userId = String(socket.user.userId);  // normalize to string
      const username = socket.user.username;

      // Get or initialize state for this conversation
      if (!icebreakerAnswers.has(conversationId)) {
        icebreakerAnswers.set(conversationId, { question, answers: {} });
      }
      const state = icebreakerAnswers.get(conversationId);
      state.answers[userId] = { username, answer };

      // Look up conversation participants
      const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { participants: true }
      });
      if (!conv) return;

      const participantIds = conv.participants.map(p => String(p.userId));
      const answeredIds = Object.keys(state.answers);  // already strings
      const allAnswered = participantIds.every(id => answeredIds.includes(id));

      if (allAnswered) {
        // Build summary of all answers
        const summary = {
          conversationId,
          question: state.question,
          answers: Object.values(state.answers) // [{ username, answer }, ...]
        };

        // Persist the result to the database as a system message
        try {
          const safe = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br/>');
          let text = `✨ **Icebreaker Complete!**\n\n**Q:** ${state.question}\n\n`;
          text += Object.values(state.answers).map(a => `**${a.username}:** ${a.answer}`).join('\n\n');

          await prisma.message.create({
            data: {
              conversationId,
              senderId: null, // null senderId indicates a system message
              content: text
            }
          });
        } catch (dbErr) {
          console.error('persist icebreaker error:', dbErr);
        }

        // Broadcast complete to all participants
        participantIds.forEach(id => {
          io.to(`user_${id}`).emit('icebreaker_complete', summary);
        });
        // Clean up
        icebreakerAnswers.delete(conversationId);
      } else {
        // Tell the submitter to wait
        socket.emit('icebreaker_waiting', { waitingFor: username, conversationId });
      }
    });

    socket.on('join_room', ({ conversationId }) => {
      socket.join(conversationId);
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username}`);
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: false, lastSeen: new Date() }
        });
      } catch (err) { console.error('Error updating offline status:', err); }
    });
  });
};
