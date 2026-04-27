FROM node:20-alpine AS builder

WORKDIR /app
# Copy package files first for better caching
COPY app/package*.json ./
RUN npm install

# Copy the rest of the app files
COPY app/ ./
RUN npm run build

# Final lightweight runner stage
FROM node:20-alpine

WORKDIR /app

# Copy the built frontend and the node server script
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./
COPY --from=builder /app/package*.json ./

# Install only the production backend dependencies (express, ws)
RUN npm install --omit=dev

# Expose the server port
EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

# Start the express + websocket sync server
CMD ["node", "server.js"]
