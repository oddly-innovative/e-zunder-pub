import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getAuthToken, removeAuthToken, isTokenExpired } from "./authUtils";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  
  if (token && !isTokenExpired(token)) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...(data ? { "Content-Type": "application/json" } : {}),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // If token is expired, try to refresh it
  if (res.status === 401) {
    const token = getAuthToken();
    if (token && isTokenExpired(token)) {
      try {
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
        
        if (refreshRes.ok) {
          const { accessToken } = await refreshRes.json();
          localStorage.setItem('accessToken', accessToken);
          
          // Retry the original request with new token
          const retryHeaders = {
            ...getAuthHeaders(),
            ...(data ? { "Content-Type": "application/json" } : {}),
          };
          
          const retryRes = await fetch(url, {
            method,
            headers: retryHeaders,
            body: data ? JSON.stringify(data) : undefined,
            credentials: "include",
          });
          
          await throwIfResNotOk(retryRes);
          return retryRes;
        } else {
          removeAuthToken();
          window.location.href = "/";
        }
      } catch (error) {
        removeAuthToken();
        window.location.href = "/";
      }
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers = getAuthHeaders();
    
    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    // Handle token refresh for queries too
    if (res.status === 401) {
      const token = getAuthToken();
      if (token && isTokenExpired(token)) {
        try {
          const refreshRes = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
          });
          
          if (refreshRes.ok) {
            const { accessToken } = await refreshRes.json();
            localStorage.setItem('accessToken', accessToken);
            
            // Retry with new token
            const retryHeaders = getAuthHeaders();
            const retryRes = await fetch(queryKey[0] as string, {
              headers: retryHeaders,
              credentials: "include",
            });
            
            if (unauthorizedBehavior === "returnNull" && retryRes.status === 401) {
              return null;
            }
            
            await throwIfResNotOk(retryRes);
            return await retryRes.json();
          } else {
            removeAuthToken();
            if (unauthorizedBehavior === "returnNull") {
              return null;
            }
            window.location.href = "/";
          }
        } catch (error) {
          removeAuthToken();
          if (unauthorizedBehavior === "returnNull") {
            return null;
          }
          window.location.href = "/";
        }
      }
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
