FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build the shared library
RUN npm run build

# This stage is used by other services to copy the built shared library
CMD ["echo", "Shared library built successfully"]