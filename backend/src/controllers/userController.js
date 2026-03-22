const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user.userId;

    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId }
      },
      select: { id: true, username: true }
    });

    const query = (q || '').toLowerCase();
    const filteredUsers = users.filter(u => u.username.toLowerCase().includes(query));

    res.json(filteredUsers);
  } catch (error) {
    console.error('searchUsers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
