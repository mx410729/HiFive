const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Lazy-load io to avoid circular dependency during startup
function getIo() {
  return require('../index').io;
}

exports.sendRequest = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.user.userId;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'You cannot add yourself as a friend.' });
    }

    const existing = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: currentUserId }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Friend request already exists or users are already connected.' });
    }

    const request = await prisma.friendRequest.create({
      data: {
        senderId: currentUserId,
        receiverId: targetUserId,
        status: 'PENDING'
      }
    });

    // Emit real-time notification to recipient's personal room
    const sender = await prisma.user.findUnique({ where: { id: currentUserId }, select: { username: true } });
    try {
      getIo().to(`user_${targetUserId}`).emit('new_friend_request', {
        requestId: request.id,
        sender: { id: currentUserId, username: sender.username }
      });
    } catch(e) { /* io may not be ready during tests */ }

    res.json(request);
  } catch (error) {
    console.error('sendRequest error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const currentUserId = req.user.userId;

    const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!request || request.receiverId !== currentUserId) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const updated = await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' }
    });

    // Notify the original sender in real-time so they can open the chat pane immediately
    const acceptor = await prisma.user.findUnique({ where: { id: currentUserId }, select: { id: true, username: true } });
    try {
      getIo().to(`user_${request.senderId}`).emit('friend_request_accepted', {
        acceptor: { id: acceptor.id, username: acceptor.username }
      });
    } catch(e) { /* io may not be ready during tests */ }

    res.json(updated);
  } catch (error) {
    console.error('acceptRequest error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.declineRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const currentUserId = req.user.userId;

    const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!request || request.receiverId !== currentUserId) {
      return res.status(404).json({ error: 'Request not found' });
    }

    await prisma.friendRequest.delete({ where: { id: requestId } });
    res.json({ success: true });
  } catch (error) {
    console.error('declineRequest error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.unfriend = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.user.userId;

    const request = await prisma.friendRequest.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: currentUserId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: currentUserId }
        ]
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Friendship not found' });
    }

    await prisma.friendRequest.delete({ where: { id: request.id } });

    // Notify both users in real-time so their Friends tab updates immediately
    try {
      getIo().to(`user_${currentUserId}`).emit('friend_removed', { removedUserId: targetUserId });
      getIo().to(`user_${targetUserId}`).emit('friend_removed', { removedUserId: currentUserId });
    } catch(e) {}

    res.json({ success: true });
  } catch (error) {
    console.error('unfriend error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    const requests = await prisma.friendRequest.findMany({
      where: {
        OR: [{ senderId: currentUserId }, { receiverId: currentUserId }]
      },
      include: {
        sender: { select: { id: true, username: true, isOnline: true, lastSeen: true } },
        receiver: { select: { id: true, username: true, isOnline: true, lastSeen: true } }
      }
    });

    // Helper: count unread messages per sender
    const unreadMessages = await prisma.message.findMany({
      where: {
        isRead: false,
        senderId: { not: currentUserId },
        conversation: {
          participants: { some: { userId: currentUserId } }
        }
      },
      select: { senderId: true }
    });

    const unreadMap = {};
    unreadMessages.forEach(m => {
      if (m.senderId) {
        unreadMap[m.senderId] = (unreadMap[m.senderId] || 0) + 1;
      }
    });

    const friends = [];
    const pendingSent = [];
    const pendingReceived = [];

    requests.forEach(req => {
      const isSender = req.senderId === currentUserId;
      const otherUser = isSender ? req.receiver : req.sender;
      
      if (req.status === 'ACCEPTED') {
        friends.push({
          ...otherUser,
          unreadCount: unreadMap[otherUser.id] || 0
        });
      } else if (req.status === 'PENDING') {
        if (isSender) {
          pendingSent.push({ requestId: req.id, user: otherUser });
        } else {
          pendingReceived.push({ requestId: req.id, user: otherUser });
        }
      }
    });

    res.json({ friends, pendingSent, pendingReceived });
  } catch (error) {
    console.error('getFriends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
