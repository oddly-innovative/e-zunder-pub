import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/components/layout/navbar";
import RichTextEditor from "@/components/editor/rich-text-editor";
import AiAssistant from "@/components/ai/ai-assistant";
import { 
  ArrowLeftIcon, 
  ShareIcon, 
  GlobeIcon, 
  ClockIcon,
  BotIcon,
  UsersIcon,
  SaveIcon,
  MoreVerticalIcon
} from "lucide-react";
import { format } from "date-fns";

interface Document {
  id: string;
  projectId: string;
  title: string;
  content: string;
  type: string;
  status: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  settings?: {
    headingFont?: string;
    bodyFont?: string;
    fontSize?: string;
    lineHeight?: string;
    marginSize?: string;
    pageSize?: string;
  };
}

export default function Editor() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(true);

  // Fetch document data
  const { data: document, isLoading, error } = useQuery<Document>({
    queryKey: [`/api/documents/${id}`],
    enabled: !!id && id !== "new",
    retry: false,
  });

  // Fetch project data
  const { data: project } = useQuery<Project>({
    queryKey: [`/api/projects/${document?.projectId}`],
    enabled: !!document?.projectId,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  // Initialize form data when document loads
  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setContent(document.content);
      setLastSaved(new Date(document.updatedAt));
    }
  }, [document]);

  // Auto-save mutation
  const saveDocumentMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      if (id === "new") {
        // Create new document - would need project selection logic
        throw new Error("Creating new documents not implemented yet");
      } else {
        const response = await apiRequest("PUT", `/api/documents/${id}`, {
          title: data.title,
          content: data.content,
        });
        return response.json();
      }
    },
    onSuccess: (updatedDoc) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents", id] });
      setLastSaved(new Date(updatedDoc.updatedAt));
      setIsSaving(false);
    },
    onError: (error) => {
      setIsSaving(false);
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        toast({
          title: "Error",
          description: "Failed to save document",
          variant: "destructive",
        });
      }
    },
  });

  // Auto-save effect
  useEffect(() => {
    if (!document || (title === document.title && content === document.content)) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsSaving(true);
      saveDocumentMutation.mutate({ title, content });
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [title, content, document, saveDocumentMutation]);

  const handleManualSave = () => {
    if (document && (title !== document.title || content !== document.content)) {
      setIsSaving(true);
      saveDocumentMutation.mutate({ title, content });
    }
  };

  const handleShareDocument = () => {
    toast({
      title: "Share Feature",
      description: "Document sharing will be available soon",
    });
  };

  const handlePublishDocument = () => {
    toast({
      title: "Publish Feature", 
      description: "Document publishing will be available soon",
    });
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getReadingTime = (wordCount: number) => {
    const wordsPerMinute = 200;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error && !isUnauthorizedError(error as Error)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Document not found</h1>
              <p className="text-gray-600 mb-6">The document you're looking for doesn't exist or you don't have permission to view it.</p>
              <Link href="/dashboard">
                <Button>Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentWordCount = getWordCount(content);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Mobile-Optimized Editor Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="flex-shrink-0">
                  <ArrowLeftIcon className="w-4 h-4" />
                </Button>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{title || "Untitled Document"}</h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  {isSaving ? (
                    <span className="flex items-center space-x-1">
                      <div className="spinner w-3 h-3"></div>
                      <span>Saving...</span>
                    </span>
                  ) : lastSaved ? (
                    <span className="flex items-center space-x-1">
                      <SaveIcon className="w-3 h-3" />
                      <span>Auto-saved {format(lastSaved, 'h:mm a')}</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1">
                      <ClockIcon className="w-3 h-3" />
                      <span>{currentWordCount} words</span>
                    </span>
                  )}
                  <span className="mx-2">•</span>
                  <span>{getReadingTime(currentWordCount)} read</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Collaboration Avatars */}
              <div className="flex -space-x-2">
                <Avatar className="w-8 h-8 border-2 border-white">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <Avatar className="w-8 h-8 border-2 border-white">
                  <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32" />
                  <AvatarFallback>AS</AvatarFallback>
                </Avatar>
              </div>
              
              {/* Share Button */}
              <Button variant="outline" size="sm" onClick={handleShareDocument}>
                <ShareIcon className="w-4 h-4 mr-2" />
                Share
              </Button>
              
              {/* Publish Button */}
              <Button size="sm" onClick={handlePublishDocument} className="bg-green-600 hover:bg-green-700">
                <GlobeIcon className="w-4 h-4 mr-2" />
                Publish
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Toolbar */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 overflow-x-auto">
              <div className="flex items-center space-x-2 text-sm text-gray-700 whitespace-nowrap">
                <BotIcon className="w-4 h-4 text-purple-600" />
                <span className="font-medium">AI Assistant:</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="whitespace-nowrap">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  AI Ready
                </Badge>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAiAssistant(!showAiAssistant)}
              className="text-purple-600 hover:text-purple-700"
            >
              {showAiAssistant ? "Hide" : "Show"} AI Assistant
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile-Responsive Editor Content */}
      <div className="flex flex-col lg:flex-row">
        {/* Main Editor */}
        <div className={`flex-1 ${showAiAssistant ? 'lg:pr-4' : ''}`}>
          <div className="max-w-4xl mx-auto p-3 sm:p-6 lg:p-8">
            <Card className="min-h-screen shadow-sm">
              <CardContent className="p-3 sm:p-6 lg:p-8">
                {/* Document Title */}
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xl sm:text-2xl lg:text-3xl font-bold border-none outline-none shadow-none text-gray-900 mb-4 sm:mb-6 lg:mb-8 placeholder-gray-400 p-0 focus-visible:ring-0"
                  placeholder="Document title..."
                />
                
                {/* Rich Text Editor */}
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Start writing your document..."
                  projectStyles={{
                    fontFamily: project?.settings?.bodyFont || 'Georgia',
                    headingFont: project?.settings?.headingFont || 'Georgia',
                    bodyFont: project?.settings?.bodyFont || 'Georgia',
                    fontSize: project?.settings?.fontSize || '16px',
                    lineHeight: project?.settings?.lineHeight || '1.6'
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Mobile-Responsive AI Assistant */}
        {showAiAssistant && (
          <div className="lg:w-80 w-full bg-gray-50 lg:border-l border-t lg:border-t-0 border-gray-200 overflow-y-auto min-h-96 lg:min-h-0">
            <AiAssistant
              documentContent={content}
              onContentUpdate={setContent}
              wordCount={currentWordCount}
            />
          </div>
        )}
      </div>
    </div>
  );
}
