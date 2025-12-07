# Dockerfile for Nuxt.js web-app with built-in Nitro server
FROM node:24-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/.output /app/.output

# Expose port 3000
EXPOSE 3000

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

# Start Nuxt server
CMD ["node", ".output/server/index.mjs"]