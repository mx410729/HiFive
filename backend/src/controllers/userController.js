const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user.userId;
    const query = (q || '').trim();

    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        OR: [
          { username: { contains: query } },
          { firstName: { contains: query } },
          { lastName: { contains: query } }
        ]
      },
      select: { 
        id: true, 
        username: true, 
        firstName: true, 
        lastName: true,
        isOnline: true,
        lastSeen: true
      },
      orderBy: [
        { isOnline: 'desc' },
        { lastSeen: 'desc' }
      ],
      take: 20 // Limit to 20 results for performance
    });

    res.json(users);
  } catch (error) {
    console.error('searchUsers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, firstName: true, lastName: true, hobbies: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('getProfile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, hobbies } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { firstName, lastName, hobbies }
    });

    res.json({ message: 'Profile updated successfully', user: { firstName, lastName, hobbies } });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

function getIo() {
  try {
    return require('../index').io;
  } catch (e) {
    return null;
  }
}

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Prisma will handle cascading deletes due to the schema updates
    await prisma.user.delete({
      where: { id: userId }
    });

    // Notify others to remove this user from their UI
    const io = getIo();
    if (io) {
      io.emit('user_deleted', { userId });
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('deleteAccount error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
