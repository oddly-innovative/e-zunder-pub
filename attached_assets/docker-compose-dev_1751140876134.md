# Docker Compose for Local Development - docker-compose.yml

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: ezunder-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ezunder_dev
      POSTGRES_USER: ezunder
      POSTGRES_PASSWORD: ezunder_dev_password
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql:ro
    networks:
      - ezunder-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ezunder -d ezunder_dev"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: ezunder-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass redis_dev_password
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - ezunder-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  # Backend API Server
  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
      target: development
    container_name: ezunder-backend
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      NODE_ENV: development
      PORT: 8080
      DATABASE_URL: postgresql://ezunder:ezunder_dev_password@postgres:5432/ezunder_dev
      REDIS_URL: redis://:redis_dev_password@redis:6379
      JWT_SECRET: your-super-secret-jwt-key-change-in-production
      JWT_REFRESH_SECRET: your-super-secret-refresh-key-change-in-production
      GOOGLE_CLOUD_PROJECT_ID: your-gcp-project-id
      GOOGLE_CLOUD_LOCATION: us-central1
      FRONTEND_URL: http://localhost:3000
      LOG_LEVEL: debug
    volumes:
      - ./apps/backend/src:/usr/src/app/src:ro
      - ./apps/backend/prisma:/usr/src/app/prisma:ro
      - backend_node_modules:/usr/src/app/node_modules
    networks:
      - ezunder-network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    command: npm run dev

  # Frontend React Application
  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile
      target: development
    container_name: ezunder-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      VITE_API_URL: http://localhost:8080
      VITE_APP_NAME: eZunder
      VITE_APP_ENV: development
      CHOKIDAR_USEPOLLING: true
    volumes:
      - ./apps/frontend/src:/usr/src/app/src:ro
      - ./apps/frontend/public:/usr/src/app/public:ro
      - frontend_node_modules:/usr/src/app/node_modules
    networks:
      - ezunder-network
    depends_on:
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    command: npm run dev

  # Nginx Reverse Proxy (Optional for local development)
  nginx:
    image: nginx:1.25-alpine
    container_name: ezunder-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    networks:
      - ezunder-network
    depends_on:
      - frontend
      - backend
    profiles:
      - proxy

  # Database Management Tool (Optional)
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: ezunder-pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@ezunder.com
      PGADMIN_DEFAULT_PASSWORD: admin_password
      PGADMIN_CONFIG_SERVER_MODE: 'False'
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    networks:
      - ezunder-network
    depends_on:
      - postgres
    profiles:
      - tools

  # Redis Management Tool (Optional)
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: ezunder-redis-commander
    restart: unless-stopped
    environment:
      REDIS_HOSTS: local:redis:6379:0:redis_dev_password
      HTTP_USER: admin
      HTTP_PASSWORD: admin_password
    ports:
      - "8081:8081"
    networks:
      - ezunder-network
    depends_on:
      - redis
    profiles:
      - tools

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  pgadmin_data:
    driver: local
  backend_node_modules:
    driver: local
  frontend_node_modules:
    driver: local

networks:
  ezunder-network:
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.20.0.0/16
```

# Development Dockerfile for Backend - apps/backend/Dockerfile.dev

```dockerfile
# Development Dockerfile for backend
FROM node:18-alpine AS development

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    && ln -sf python3 /usr/bin/python

# Set working directory
WORKDIR /usr/src/app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S ezunder -u 1001

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy prisma schema
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Change ownership
RUN chown -R ezunder:nodejs /usr/src/app

# Switch to non-root user
USER ezunder

# Expose port
EXPOSE 8080

# Start development server
CMD ["npm", "run", "dev"]
```

# Database Schema - apps/backend/prisma/schema.prisma

```prisma
// Prisma schema file
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User model
model User {
  id           String   @id @default(uuid()) @db.Uuid
  email        String   @unique @db.VarChar(255)
  passwordHash String   @map("password_hash") @db.VarChar(255)
  firstName    String   @map("first_name") @db.VarChar(100)
  lastName     String   @map("last_name") @db.VarChar(100)
  role         UserRole @default(USER)
  isActive     Boolean  @default(true) @map("is_active")
  emailVerified Boolean @default(false) @map("email_verified")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relations
  projects  Project[]
  documents Document[]
  aiLogs    AiLog[]

  @@map("users")
}

// Project model
model Project {
  id          String        @id @default(uuid()) @db.Uuid
  name        String        @db.VarChar(255)
  description String?       @db.Text
  status      ProjectStatus @default(DRAFT)
  userId      String        @map("user_id") @db.Uuid
  isArchived  Boolean       @default(false) @map("is_archived")
  settings    Json?         // Project-specific settings
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  // Relations
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  documents Document[]

  @@map("projects")
}

// Document model
model Document {
  id          String         @id @default(uuid()) @db.Uuid
  title       String         @db.VarChar(500)
  content     String?        @db.Text
  summary     String?        @db.Text
  type        DocumentType   @default(ARTICLE)
  status      DocumentStatus @default(DRAFT)
  projectId   String?        @map("project_id") @db.Uuid
  userId      String         @map("user_id") @db.Uuid
  tags        String[]       @default([])
  metadata    Json?          // Document metadata (word count, reading time, etc.)
  version     Int            @default(1)
  isArchived  Boolean        @default(false) @map("is_archived")
  publishedAt DateTime?      @map("published_at")
  createdAt   DateTime       @default(now()) @map("created_at")
  updatedAt   DateTime       @updatedAt @map("updated_at")

  // Relations
  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  project Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)

  @@map("documents")
}

// AI usage log model
model AiLog {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  requestType String   @map("request_type") @db.VarChar(100)
  prompt      String   @db.Text
  response    String   @db.Text
  tokensUsed  Int      @map("tokens_used")
  cost        Decimal? @db.Decimal(10, 4)
  metadata    Json?    // Additional request metadata
  createdAt   DateTime @default(now()) @map("created_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("ai_logs")
}

// Enums
enum UserRole {
  USER
  ADMIN
  SUPER_ADMIN

  @@map("user_role")
}

enum ProjectStatus {
  DRAFT
  ACTIVE
  COMPLETED
  ARCHIVED

  @@map("project_status")
}

enum DocumentType {
  ARTICLE
  BOOK
  REPORT
  SUMMARY
  EMAIL
  BLOG_POST
  SOCIAL_POST

  @@map("document_type")
}

enum DocumentStatus {
  DRAFT
  REVIEW
  PUBLISHED
  ARCHIVED

  @@map("document_status")
}
```

# Database Initialization Script - scripts/init-db.sql

```sql
-- Initialize eZunder database
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create database schema (handled by Prisma migrations)

-- Create indexes for better performance
-- These will be created by Prisma migrations, but including for reference

-- User indexes
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Project indexes
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_user_id ON projects(user_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status ON projects(status);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_created_at ON projects(created_at);

-- Document indexes
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_user_id ON documents(user_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_project_id ON documents(project_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_status ON documents(status);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_type ON documents(type);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_title_gin ON documents USING GIN(to_tsvector('english', title));
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_content_gin ON documents USING GIN(to_tsvector('english', content));
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_tags_gin ON documents USING GIN(tags);

-- AI log indexes
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_logs_user_id ON ai_logs(user_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_logs_request_type ON ai_logs(request_type);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_logs_created_at ON ai_logs(created_at);

-- Create default admin user (for development only)
-- This will be handled by seed scripts in production
```