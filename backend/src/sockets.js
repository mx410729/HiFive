const { Server } = require('socket.io');
const db = require('./db');

module.exports = (server) => {
    const io = new Server(server, {
        cors: {
            origin: '*',
        }
    });

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        // Client identifies themselves upon connection
        socket.on('identify', (userId) => {
            console.log(`User ${userId} identified with socket ${socket.id}`);
            // Join a personal "room" so anyone can message them directly by userId
            socket.join(`user_${userId}`);
        });

        // Handle sending a message
        socket.on('send_message', async (data) => {
            const { senderId, recipientId, content } = data;

            try {
                // 1. Save message to PostgreSQL
                const insertQuery = `
                    INSERT INTO messages (sender_id, recipient_id, content)
                    VALUES ($1, $2, $3)
                    RETURNING id, created_at;
                `;
                const result = await db.query(insertQuery, [senderId, recipientId, content]);

                const messageRecord = {
                    id: result.rows[0].id,
                    senderId,
                    recipientId,
                    content,
                    createdAt: result.rows[0].created_at
                };

                // 2. Emit message to the recipient instantly
                io.to(`user_${recipientId}`).emit('receive_message', messageRecord);

                // 3. Echo back to sender acknowledging success
                socket.emit('message_sent', messageRecord);

            } catch (err) {
                console.error('Error sending message:', err);
                socket.emit('message_error', { error: 'Failed to send message' });
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};
