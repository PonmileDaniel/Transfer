FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Remove any ,env file that might have been copied
RUN rm -f .env .env.* || true

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]