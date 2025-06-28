import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { removeAuthToken } from "@/lib/authUtils";
import { 
  PenTool, 
  BotIcon, 
  ChevronDownIcon,
  UserIcon,
  SettingsIcon,
  LogOutIcon,
  LayoutDashboard,
  FolderIcon,
  FileTextIcon
} from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();

  // Fetch AI usage data
  const { data: aiUsage } = useQuery<{tokensUsed: string, requestCount: string}>({
    queryKey: ["/api/ai/usage"],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      removeAuthToken();
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout properly",
        variant: "destructive",
      });
      // Force logout anyway
      removeAuthToken();
      window.location.href = "/";
    }
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "Projects", icon: FolderIcon },
    { href: "/documents", label: "Documents", icon: FileTextIcon },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location.startsWith(href);
  };

  const maxTokens = 5000;
  const tokensUsed = parseInt(aiUsage?.tokensUsed || "0");
  const tokensLeft = maxTokens - tokensUsed;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <div className="w-8 h-8 ezunder-gradient-primary rounded-lg flex items-center justify-center">
                  <PenTool className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">eZunder</span>
              </div>
            </Link>
            
            {/* Navigation Links */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center space-x-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant="ghost"
                        className={`flex items-center space-x-2 ${
                          isActive(item.href)
                            ? "text-blue-600 bg-blue-50"
                            : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Button>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* AI Usage Indicator */}
            {isAuthenticated && (
              <Badge variant="secondary" className="hidden sm:flex items-center space-x-2 bg-purple-50 text-purple-700 border-purple-200">
                <BotIcon className="w-3 h-3" />
                <span className="text-xs font-medium">
                  {tokensLeft.toLocaleString()} tokens left
                </span>
              </Badge>
            )}
            
            {/* User Menu */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 h-8 p-0">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName} ${user.lastName}`} />
                      <AvatarFallback>
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDownIcon className="w-3 h-3 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center space-x-2 w-full">
                      <UserIcon className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center space-x-2 w-full">
                      <SettingsIcon className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                    <LogOutIcon className="w-4 h-4 mr-2" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild className="ezunder-button-primary">
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
