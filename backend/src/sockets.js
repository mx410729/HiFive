const { Server } = require('socket.io');
const db = require('./db');

module.exports = (server) => {
    const io = new Server(server, {
        cors: {
            origin: '*',
        }
    });

    io.on('connection', async (socket) => {
        console.log('A user connected:', socket.id);
        
        // In a real app, verify the token here. For now we'll trust the identify or auth object.
        const token = socket.handshake.auth?.token;
        // socket.on('identify', ...) still useful for legacy or simple cases
        
        socket.on('join_room', (data) => {
            const { conversationId } = data;
            console.log(`Socket ${socket.id} joining room ${conversationId}`);
            socket.join(conversationId);
        });

        socket.on('send_message', async (data) => {
            const { conversationId, content } = data;
            // conversationId is "u1_u2" where u1 and u2 are numeric IDs
            const [u1, u2] = conversationId.split('_');
            
            try {
                // Determine who is the sender (we'd need the token or a previous identify)
                // For simplicity, we'll assume the client knows their numeric ID or we can look it up if we have their auth0_id
                // Since our current identification is a bit mixed, let's assume we can find the sender from the token's sub
                // BUT if we don't have the token decoded here, we'll need another way.
                
                // Let's use a simpler approach for now: the client should have 'identify'ed themselves.
                // Or better, let's look up the user by the token if we can.
                
                // Placeholder: finding sender from conversationId vs senderId (if provided)
                // In HiFiveBacup/dashboard.html, sender info is NOT sent in 'send_message', only content and conversationId
                
                // Let's assume we store the numericId on the socket during connection if we have a token
                // For now, I'll just look up a sender for the sake of demo if not found.
                
                const senderNumericId = socket.userId; // We'll set this below
                if (!senderNumericId) return;

                const recipientId = (parseInt(u1) === senderNumericId) ? parseInt(u2) : parseInt(u1);

                const result = await db.query(`
                    INSERT INTO messages (sender_id, recipient_id, content)
                    VALUES ($1, $2, $3)
                    RETURNING id, created_at
                `, [senderNumericId, recipientId, content]);

                // Get sender info for the broadcast
                const senderRes = await db.query('SELECT auth0_id, first_name, last_name, (first_name || " " || last_name) as username FROM users WHERE id = $1', [senderNumericId]);
                const sender = senderRes.rows[0];

                const messageRecord = {
                    id: result.rows[0].id,
                    content,
                    conversationId,
                    sender: {
                        auth0_id: sender.auth0_id,
                        first_name: sender.first_name,
                        username: sender.username
                    },
                    created_at: result.rows[0].created_at
                };

                io.to(conversationId).emit('new_message', messageRecord);

            } catch (err) {
                console.error('Socket send_message error:', err);
            }
        });

        socket.on('identify', async (auth0Id) => {
            try {
                const res = await db.query('SELECT id FROM users WHERE auth0_id = $1', [auth0Id]);
                if (res.rowCount > 0) {
                    socket.userId = res.rows[0].id;
                    socket.join(`user_${auth0Id}`);
                }
            } catch (err) { console.error('Identify error:', err); }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};
