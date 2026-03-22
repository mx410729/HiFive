require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 8080,
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY
};
