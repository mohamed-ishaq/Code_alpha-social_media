FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Copy frontend static files
COPY ../frontend/public ./public

EXPOSE 5000

CMD ["node", "server.js"]
