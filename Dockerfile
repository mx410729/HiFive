# Use Node.js LTS as the base image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files to the root
COPY package.json package-lock.json ./

# Install dependencies (including production and dev for build if needed)
RUN npm install

# Copy the rest of the application files
# This includes the backend/ directory and frontend HTML files
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables (these should also be set in DigitalOcean)
ENV NODE_ENV=production
ENV PORT=3000

# Start the application using the root package.json script
CMD ["npm", "start"]
