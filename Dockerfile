# Use the official Node.js runtime as the base image
FROM node:25-alpine

# Install git since the application requires git commands
RUN apk add --no-cache git

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the source code
COPY source/ ./source/

# Create temp directory for git operations
RUN mkdir -p temp

# Set the entrypoint to the main application
ENTRYPOINT ["node", "source/main.js"]

# Default command shows help
CMD ["--help"]