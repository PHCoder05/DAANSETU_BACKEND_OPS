const Message = require('../models/Message');
const logger = require('../utils/logger');
const { getDB } = require('../config/db');

module.exports = (io) => {
    io.on('connection', (socket) => {
        logger.info(`🔌 New client connected: ${socket.id}`);

        // Join a specific chat room (e.g., based on donationId or userId)
        socket.on('join_room', (room) => {
            socket.join(room);
            logger.info(`Client ${socket.id} joined room: ${room}`);
        });

        // Handle sending messages
        socket.on('send_message', async (data) => {
            try {
                const { sender, recipient, content, donationId } = data;
                const db = getDB();

                // Save to database
                const newMessage = await Message.create(db, {
                    sender,
                    recipient,
                    content,
                    donationId
                });

                // Populate sender info for immediate display
                await newMessage.populate('sender', 'name role');

                // Emit to recipient's room (using their userId as the room)
                io.to(recipient).emit('receive_message', newMessage);

                // Also emit back to sender to confirm saved/populated message
                socket.emit('message_sent', newMessage);

                logger.info(`Message sent from ${sender} to ${recipient}`);
            } catch (error) {
                logger.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Handle typing indicators
        socket.on('typing', (data) => {
            const { room, isTyping } = data;
            socket.to(room).emit('typing_status', { userId: socket.id, isTyping });
        });

        socket.on('disconnect', () => {
            logger.info(`🔌 Client disconnected: ${socket.id}`);
        });
    });
};
