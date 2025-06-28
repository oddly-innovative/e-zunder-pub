# AI Routes with Vertex AI Integration - apps/backend/src/routes/ai.ts

```typescript
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { VertexAI, GenerativeModel } from '@google-cloud/vertexai';
import { PrismaClient } from '@prisma/client';
import { APIError } from '../types/errors';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT_ID!,
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
});

// Get generative model
const model: GenerativeModel = vertexAI.getGenerativeModel({
  model: 'gemini-2.0-flash-001',
  generationConfig: {
    maxOutputTokens: 8192,
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
  },
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
  ],
});

// Validation schemas
const generateContentSchema = z.object({
  body: z.object({
    prompt: z.string().min(1, 'Prompt is required').max(10000, 'Prompt too long'),
    contentType: z.enum(['article', 'book', 'report', 'summary', 'email']),
    tone: z.enum(['professional', 'casual', 'academic', 'creative']).optional(),
    length: z.enum(['short', 'medium', 'long']).optional(),
    projectId: z.string().uuid().optional(),
  }),
});

const improveContentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Content is required').max(50000, 'Content too long'),
    improvementType: z.enum(['grammar', 'style', 'clarity', 'engagement', 'seo']),
    tone: z.enum(['professional', 'casual', 'academic', 'creative']).optional(),
    projectId: z.string().uuid().optional(),
  }),
});

const summarizeContentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Content is required').max(100000, 'Content too long'),
    summaryLength: z.enum(['brief', 'detailed']).optional().default('brief'),
    projectId: z.string().uuid().optional(),
  }),
});

const translateContentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Content is required').max(50000, 'Content too long'),
    targetLanguage: z.string().min(2, 'Target language is required'),
    preserveFormatting: z.boolean().optional().default(true),
    projectId: z.string().uuid().optional(),
  }),
});

// Utility functions
const logAIUsage = async (
  userId: string,
  requestType: string,
  prompt: string,
  response: string,
  tokensUsed: number
): Promise<void> => {
  try {
    await prisma.aiLog.create({
      data: {
        userId,
        requestType,
        prompt: prompt.substring(0, 5000), // Truncate long prompts
        response: response.substring(0, 10000), // Truncate long responses
        tokensUsed,
      },
    });
  } catch (error) {
    logger.error('Failed to log AI usage:', error);
  }
};

const buildPrompt = (
  basePrompt: string,
  contentType?: string,
  tone?: string,
  length?: string
): string => {
  let systemPrompt = 'You are an expert writing assistant for eZunder, a professional ePublishing platform. ';
  
  if (contentType) {
    systemPrompt += `You are helping create ${contentType} content. `;
  }
  
  if (tone) {
    systemPrompt += `Use a ${tone} tone throughout your response. `;
  }
  
  if (length) {
    const lengthMapping = {
      short: 'Keep your response concise and to the point (200-500 words). ',
      medium: 'Provide a moderate length response (500-1500 words). ',
      long: 'Create a comprehensive and detailed response (1500+ words). ',
    };
    systemPrompt += lengthMapping[length];
  }
  
  systemPrompt += 'Ensure your output is well-structured, engaging, and professional. ';
  
  return `${systemPrompt}\n\nUser request: ${basePrompt}`;
};

/**
 * @route   POST /api/ai/generate
 * @desc    Generate content using AI
 * @access  Private
 */
router.post('/generate', validateRequest(generateContentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt, contentType, tone, length, projectId } = req.body;
    const userId = req.user!.id;

    // Build enhanced prompt
    const enhancedPrompt = buildPrompt(prompt, contentType, tone, length);

    // Generate content using Vertex AI
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: enhancedPrompt }],
        },
      ],
    });

    const response = result.response;
    const generatedText = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new APIError('Failed to generate content', 500);
    }

    // Estimate token usage (rough calculation)
    const tokensUsed = Math.ceil((enhancedPrompt.length + generatedText.length) / 4);

    // Log AI usage
    await logAIUsage(userId, 'content_generation', enhancedPrompt, generatedText, tokensUsed);

    logger.info('Content generated successfully', {
      userId,
      contentType,
      tokensUsed,
      requestId: req.id,
    });

    res.json({
      message: 'Content generated successfully',
      content: generatedText,
      metadata: {
        contentType,
        tone,
        length,
        tokensUsed,
        projectId,
      },
    });
  } catch (error) {
    logger.error('AI content generation failed:', error);
    next(new APIError('Failed to generate content', 500));
  }
});

/**
 * @route   POST /api/ai/improve
 * @desc    Improve existing content using AI
 * @access  Private
 */
router.post('/improve', validateRequest(improveContentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, improvementType, tone, projectId } = req.body;
    const userId = req.user!.id;

    const improvementPrompts = {
      grammar: 'Please review and correct any grammar, spelling, and punctuation errors in the following text while maintaining its original meaning and style:',
      style: 'Please improve the writing style of the following text to make it more engaging and polished:',
      clarity: 'Please rewrite the following text to improve clarity and readability while maintaining all key information:',
      engagement: 'Please rewrite the following text to make it more engaging and compelling for readers:',
      seo: 'Please optimize the following text for search engines while maintaining readability and natural flow:',
    };

    let enhancedPrompt = `${improvementPrompts[improvementType]}\n\n`;
    
    if (tone) {
      enhancedPrompt += `Use a ${tone} tone. `;
    }
    
    enhancedPrompt += `\n\nContent to improve:\n${content}`;

    // Generate improved content
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: enhancedPrompt }],
        },
      ],
    });

    const response = result.response;
    const improvedText = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!improvedText) {
      throw new APIError('Failed to improve content', 500);
    }

    // Estimate token usage
    const tokensUsed = Math.ceil((enhancedPrompt.length + improvedText.length) / 4);

    // Log AI usage
    await logAIUsage(userId, 'content_improvement', enhancedPrompt, improvedText, tokensUsed);

    logger.info('Content improved successfully', {
      userId,
      improvementType,
      tokensUsed,
      requestId: req.id,
    });

    res.json({
      message: 'Content improved successfully',
      originalContent: content,
      improvedContent: improvedText,
      metadata: {
        improvementType,
        tone,
        tokensUsed,
        projectId,
      },
    });
  } catch (error) {
    logger.error('AI content improvement failed:', error);
    next(new APIError('Failed to improve content', 500));
  }
});

/**
 * @route   POST /api/ai/summarize
 * @desc    Summarize content using AI
 * @access  Private
 */
router.post('/summarize', validateRequest(summarizeContentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, summaryLength, projectId } = req.body;
    const userId = req.user!.id;

    const lengthInstructions = {
      brief: 'Create a brief summary in 2-3 sentences highlighting the main points.',
      detailed: 'Create a detailed summary that covers all key points and important details in 1-2 paragraphs.',
    };

    const enhancedPrompt = `${lengthInstructions[summaryLength!]} 

