import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ""
});

export interface ContentGenerationRequest {
  type: 'article' | 'book' | 'report' | 'summary' | 'email' | 'blog_post' | 'social_post';
  topic: string;
  tone?: 'professional' | 'casual' | 'academic' | 'creative' | 'persuasive';
  length?: 'short' | 'medium' | 'long';
  keywords?: string[];
  context?: string;
}

export interface ContentImprovementRequest {
  content: string;
  improvements: ('grammar' | 'style' | 'clarity' | 'engagement' | 'seo')[];
  targetAudience?: string;
}

export interface TranslationRequest {
  content: string;
  targetLanguage: string;
  preserveFormatting?: boolean;
}

export interface SummarizationRequest {
  content: string;
  length: 'brief' | 'moderate' | 'detailed';
  style?: 'bullet_points' | 'paragraph' | 'outline';
}

export async function generateContent(request: ContentGenerationRequest): Promise<string> {
  try {
    const prompt = buildGenerationPrompt(request);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Content generation failed";
  } catch (error) {
    throw new Error(`Content generation failed: ${error}`);
  }
}

export async function improveContent(request: ContentImprovementRequest): Promise<string> {
  try {
    const prompt = buildImprovementPrompt(request);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
    });

    return response.text || "Content improvement failed";
  } catch (error) {
    throw new Error(`Content improvement failed: ${error}`);
  }
}

export async function translateContent(request: TranslationRequest): Promise<string> {
  try {
    const prompt = `Translate the following content to ${request.targetLanguage}${
      request.preserveFormatting ? ', preserving all formatting, structure, and markdown' : ''
    }. Maintain the original tone and meaning:\n\n${request.content}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
    });

    return response.text || "Translation failed";
  } catch (error) {
    throw new Error(`Translation failed: ${error}`);
  }
}

export async function summarizeContent(request: SummarizationRequest): Promise<string> {
  try {
    const prompt = buildSummarizationPrompt(request);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Summarization failed";
  } catch (error) {
    throw new Error(`Summarization failed: ${error}`);
  }
}

function buildGenerationPrompt(request: ContentGenerationRequest): string {
  let prompt = `Generate a ${request.type} about "${request.topic}".`;
  
  if (request.tone) {
    prompt += ` Use a ${request.tone} tone.`;
  }
  
  if (request.length) {
    const lengthGuide = {
      short: '300-500 words',
      medium: '800-1200 words', 
      long: '1500-2500 words'
    };
    prompt += ` Target length: ${lengthGuide[request.length]}.`;
  }
  
  if (request.keywords && request.keywords.length > 0) {
    prompt += ` Include these keywords naturally: ${request.keywords.join(', ')}.`;
  }
  
  if (request.context) {
    prompt += ` Additional context: ${request.context}.`;
  }
  
  prompt += '\n\nEnsure the content is well-structured, engaging, and informative. Use proper headings and formatting where appropriate.';
  
  return prompt;
}

function buildImprovementPrompt(request: ContentImprovementRequest): string {
  let prompt = `Please improve the following content by focusing on: ${request.improvements.join(', ')}.`;
  
  if (request.targetAudience) {
    prompt += ` Target audience: ${request.targetAudience}.`;
  }
  
  prompt += `\n\nOriginal content:\n${request.content}\n\nProvide the improved version:`;
  
  return prompt;
}

function buildSummarizationPrompt(request: SummarizationRequest): string {
  const lengthGuide = {
    brief: '2-3 sentences',
    moderate: '1-2 paragraphs',
    detailed: '3-4 paragraphs with key points'
  };
  
  let prompt = `Summarize the following content in ${lengthGuide[request.length]}`;
  
  if (request.style) {
    const styleGuide = {
      bullet_points: ' using bullet points',
      paragraph: ' in paragraph format',
      outline: ' as an outline with main points and sub-points'
    };
    prompt += styleGuide[request.style];
  }
  
  prompt += `.\n\nContent to summarize:\n${request.content}`;
  
  return prompt;
}

export function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}
