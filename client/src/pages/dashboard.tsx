import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/layout/navbar";
import { useAuth } from "@/hooks/useAuth";
import { 
  PlusIcon, 
  FolderIcon, 
  FileTextIcon, 
  BotIcon, 
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
  EditIcon,
  SparklesIcon,
  LanguagesIcon,
  FileIcon
} from "lucide-react";
import { format } from "date-fns";

interface DashboardStats {
  totalProjects: number;
  totalDocuments: number;
  tokensUsed: number;
  published: number;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  updatedAt: string;
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data: projectsResponse } = useQuery<{projects: Project[], total: number}>({
    queryKey: ["/api/projects"],
  });
  
  const projects = projectsResponse?.projects || [];

  const { data: aiUsage } = useQuery<{tokensUsed: string, requestCount: string}>({
    queryKey: ["/api/ai/usage"],
  });

  // Calculate stats from actual data
  const stats: DashboardStats = {
    totalProjects: projects.length,
    totalDocuments: 0, // This would come from a separate query
    tokensUsed: parseInt(aiUsage?.tokensUsed || "0"),
    published: projects.filter(p => p.status === 'completed').length,
  };

  const recentProjects = projects.slice(0, 3);
  const maxTokens = 5000;
  const usagePercentage = (stats.tokensUsed / maxTokens) * 100;

  const quickActions = [
    {
      title: "Create New Document",
      description: "Start writing with AI assistance",
      icon: <PlusIcon className="w-5 h-5" />,
      color: "bg-blue-50 hover:bg-blue-100 text-blue-700",
      href: "/editor/new"
    },
    {
      title: "Generate AI Content",
      description: "Let AI create content for you",
      icon: <SparklesIcon className="w-5 h-5" />,
      color: "bg-purple-50 hover:bg-purple-100 text-purple-700",
      href: "/ai/generate"
    },
    {
      title: "Improve Existing Content",
      description: "Enhance your writing with AI",
      icon: <EditIcon className="w-5 h-5" />,
      color: "bg-orange-50 hover:bg-orange-100 text-orange-700",
      href: "/ai/improve"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="status-badge-active">Active</span>;
      case 'draft':
        return <span className="status-badge-draft">Draft</span>;
      case 'completed':
        return <span className="status-badge-published">Completed</span>;
      case 'archived':
        return <span className="status-badge-archived">Archived</span>;
      default:
        return <span className="status-badge-draft">Draft</span>;
    }
  };

  const getProjectIcon = (index: number) => {
    const icons = [
      "from-blue-400 to-purple-400",
      "from-orange-400 to-red-400", 
      "from-purple-400 to-pink-400"
    ];
    return icons[index % icons.length];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Dashboard Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-gray-600">Continue your writing journey</p>
            </div>
            <Link href="/projects">
              <Button className="ezunder-button-primary">
                <PlusIcon className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FolderIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Documents</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileTextIcon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">AI Tokens Used</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.tokensUsed.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BotIcon className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Published</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Projects */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Projects</CardTitle>
                  <Link href="/projects">
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                      View all
                      <ArrowRightIcon className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentProjects.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No projects yet</p>
                    <Link href="/projects">
                      <Button>Create Your First Project</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentProjects.map((project, index) => (
                      <Link key={project.id} href={`/projects/${project.id}`}>
                        <div className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                          <div className={`w-12 h-12 bg-gradient-to-br ${getProjectIcon(index)} rounded-lg flex items-center justify-center`}>
                            <FileIcon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{project.name}</h3>
                            <p className="text-sm text-gray-600">
                              Last edited {format(new Date(project.updatedAt), 'MMM d, h:mm a')}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(project.status)}
                            <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Usage Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BotIcon className="w-5 h-5" />
                  <span>AI Usage This Month</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Token Usage Progress */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Tokens Used</span>
                    <span className="font-medium">{stats.tokensUsed.toLocaleString()} / {maxTokens.toLocaleString()}</span>
                  </div>
                  <Progress value={usagePercentage} className="h-2" />
                </div>
                
                {/* AI Feature Usage */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <EditIcon className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-700">Content Generation</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">0</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <SparklesIcon className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-gray-700">Content Improvement</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">0</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <LanguagesIcon className="w-4 h-4 text-orange-600" />
                      <span className="text-sm text-gray-700">Translation</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">0</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileTextIcon className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700">Summarization</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className={`w-full justify-start p-3 h-auto ${action.color}`}
                      asChild
                    >
                      <Link href={action.href}>
                        <div className="flex items-center space-x-3">
                          {action.icon}
                          <div className="text-left">
                            <div className="font-medium">{action.title}</div>
                            <div className="text-xs opacity-75">{action.description}</div>
                          </div>
                        </div>
                      </Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
