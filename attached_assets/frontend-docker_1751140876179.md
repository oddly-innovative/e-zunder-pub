# Frontend Dockerfile with Multi-stage Build - apps/frontend/Dockerfile

```dockerfile
# Multi-stage build for React frontend
# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && ln -sf python3 /usr/bin/python

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci --silent && \
    npm cache clean --force

# Copy source code
COPY public/ ./public/
COPY src/ ./src/
COPY index.html ./

# Build the application
RUN npm run build

# Stage 2: Production stage with Nginx
FROM nginx:1.25-alpine AS production

# Install security updates
RUN apk upgrade --no-cache

# Create non-root user
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001 -G nginx-user

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-default.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder --chown=nginx-user:nginx-user /usr/src/app/dist /usr/share/nginx/html

# Copy startup script
COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

# Create directories and set permissions
RUN mkdir -p /var/cache/nginx /var/run/nginx /var/log/nginx && \
    chown -R nginx-user:nginx-user /var/cache/nginx /var/run/nginx /var/log/nginx /usr/share/nginx/html

# Switch to non-root user
USER nginx-user

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start nginx
CMD ["/usr/local/bin/start.sh"]
```

# Frontend Package.json - apps/frontend/package.json

```json
{
  "name": "@ezunder/frontend",
  "version": "1.0.0",
  "description": "eZunder Frontend React Application",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:analyze": "tsc && vite build --mode analyze",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0 --fix",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist",
    "docker:build": "docker build -t ezunder-frontend .",
    "docker:run": "docker run -p 3000:3000 ezunder-frontend"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "@chakra-ui/react": "^2.8.2",
    "@emotion/react": "^11.11.1",
    "@emotion/styled": "^11.11.0",
    "framer-motion": "^10.16.5",
    "@mui/material": "^5.15.0",
    "@mui/icons-material": "^5.15.0",
    "@mui/lab": "^5.0.0-alpha.157",
    "@mui/x-data-grid": "^6.18.2",
    "@tanstack/react-query": "^5.8.4",
    "@tanstack/react-query-devtools": "^5.8.4",
    "axios": "^1.6.2",
    "react-hook-form": "^7.48.2",
    "@hookform/resolvers": "^3.3.2",
    "zod": "^3.22.4",
    "react-hot-toast": "^2.4.1",
    "react-markdown": "^9.0.1",
    "react-syntax-highlighter": "^15.5.0",
    "date-fns": "^2.30.0",
    "lodash": "^4.17.21",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@types/react-syntax-highlighter": "^15.5.11",
    "@types/lodash": "^4.14.202",
    "@types/uuid": "^9.0.7",
    "@typescript-eslint/eslint-plugin": "^6.13.1",
    "@typescript-eslint/parser": "^6.13.1",
    "@vitejs/plugin-react": "^4.2.0",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "typescript": "^5.3.3",
    "vite": "^5.0.6",
    "vite-plugin-eslint": "^1.8.1",
    "vitest": "^1.0.4",
    "@vitest/ui": "^1.0.4",
    "jsdom": "^23.0.1",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "prettier": "^3.1.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/ezunder/ezunder-app.git",
    "directory": "apps/frontend"
  },
  "author": "eZunder Development Team",
  "license": "MIT"
}
```

# Nginx Configuration - apps/frontend/nginx.conf

```nginx
user nginx-user;
worker_processes auto;
pid /var/run/nginx/nginx.pid;

events {
    worker_connections 1024;
    multi_accept on;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 16M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1000;
    gzip_types
        application/javascript
        application/json
        application/xml
        application/rss+xml
        application/atom+xml
        image/svg+xml
        text/css
        text/javascript
        text/plain
        text/xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.ezunder.com;" always;

    # Include server configurations
    include /etc/nginx/conf.d/*.conf;
}
```

# Nginx Default Configuration - apps/frontend/nginx-default.conf

```nginx
server {
    listen 3000;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Health check endpoint
    location /health {
        access_log off;
        return 200 'healthy\n';
        add_header Content-Type text/plain;
    }

    # Handle static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
        try_files $uri =404;
    }

    # Handle API proxy (if needed for development)
    location /api {
        return 404;
    }

    # Handle React Router (SPA)
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Error pages
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

# Frontend Startup Script - apps/frontend/start.sh

```bash
#!/bin/sh

echo "Starting eZunder Frontend..."

# Create nginx directories
mkdir -p /var/run/nginx
mkdir -p /var/cache/nginx/client_temp
mkdir -p /var/cache/nginx/proxy_temp
mkdir -p /var/cache/nginx/fastcgi_temp
mkdir -p /var/cache/nginx/uwsgi_temp
mkdir -p /var/cache/nginx/scgi_temp

# Start nginx
exec nginx -g 'daemon off;'
```