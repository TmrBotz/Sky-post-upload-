# Use official Node.js LTS image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files first (for caching)
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --production

# Copy all source files
COPY . .

# Expose port (Express uses this)
EXPOSE 3000

# Start the bot
CMD ["node", "bot.js"]
