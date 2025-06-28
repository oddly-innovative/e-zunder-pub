# Backend Server Configuration - apps/backend/src/server.ts

```typescript
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import { VertexAI } from '@google-cloud/vertexai';

// Route imports
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import projectRoutes from './routes/projects';
import documentRoutes from './routes/documents';
import aiRoutes from './routes/ai';

// Middleware imports
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { logger } from './utils/logger';

// Type imports
import { APIError } from './types/errors';

class EzunderServer {
  public app: Application;
  public prisma: PrismaClient;
  public vertexAI: VertexAI;
  private readonly port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '8080', 10);
    
    // Initialize database connection
    this.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });

    // Initialize Vertex AI
    this.vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID!,
      location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
    });

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", "https://api.ezunder.com"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL!]
        : ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Stricter rate limiting for auth endpoints
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // Limit each IP to 5 auth requests per windowMs
      message: {
        error: 'Too many authentication attempts, please try again later.',
      },
    });
    this.app.use('/api/auth', authLimiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Compression
    this.app.use(compression());

    // Logging
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined', {
        stream: {
          write: (message: string) => logger.info(message.trim())
        }
      }));
    }

    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
      });
    });

    // Request ID middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.id = req.get('X-Request-ID') || Math.random().toString(36).substring(2);
      res.set('X-Request-ID', req.id);
      next();
    });
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', authMiddleware, userRoutes);
    this.app.use('/api/projects', authMiddleware, projectRoutes);
    this.app.use('/api/documents', authMiddleware, documentRoutes);
    this.app.use('/api/ai', authMiddleware, aiRoutes);

    // API documentation route
    this.app.get('/api/docs', (req: Request, res: Response) => {
      res.redirect('/docs/openapi.yaml');
    });

    // 404 handler for API routes
    this.app.use('/api/*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'API endpoint not found',
        path: req.path,
        method: req.method,
      });
    });

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        message: 'eZunder API Server',
        version: process.env.npm_package_version || '1.0.0',
        documentation: '/api/docs',
        health: '/health',
      });
    });
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use(errorHandler);

    // Unhandled promise rejection handler
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled Promise Rejection:', reason);
      // Close server gracefully
      this.shutdown();
    });

    // Uncaught exception handler
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      // Close server gracefully
      this.shutdown();
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      this.shutdown();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received. Shutting down gracefully...');
      this.shutdown();
    });
  }

  public async start(): Promise<void> {
    try {
      // Test database connection
      await this.prisma.$connect();
      logger.info('Database connection established');

      // Start server
      this.app.listen(this.port, () => {
        logger.info(`eZunder API Server running on port ${this.port}`);
        logger.info(`Environment: ${process.env.NODE_ENV}`);
        logger.info(`Health check: http://localhost:${this.port}/health`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private async shutdown(): Promise<void> {
    try {
      // Close database connection
      await this.prisma.$disconnect();
      logger.info('Database connection closed');
      
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new EzunderServer();
  server.start();
}

export default EzunderServer;
```