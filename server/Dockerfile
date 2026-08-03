FROM node:18-alpine

# Minimal, non-invasive Dockerfile for the Referee (signaling/task) server
WORKDIR /usr/src/app

# Copy package manifests first to leverage Docker layer cache
COPY package*.json ./

# Install only production deps by default
RUN npm ci --only=production

# Copy rest of repository files
COPY . .

# Default port used by server/index.js
ENV PORT=3000
EXPOSE 3000

# Use the simple node entrypoint used by this project
CMD ["node", "index.js"]
