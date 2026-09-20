# Use Node.js 22
FROM node:22-bookworm-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Application directory
WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy application files
COPY . .

# Configure environment
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/dev.db"

# Generate Prisma Client
RUN npx prisma generate --config prisma7.config.ts

# Build the Next.js application
RUN npm run build

# Create database storage directory
RUN mkdir -p /app/data

# Expose application port
EXPOSE 3000

# Apply database migrations before starting Next.js
CMD ["sh", "-c", "npx prisma migrate deploy --config prisma7.config.ts && npm run start"]