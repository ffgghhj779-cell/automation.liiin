# Use the official Playwright image
FROM mcr.microsoft.com/playwright:v1.58.2-noble

# Root user for setup
USER root

# Create the user 'user' with UID 1000 and the home directory
# Hugging Face Spaces expect UID 1000.
RUN id -u user > /dev/null 2>&1 || useradd -m -u 1000 user

# Set up the application directory
WORKDIR /home/user/app

# Ensure /home/user and its subdirectories are owned by UID 1000
RUN chown -R 1000:1000 /home/user

# Switch to UID 1000
USER 1000

# Set environment variables
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    npm_config_cache=/home/user/.npm

# Copy package files first for better caching
COPY --chown=1000:1000 package*.json ./
COPY --chown=1000:1000 prisma ./prisma/

# Install dependencies (will now have correct permissions in /home/user)
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application
COPY --chown=1000:1000 . .

# Hugging Face Spaces default port
EXPOSE 7860

# Start command:
# 1. Start a simple health-check server on port 7860
# 2. Start the actual worker
CMD npx tsx -e "require('http').createServer((q,res)=>{res.writeHead(200);res.end('ok')}).listen(7860); require('./worker.ts')"
