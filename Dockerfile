# Use the official Playwright image
FROM mcr.microsoft.com/playwright:v1.58.2-noble

# Set working directory
WORKDIR /app

# Set up user permissions for Hugging Face (UID 1000)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Copy package files
COPY --chown=user package*.json ./
COPY --chown=user prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application
COPY --chown=user . .

# Hugging Face Spaces port
EXPOSE 7860

# Start command: 
# 1. Start a mini health-check server on port 7860 (Hugging Face default)
# 2. Start the actual LinkedIn worker
CMD npx tsx -e "require('http').createServer((q,res)=>{res.writeHead(200);res.end('ok')}).listen(7860); require('./worker.ts')"