Content to summarize:
${content}`;

    // Generate summary
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: enhancedPrompt }],
        },
      ],
    });

    const response = result.response;
    const summary = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summary) {
      throw new APIError('Failed to generate summary', 500);
    }

    // Estimate token usage
    const tokensUsed = Math.ceil((enhancedPrompt.length + summary.length) / 4);

    // Log AI usage
    await logAIUsage(userId, 'content_summarization', enhancedPrompt, summary, tokensUsed);

    logger.info('Content summarized successfully', {
      userId,
      summaryLength,
      tokensUsed,
      requestId: req.id,
    });

    res.json({
      message: 'Content summarized successfully',
      originalContent: content,
      summary,
      metadata: {
        summaryLength,
        tokensUsed,
        projectId,
      },
    });
  } catch (error) {
    logger.error('AI content summarization failed:', error);
    next(new APIError('Failed to summarize content', 500));
  }
});

/**
 * @route   POST /api/ai/translate
 * @desc    Translate content using AI
 * @access  Private
 */
router.post('/translate', validateRequest(translateContentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, targetLanguage, preserveFormatting, projectId } = req.body;
    const userId = req.user!.id;

    let enhancedPrompt = `Translate the following text to ${targetLanguage}. `;
    
    if (preserveFormatting) {
      enhancedPrompt += 'Preserve all formatting, structure, and styling. ';
    }
    
    enhancedPrompt += 'Maintain the original tone and meaning while ensuring the translation is natural and fluent in the target language.\n\n';
    enhancedPrompt += `Content to translate:\n${content}`;

    // Generate translation
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: enhancedPrompt }],
        },
      ],
    });

    const response = result.response;
    const translation = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!translation) {
      throw new APIError('Failed to translate content', 500);
    }

    // Estimate token usage
    const tokensUsed = Math.ceil((enhancedPrompt.length + translation.length) / 4);

    // Log AI usage
    await logAIUsage(userId, 'content_translation', enhancedPrompt, translation, tokensUsed);

    logger.info('Content translated successfully', {
      userId,
      targetLanguage,
      tokensUsed,
      requestId: req.id,
    });

    res.json({
      message: 'Content translated successfully',
      originalContent: content,
      translatedContent: translation,
      metadata: {
        targetLanguage,
        preserveFormatting,
        tokensUsed,
        projectId,
      },
    });
  } catch (error) {
    logger.error('AI content translation failed:', error);
    next(new APIError('Failed to translate content', 500));
  }
});

/**
 * @route   GET /api/ai/usage
 * @desc    Get AI usage statistics for the current user
 * @access  Private
 */
router.get('/usage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    const whereClause: any = { userId };
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate as string);
      if (endDate) whereClause.createdAt.lte = new Date(endDate as string);
    }

    // Get usage statistics
    const [totalRequests, totalTokens, requestsByType] = await Promise.all([
      prisma.aiLog.count({ where: whereClause }),
      prisma.aiLog.aggregate({
        where: whereClause,
        _sum: { tokensUsed: true },
      }),
      prisma.aiLog.groupBy({
        by: ['requestType'],
        where: whereClause,
        _count: { requestType: true },
        _sum: { tokensUsed: true },
      }),
    ]);

    res.json({
      usage: {
        totalRequests,
        totalTokens: totalTokens._sum.tokensUsed || 0,
        requestsByType: requestsByType.map(item => ({
          type: item.requestType,
          count: item._count.requestType,
          tokens: item._sum.tokensUsed || 0,
        })),
      },
    });
  } catch (error) {
    logger.error('Failed to get AI usage statistics:', error);
    next(new APIError('Failed to get usage statistics', 500));
  }
});

export default router;
```