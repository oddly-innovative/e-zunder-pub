import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { 
  loginSchema, 
  registerSchema, 
  insertProjectSchema,
  insertDocumentSchema,
  type User 
} from "@shared/schema";
import {
  generateContent,
  improveContent,
  translateContent,
  summarizeContent,
  estimateTokens,
  type ContentGenerationRequest,
  type ContentImprovementRequest,
  type TranslationRequest,
  type SummarizationRequest,
} from "./services/gemini";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret";

// Middleware to verify JWT token
async function verifyToken(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
  });

  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 12);
      
      // Create user
      const user = await storage.createUser({
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      // Generate tokens
      const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        message: "User registered successfully",
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors 
        });
      }
      console.error('Registration error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const validPassword = await bcrypt.compare(data.password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate tokens
      const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        message: "Login successful",
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors 
        });
      }
      console.error('Login error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/auth/refresh', async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token" });
      }

      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };
      const user = await storage.getUser(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }

      const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
      
      res.json({
        message: "Token refreshed successfully",
        accessToken
      });
    } catch (error) {
      res.status(401).json({ message: "Invalid refresh token" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('refreshToken');
    res.json({ message: "Logout successful" });
  });

  app.get('/api/auth/me', verifyToken, (req: any, res) => {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
      }
    });
  });

  // User routes
  app.get('/api/users/me', verifyToken, (req: any, res) => {
    res.json({
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
    });
  });

  app.put('/api/users/me', verifyToken, async (req: any, res) => {
    try {
      const updateData = z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional(),
      }).parse(req.body);

      const updatedUser = await storage.updateUser(req.user.id, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors 
        });
      }
      console.error('Update user error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Project routes
  app.get('/api/projects', verifyToken, async (req: any, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const projects = await storage.getProjects(req.user.id, limit, offset);
      const total = await storage.getProjectsCount(req.user.id);

      res.json({
        projects,
        total,
        limit,
        offset
      });
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/projects', verifyToken, async (req: any, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(req.user.id, projectData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors 
        });
      }
      console.error('Create project error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/projects/:id', verifyToken, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.id, req.user.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put('/api/projects/:id', verifyToken, async (req: any, res) => {
    try {
      const updateData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, req.user.id, updateData);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors 
        });
      }
      console.error('Update project error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/projects/:id', verifyToken, async (req: any, res) => {
    try {
      const deleted = await storage.deleteProject(req.params.id, req.user.id);
      if (!deleted) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Document routes
  app.get('/api/documents', verifyToken, async (req: any, res) => {
    try {
      const projectId = req.query.projectId as string;
      if (!projectId) {
        return res.status(400).json({ message: "Project ID is required" });
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const documents = await storage.getDocuments(projectId, req.user.id, limit, offset);
      const total = await storage.getDocumentsCount(projectId);

      res.json({
        documents,
        total,
        limit,
        offset
      });
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/documents', verifyToken, async (req: any, res) => {
    try {
      const documentData = insertDocumentSchema.parse(req.body);
      
      // Verify project belongs to user
      const project = await storage.getProject(documentData.projectId, req.user.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const document = await storage.createDocument(documentData.projectId, documentData);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors 
        });
      }
      console.error('Create document error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/documents/:id', verifyToken, async (req: any, res) => {
    try {
      const document = await storage.getDocument(req.params.id, req.user.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error('Get document error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put('/api/documents/:id', verifyToken, async (req: any, res) => {
    try {
      const updateData = insertDocumentSchema.partial().parse(req.body);
      
      // Calculate word count if content is provided
      if (updateData.content) {
        updateData.wordCount = updateData.content.split(/\s+/).filter(word => word.length > 0).length;
      }

      const document = await storage.updateDocument(req.params.id, req.user.id, updateData);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: error.errors 
        });
      }
      console.error('Update document error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/documents/:id', verifyToken, async (req: any, res) => {
    try {
      const deleted = await storage.deleteDocument(req.params.id, req.user.id);
      if (!deleted) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // AI routes
  app.post('/api/ai/generate', verifyToken, async (req: any, res) => {
    try {
      const requestData: ContentGenerationRequest = req.body;
      
      const generatedContent = await generateContent(requestData);
      const tokensUsed = estimateTokens(requestData.topic + (requestData.context || '') + generatedContent);

      // Log AI usage
      await storage.createAiLog({
        userId: req.user.id,
        requestType: 'content_generation',
        prompt: JSON.stringify(requestData),
        response: generatedContent,
        tokensUsed,
      });

      res.json({
        content: generatedContent,
        tokensUsed,
      });
    } catch (error) {
      console.error('Content generation error:', error);
      res.status(500).json({ message: "Content generation failed" });
    }
  });

  app.post('/api/ai/improve', verifyToken, async (req: any, res) => {
    try {
      const requestData: ContentImprovementRequest = req.body;
      
      const improvedContent = await improveContent(requestData);
      const tokensUsed = estimateTokens(requestData.content + improvedContent);

      // Log AI usage
      await storage.createAiLog({
        userId: req.user.id,
        requestType: 'content_improvement',
        prompt: JSON.stringify(requestData),
        response: improvedContent,
        tokensUsed,
      });

      res.json({
        content: improvedContent,
        tokensUsed,
      });
    } catch (error) {
      console.error('Content improvement error:', error);
      res.status(500).json({ message: "Content improvement failed" });
    }
  });

  app.post('/api/ai/translate', verifyToken, async (req: any, res) => {
    try {
      const requestData: TranslationRequest = req.body;
      
      const translatedContent = await translateContent(requestData);
      const tokensUsed = estimateTokens(requestData.content + translatedContent);

      // Log AI usage
      await storage.createAiLog({
        userId: req.user.id,
        requestType: 'translation',
        prompt: JSON.stringify(requestData),
        response: translatedContent,
        tokensUsed,
      });

      res.json({
        content: translatedContent,
        tokensUsed,
      });
    } catch (error) {
      console.error('Translation error:', error);
      res.status(500).json({ message: "Translation failed" });
    }
  });

  app.post('/api/ai/summarize', verifyToken, async (req: any, res) => {
    try {
      const requestData: SummarizationRequest = req.body;
      
      const summary = await summarizeContent(requestData);
      const tokensUsed = estimateTokens(requestData.content + summary);

      // Log AI usage
      await storage.createAiLog({
        userId: req.user.id,
        requestType: 'summarization',
        prompt: JSON.stringify(requestData),
        response: summary,
        tokensUsed,
      });

      res.json({
        content: summary,
        tokensUsed,
      });
    } catch (error) {
      console.error('Summarization error:', error);
      res.status(500).json({ message: "Summarization failed" });
    }
  });

  app.get('/api/ai/usage', verifyToken, async (req: any, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const usage = await storage.getAiUsage(req.user.id, startDate, endDate);
      res.json(usage);
    } catch (error) {
      console.error('Get AI usage error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
