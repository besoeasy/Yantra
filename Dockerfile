# Multi-stage build for optimized image size
FROM node:lts AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for building)
RUN npm install

# Copy everything for build
COPY . .

# Build Vue.js application
RUN npm run build

# Production stage
FROM node:24-alpine

# Install Docker CLI
RUN apk add --no-cache docker-cli docker-cli-compose

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --production --no-optional && npm cache clean --force

# Copy built Vue.js dist folder from builder
COPY --from=builder /app/dist ./dist

# Copy API files
COPY api/ ./api/

# Copy apps directory
COPY apps/ ./apps/

# Expose port
EXPOSE 5252

# Set environment variables
ENV PORT=5252
ENV NODE_ENV=production

# Run the application
CMD ["npm", "run", "server"]
