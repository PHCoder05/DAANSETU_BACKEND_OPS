const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');
const Message = require('../models/Message');
const { successResponse, errorResponse } = require('../utils/helpers');

// Get chat history with a specific user
const getChatHistory = async (req, res) => {
    try {
        const { recipientId } = req.params;
        const currentUserId = req.user.userId;
        const db = getDB();

        if (!recipientId) {
            return errorResponse(res, 400, 'Recipient ID is required');
        }

        // Use static method on Message class
        const messages = await Message.findHistory(db, currentUserId, recipientId);

        return successResponse(res, 200, 'Chat history retrieved successfully', { messages });
    } catch (error) {
        console.error('Get chat history error:', error);
        return errorResponse(res, 500, 'Error fetching chat history', error.message);
    }
};

// Get list of conversations (optional, for ChatListScreen)
// For now, we are using mock lists in frontend, but this would be the real implementation
const getConversations = async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const db = getDB();

        // MongoDB Aggregation to find latest message per conversation
        const conversations = await db.collection('messages').aggregate([
            {
                $match: {
                    $or: [
                        { senderId: new ObjectId(currentUserId) },
                        { receiverId: new ObjectId(currentUserId) }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$senderId", new ObjectId(currentUserId)] },
                            "$receiverId",
                            "$senderId"
                        ]
                    },
                    lastMessage: { $first: "$$ROOT" }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "otherUser"
                }
            },
            {
                $unwind: "$otherUser"
            },
            {
                $project: {
                    _id: 1,
                    lastMessage: {
                        _id: 1,
                        content: 1,
                        createdAt: 1,
                        isRead: 1,
                        senderId: 1
                    },
                    otherUser: {
                        _id: 1,
                        name: 1,
                        profileImage: 1,
                        role: 1
                    }
                }
            },
            {
                $sort: { "lastMessage.createdAt": -1 }
            }
        ]).toArray();

        return successResponse(res, 200, 'Conversations retrieved successfully', { conversations });
    } catch (error) {
        console.error('Get conversations error:', error);
        return errorResponse(res, 500, 'Error fetching conversations', error.message);
    }
};

module.exports = {
    getChatHistory,
    getConversations
};
