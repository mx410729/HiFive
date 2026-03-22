const { auth } = require('express-oauth2-jwt-bearer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const env = require('../config/env');

// Auth0 JWT validation middleware
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE || env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER || env.AUTH0_ISSUER,
  tokenSigningAlg: 'RS256'
});

// Middleware to sync Auth0 user with Prisma database
const syncUser = async (req, res, next) => {
  try {
    const auth0Id = req.auth.payload.sub;
    
    // Find or create user in Prisma
    let user = await prisma.user.findUnique({
      where: { auth0Id }
    });

    if (!user) {
      // Create new user if they don't exist
      // In a production app, you might want to fetch more details from Auth0 Management API
      // For now, we'll create a placeholder and let them update it in Profile Setup
      user = await prisma.user.create({
        data: {
          auth0Id,
          username: `user_${auth0Id.slice(-8)}`, // Fallback username
          isOnline: true,
          lastSeen: new Date()
        }
      });
    } else {
      // Update online status
      await prisma.user.update({
        where: { id: user.id },
        data: { isOnline: true, lastSeen: new Date() }
      });
    }

    // Attach Prisma user object to req.user for use in controllers
    req.user = { 
      userId: user.id, 
      auth0Id: user.auth0Id,
      username: user.username 
    };
    
    next();
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Internal server error during user synchronization' });
  }
};

module.exports = { checkJwt, syncUser };
