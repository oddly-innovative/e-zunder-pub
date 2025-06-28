# Authentication Routes - apps/backend/src/routes/auth.ts

```typescript
import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { APIError } from '../types/errors';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

// Utility functions
const generateAccessToken = (user: AuthenticatedUser): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { 
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'ezunder-api',
      audience: 'ezunder-client',
    }
  );
};

const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    JWT_REFRESH_SECRET,
    { 
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'ezunder-api',
      audience: 'ezunder-client',
    }
  );
};

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validateRequest(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new APIError('User already exists with this email', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: 'user',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.id);

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    // Log successful registration
    logger.info('User registered successfully', { 
      userId: user.id, 
      email: user.email,
      requestId: req.id,
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
      },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return tokens
 * @access  Public
 */
router.post('/login', validateRequest(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!user) {
      throw new APIError('Invalid credentials', 401);
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new APIError('Invalid credentials', 401);
    }

    // Generate tokens
    const userPayload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
    
    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken(user.id);

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    // Log successful login
    logger.info('User logged in successfully', { 
      userId: user.id, 
      email: user.email,
      requestId: req.id,
    });

    res.json({
      message: 'Login successful',
      user: userPayload,
      accessToken,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Private (requires refresh token cookie)
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      throw new APIError('Refresh token not provided', 401);
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!user) {
      throw new APIError('User not found', 404);
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    logger.info('Access token refreshed', { 
      userId: user.id,
      requestId: req.id,
    });

    res.json({
      message: 'Token refreshed successfully',
      accessToken,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new APIError('Invalid refresh token', 401));
    } else {
      next(error);
    }
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear refresh token
 * @access  Private
 */
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    logger.info('User logged out successfully', { 
      requestId: req.id,
    });

    res.json({
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new APIError('Email is required', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (user) {
      // TODO: Implement password reset email logic
      logger.info('Password reset requested', { 
        userId: user.id,
        email: user.email,
        requestId: req.id,
      });
    }

    res.json({
      message: 'If an account with that email exists, we have sent a password reset link.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new APIError('Access token not provided', 401);
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new APIError('User not found', 404);
    }

    res.json({
      user,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new APIError('Invalid access token', 401));
    } else {
      next(error);
    }
  }
});

export default router;
```