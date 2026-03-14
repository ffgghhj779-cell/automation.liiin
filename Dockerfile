# Use the official Playwright image which includes all browser dependencies
FROM mcr.microsoft.com/playwright:v1.49.1-noble

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDeps for tsx)
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Ensure the port is exposed
EXPOSE 10000

# Start command: 
# 1. Start a mini health-check server (inline) so Render sees the service as "live"
# 2. Start the actual LinkedIn worker
CMD npx tsx -e "require('http').createServer((q,res)=>{res.writeHead(200);res.end('ok')}).listen(process.env.PORT||10000); require('./worker.ts')"
