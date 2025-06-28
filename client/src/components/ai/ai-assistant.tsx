import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  BotIcon,
  SendIcon,
  SparklesIcon,
  EditIcon,
  LanguagesIcon,
  FileTextIcon,
  LoaderIcon,
  ClipboardIcon,
} from "lucide-react";

interface AiAssistantProps {
  documentContent: string;
  onContentUpdate: (content: string) => void;
  wordCount: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AiResponse {
  content: string;
  tokensUsed: number;
}

export default function AiAssistant({ documentContent, onContentUpdate, wordCount }: AiAssistantProps) {
  const { toast } = useToast();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI writing assistant. I can help you generate content, improve your writing, translate text, or summarize content. How can I assist you today?',
      timestamp: new Date(),
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [selectedText, setSelectedText] = useState('');

  // Content Generation
  const generateContentMutation = useMutation({
    mutationFn: async (data: {
      type: string;
      topic: string;
      tone?: string;
      length?: string;
    }) => {
      const response = await apiRequest("POST", "/api/ai/generate", data);
      return response.json() as Promise<AiResponse>;
    },
    onSuccess: (data) => {
      onContentUpdate(documentContent + '\n\n' + data.content);
      toast({
        title: "Content Generated",
        description: `Used ${data.tokensUsed} tokens`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
      } else {
        toast({
          title: "Error",
          description: "Failed to generate content",
          variant: "destructive",
        });
      }
    },
  });

  // Content Improvement
  const improveContentMutation = useMutation({
    mutationFn: async (data: {
      content: string;
      improvements: string[];
    }) => {
      const response = await apiRequest("POST", "/api/ai/improve", data);
      return response.json() as Promise<AiResponse>;
    },
    onSuccess: (data) => {
      if (selectedText) {
        const newContent = documentContent.replace(selectedText, data.content);
        onContentUpdate(newContent);
      } else {
        onContentUpdate(data.content);
      }
      toast({
        title: "Content Improved",
        description: `Used ${data.tokensUsed} tokens`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
      } else {
        toast({
          title: "Error", 
          description: "Failed to improve content",
          variant: "destructive",
        });
      }
    },
  });

  // Translation
  const translateContentMutation = useMutation({
    mutationFn: async (data: {
      content: string;
      targetLanguage: string;
      preserveFormatting?: boolean;
    }) => {
      const response = await apiRequest("POST", "/api/ai/translate", data);
      return response.json() as Promise<AiResponse>;
    },
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.content);
      toast({
        title: "Content Translated",
        description: `Copied to clipboard. Used ${data.tokensUsed} tokens`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
      } else {
        toast({
          title: "Error",
          description: "Failed to translate content",
          variant: "destructive",
        });
      }
    },
  });

  // Summarization
  const summarizeContentMutation = useMutation({
    mutationFn: async (data: {
      content: string;
      length: string;
      style?: string;
    }) => {
      const response = await apiRequest("POST", "/api/ai/summarize", data);
      return response.json() as Promise<AiResponse>;
    },
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.content);
      toast({
        title: "Content Summarized",
        description: `Copied to clipboard. Used ${data.tokensUsed} tokens`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized", 
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
      } else {
        toast({
          title: "Error",
          description: "Failed to summarize content",
          variant: "destructive",
        });
      }
    },
  });

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');

    // Simulate AI response for now
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I understand you need help with that. I can assist you with content generation, improvement, translation, or summarization. Please use the tools below for specific AI features.',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  const handleGenerateContent = () => {
    const topic = prompt('What topic would you like me to write about?');
    if (topic) {
      generateContentMutation.mutate({
        type: 'article',
        topic,
        tone: 'professional',
        length: 'medium',
      });
    }
  };

  const handleImproveContent = () => {
    const content = selectedText || documentContent;
    if (!content.trim()) {
      toast({
        title: "No Content",
        description: "Please select text or add content to improve",
        variant: "destructive",
      });
      return;
    }

    improveContentMutation.mutate({
      content,
      improvements: ['grammar', 'style', 'clarity'],
    });
  };

  const handleTranslateContent = () => {
    const content = selectedText || documentContent;
    if (!content.trim()) {
      toast({
        title: "No Content",
        description: "Please select text or add content to translate",
        variant: "destructive",
      });
      return;
    }

    const language = prompt('Which language would you like to translate to? (e.g., Spanish, French, German)');
    if (language) {
      translateContentMutation.mutate({
        content,
        targetLanguage: language,
        preserveFormatting: true,
      });
    }
  };

  const handleSummarizeContent = () => {
    const content = selectedText || documentContent;
    if (!content.trim()) {
      toast({
        title: "No Content",
        description: "Please select text or add content to summarize",
        variant: "destructive",
      });
      return;
    }

    summarizeContentMutation.mutate({
      content,
      length: 'moderate',
      style: 'paragraph',
    });
  };

  const aiTools = [
    {
      title: "Generate Content",
      description: "Create new content with AI",
      icon: SparklesIcon,
      color: "bg-blue-50 hover:bg-blue-100 text-blue-700",
      action: handleGenerateContent,
      loading: generateContentMutation.isPending,
    },
    {
      title: "Improve Selected",
      description: "Enhance your writing with AI",
      icon: EditIcon,
      color: "bg-purple-50 hover:bg-purple-100 text-purple-700",
      action: handleImproveContent,
      loading: improveContentMutation.isPending,
    },
    {
      title: "Translate",
      description: "Translate to another language",
      icon: LanguagesIcon,
      color: "bg-orange-50 hover:bg-orange-100 text-orange-700",
      action: handleTranslateContent,
      loading: translateContentMutation.isPending,
    },
    {
      title: "Summarize",
      description: "Create a summary",
      icon: FileTextIcon,
      color: "bg-green-50 hover:bg-green-100 text-green-700",
      action: handleSummarizeContent,
      loading: summarizeContentMutation.isPending,
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 space-y-6">
        {/* AI Chat Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BotIcon className="w-5 h-5" />
              <span>AI Assistant</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg ${
                    message.role === 'assistant' 
                      ? 'bg-gray-50' 
                      : 'bg-blue-50 ml-8'
                  }`}
                >
                  <p className="text-sm text-gray-700">{message.content}</p>
                </div>
              ))}
            </div>
            
            <form onSubmit={handleChatSubmit} className="flex space-x-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask AI for help..."
                className="flex-1"
              />
              <Button type="submit" size="sm">
                <SendIcon className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* AI Tools */}
        <Card>
          <CardHeader>
            <CardTitle>AI Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiTools.map((tool, index) => {
                const Icon = tool.icon;
                return (
                  <Button
                    key={index}
                    variant="ghost"
                    className={`w-full justify-start p-3 h-auto ${tool.color}`}
                    onClick={tool.action}
                    disabled={tool.loading}
                  >
                    <div className="flex items-center space-x-3">
                      {tool.loading ? (
                        <LoaderIcon className="w-5 h-5 animate-spin" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                      <div className="text-left">
                        <div className="font-medium">{tool.title}</div>
                        <div className="text-xs opacity-75">{tool.description}</div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Document Outline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileTextIcon className="w-5 h-5" />
              <span>Document Outline</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="text-gray-500">No headings found</div>
            </div>
          </CardContent>
        </Card>

        {/* Document Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Document Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Words</span>
                <span className="font-medium">{wordCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Characters</span>
                <span className="font-medium">{documentContent.length.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reading Time</span>
                <span className="font-medium">{Math.ceil(wordCount / 200)} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">AI Tokens Used</span>
                <span className="font-medium">0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
