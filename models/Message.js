const { ObjectId } = require('mongodb');

class Message {
    constructor(data) {
        this.sender = new ObjectId(data.sender);
        this.recipient = new ObjectId(data.recipient);
        this.content = data.content;
        this.donationId = data.donationId ? new ObjectId(data.donationId) : null;
        this.read = data.read || false;
        this.createdAt = data.createdAt || new Date();
    }

    static collectionName = 'messages';

    static async create(db, messageData) {
        const message = new Message(messageData);
        const result = await db.collection(this.collectionName).insertOne(message);
        return { ...message, _id: result.insertedId };
    }

    static async findHistory(db, userId1, userId2, limit = 50) {
        return await db.collection(this.collectionName)
            .aggregate([
                {
                    $match: {
                        $or: [
                            { sender: new ObjectId(userId1), recipient: new ObjectId(userId2) },
                            { sender: new ObjectId(userId2), recipient: new ObjectId(userId1) }
                        ]
                    }
                },
                { $sort: { createdAt: 1 } }, // Oldest first
                // Lookup sender details
                {
                    $lookup: {
                        from: 'users',
                        localField: 'sender',
                        foreignField: '_id',
                        as: 'senderDetails'
                    }
                },
                { $unwind: '$senderDetails' },
                {
                    $project: {
                        content: 1,
                        read: 1,
                        createdAt: 1,
                        isMe: { $eq: ['$sender', new ObjectId(userId1)] }, // Helper for frontend? No, controller handles logic
                        sender: {
                            _id: '$senderDetails._id',
                            name: '$senderDetails.name',
                            profileImage: '$senderDetails.profileImage'
                        },
                        recipient: 1
                    }
                }
            ])
            .toArray();
    }
}

module.exports = Message;
