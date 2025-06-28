import { useQuery } from "@tanstack/react-query";
import { type User } from "@shared/schema";

interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export function useAuth() {
  const { data: response, isLoading, error } = useQuery<{user: AuthUser}>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user: response?.user,
    isLoading,
    isAuthenticated: !!response?.user,
    error,
  };
}
