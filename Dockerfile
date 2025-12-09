# Use a small Node.js base image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the rest of the source code
COPY src ./src
COPY public ./public

# Set environment variables
ENV PORT=3000

# Expose the port used by this service
EXPOSE 3000

# Command to start the server
CMD ["npm", "start"]
