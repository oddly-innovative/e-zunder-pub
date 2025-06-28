import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navbar from "@/components/layout/navbar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  PlusIcon, 
  FolderIcon, 
  FileTextIcon,
  MoreVerticalIcon,
  ArrowRightIcon,
  SearchIcon,
  FilterIcon,
  EditIcon,
  TrashIcon
} from "lucide-react";
import { format } from "date-fns";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  updatedAt: string;
  createdAt: string;
}

interface Document {
  id: string;
  title: string;
  type: string;
  status: string;
  wordCount: number;
  updatedAt: string;
}

const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived']).default('draft'),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export default function Projects() {
  const { id } = useParams();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "draft",
    },
  });

  // Fetch projects
  const { data: projectsResponse, isLoading: isLoadingProjects } = useQuery<{projects: Project[], total: number}>({
    queryKey: ["/api/projects"],
  });
  
  const projects = projectsResponse?.projects || [];

  // Fetch documents for specific project
  const { data: documentsResponse } = useQuery<{documents: Document[], total: number}>({
    queryKey: [`/api/documents?projectId=${id}`],
    enabled: !!id,
  });
  
  const documents = documentsResponse?.documents || [];

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const response = await apiRequest("POST", "/api/projects", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await apiRequest("DELETE", `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    },
  });

  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: any }) => {
      const response = await apiRequest("POST", "/api/documents", {
        ...data,
        projectId,
      });
      return response.json();
    },
    onSuccess: (document) => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents?projectId=${id}`] });
      toast({
        title: "Success", 
        description: "Document created successfully",
      });
      // Navigate to editor
      window.location.href = `/editor/${document.id}`;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create document",
        variant: "destructive",
      });
    },
  });

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (project.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const onSubmit = (data: ProjectFormData) => {
    createProjectMutation.mutate(data);
  };

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
      "from-green-400 to-blue-400",
      "from-purple-400 to-pink-400",
      "from-orange-400 to-red-400",
      "from-indigo-400 to-purple-400"
    ];
    return icons[index % icons.length];
  };

  // If viewing a specific project, show project details
  if (id) {
    const project = projects.find(p => p.id === id);
    
    if (!project) {
      return (
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Project not found</h1>
              <Link href="/projects">
                <Button>Back to Projects</Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        {/* Project Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                  <Link href="/projects" className="hover:text-gray-900">Projects</Link>
                  <ArrowRightIcon className="w-4 h-4" />
                  <span>{project.name}</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                {project.description && (
                  <p className="text-gray-600 mt-1">{project.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {getStatusBadge(project.status)}
                <Button 
                  onClick={() => createDocumentMutation.mutate({
                    projectId: id!,
                    data: {
                      title: "Untitled Document",
                      type: "article",
                      content: "",
                      status: "draft"
                    }
                  })}
                  disabled={createDocumentMutation.isPending}
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  {createDocumentMutation.isPending ? "Creating..." : "New Document"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Project Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Documents List */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <div className="text-center py-8">
                      <FileTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No documents yet</p>
                      <Button
                        onClick={() => createDocumentMutation.mutate({
                          projectId: id!,
                          data: {
                            title: "Untitled Document",
                            type: "article",
                            content: "",
                            status: "draft"
                          }
                        })}
                        disabled={createDocumentMutation.isPending}
                      >
                        {createDocumentMutation.isPending ? "Creating..." : "Create Your First Document"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {documents.map((document) => (
                        <Link key={document.id} href={`/editor/${document.id}`}>
                          <div className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileTextIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{document.title}</h3>
                              <p className="text-sm text-gray-600">
                                {document.wordCount} words • Last edited {format(new Date(document.updatedAt), 'MMM d, h:mm a')}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(document.status)}
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

            {/* Project Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div className="mt-1">{getStatusBadge(project.status)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Created</label>
                      <p className="text-sm text-gray-900 mt-1">
                        {format(new Date(project.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Last Updated</label>
                      <p className="text-sm text-gray-900 mt-1">
                        {format(new Date(project.updatedAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Project Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Documents</span>
                      <span className="font-medium">{documents.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Words</span>
                      <span className="font-medium">
                        {documents.reduce((sum, doc) => sum + doc.wordCount, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show projects list
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Projects Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
              <p className="text-gray-600">Manage your writing projects</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="ezunder-button-primary">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Name</FormLabel>
                          <FormControl>
                            <Input placeholder="My New Project" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your project..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createProjectMutation.isPending}
                      >
                        {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Projects Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <FilterIcon className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Projects Grid */}
        {isLoadingProjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <FolderIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {projects.length === 0 ? "No projects yet" : "No projects match your search"}
            </h3>
            <p className="text-gray-500 mb-6">
              {projects.length === 0 
                ? "Get started by creating your first project" 
                : "Try adjusting your search terms or filters"
              }
            </p>
            {projects.length === 0 && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                Create Your First Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => (
              <Card key={project.id} className="ezunder-card-hover">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${getProjectIcon(index)} rounded-lg flex items-center justify-center`}>
                      <FolderIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(project.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVerticalIcon className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <EditIcon className="w-4 h-4 mr-2" />
                            Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => deleteProjectMutation.mutate(project.id)}
                          >
                            <TrashIcon className="w-4 h-4 mr-2" />
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2">{project.name}</h3>
                  {project.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Updated {format(new Date(project.updatedAt), 'MMM d')}</span>
                    <Link href={`/projects/${project.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                        <ArrowRightIcon className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
