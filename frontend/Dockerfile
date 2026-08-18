# Build stage
FROM node:20-slim AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
# If pnpm is used, you can use corepack enable && pnpm install, but npm install works since package-lock.json exists
RUN npm ci

# Copy source
COPY . .

# Build the frontend
RUN npm run build

# Serve stage
FROM nginx:alpine

# Copy built assets to Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
