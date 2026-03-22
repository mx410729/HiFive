const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.userId;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId }
        }
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true } }
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json(conversations);
  } catch (error) {
    console.error('getConversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    // Verify user is part of the conversation
    const isParticipant = await prisma.participant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId }
      }
    });

    if (!isParticipant) return res.status(403).json({ error: 'Not authorized to view this conversation' });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, username: true } }
      }
    });

    // Mark messages as read
    prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false
      },
      data: { isRead: true }
    }).catch(err => console.error('Failed to mark messages as read:', err));

    res.json(messages);
  } catch (error) {
    console.error('getChatHistory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createSession = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.user.userId;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' });
    }
    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'You cannot chat with yourself.' });
    }

    // Must be friends to chat
    const isFriend = await prisma.friendRequest.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: currentUserId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: currentUserId }
        ]
      }
    });

    if (!isFriend) {
      return res.status(403).json({ error: 'You must be friends to chat.' });
    }

    // Check if a conversation between these two already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: { userId: currentUserId }
            }
          },
          {
            participants: {
              some: { userId: targetUserId }
            }
          }
        ]
      },
      include: {
        participants: true
      }
    });

    if (existingConversation) {
      // Ensure it's exactly a 2-person conversation between these two
      const participantIds = existingConversation.participants.map(p => p.userId);
      if (participantIds.length === 2 && participantIds.includes(currentUserId) && participantIds.includes(targetUserId)) {
        return res.status(200).json(existingConversation);
      }
    }

    // If no existing 1-on-1 conversation, create a new one
    const conv = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: currentUserId },
            { userId: targetUserId }
          ]
        }
      }
    });

    res.status(201).json(conv);
  } catch (error) {
    console.error('createSession error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
