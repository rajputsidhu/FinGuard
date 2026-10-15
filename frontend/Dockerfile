# ====================================================
# STAGE 1: Build React Production Static Bundle
# ====================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install packages cleanly
RUN npm ci || npm install

# Build argument for API Base URL
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Copy frontend source code
COPY . .

# Build production assets into /app/dist
RUN npm run build

# ====================================================
# STAGE 2: Production Nginx Server
# ====================================================
FROM nginx:1.25-alpine AS production

# Remove default nginx site
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration with SPA fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
