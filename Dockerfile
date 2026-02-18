# Build stage
FROM node:20-slim AS build-stage

WORKDIR /app

# Install build dependencies (needed for better-sqlite3 native module)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

# Build the Nuxt application
RUN npm run build

# Stage 2 - Run Stage
FROM node:20-slim

WORKDIR /app

# Install openssl for Prisma runtime
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy build output and necessary files
COPY --from=build-stage /app/.output ./.output
COPY --from=build-stage /app/package.json ./package.json

# Create data directory for SQLite
RUN mkdir -p /app/data

# Environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

# Start command
CMD ["node", ".output/server/index.mjs"]
