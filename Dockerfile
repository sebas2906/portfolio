# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install a simple HTTP server to serve the built files
RUN npm install -g http-server

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/static ./static

# Expose port
EXPOSE 8080

# Serve the application
CMD ["http-server", "dist", "-p", "8080", "-g"]
