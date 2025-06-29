import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { authService } from './authService';
import { User, UserSubscription } from '../types/jwt';

interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiService {
  private api: AxiosInstance;
  private readonly baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor with token management
    this.api.interceptors.request.use(
      (config) => {
        const token = authService.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request timestamp for debugging
        config.metadata = { startTime: Date.now() };
        
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor with enhanced error handling
    this.api.interceptors.response.use(
      (response) => {
        // Log request duration in development
        if (process.env.NODE_ENV === 'development' && response.config.metadata) {
          const duration = Date.now() - response.config.metadata.startTime;
          console.log(`API Request: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
        }

        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle network errors
        if (!error.response) {
          throw new Error('Network error: Please check your internet connection');
        }

        // Handle 401 unauthorized errors
        if (error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await authService.refreshTokens();
            const newToken = authService.getAccessToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            authService.logout();
            window.location.href = '/login';
          }
        }

        // Handle other HTTP errors
        const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
        throw new Error(errorMessage);
      }
    );
  }

  // Generic request method with type safety
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api(config);
      return response.data.data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // User management methods
  async getUser(userId: string): Promise<User> {
    return this.request<User>({
      method: 'GET',
      url: `/users/${userId}`,
    });
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    return this.request<User>({
      method: 'PATCH',
      url: `/users/${userId}`,
      data: userData,
    });
  }

  async deleteUser(userId: string): Promise<void> {
    await this.request<void>({
      method: 'DELETE',
      url: `/users/${userId}`,
    });
  }

  // Subscription management methods
  async getSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      return await this.request<UserSubscription>({
        method: 'GET',
        url: `/users/${userId}/subscription`,
      });
    } catch (error) {
      // Return null if no subscription found
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async updateUserSubscription(subscriptionData: Partial<UserSubscription>): Promise<UserSubscription> {
    return this.request<UserSubscription>({
      method: 'POST',
      url: '/subscriptions/update',
      data: subscriptionData,
    });
  }

  async cancelSubscription(stripeSubscriptionId: string): Promise<void> {
    await this.request<void>({
      method: 'POST',
      url: '/subscriptions/cancel',
      data: { stripeSubscriptionId },
    });
  }

  // Stripe integration methods
  async createCheckoutSession(data: {
    priceId: string;
    userId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ sessionId: string }> {
    return this.request<{ sessionId: string }>({
      method: 'POST',
      url: '/stripe/create-checkout-session',
      data,
    });
  }

  async createPortalSession(data: {
    customerId: string;
    returnUrl: string;
  }): Promise<{ url: string }> {
    return this.request<{ url: string }>({
      method: 'POST',
      url: '/stripe/create-portal-session',
      data,
    });
  }

  // Publication management methods (example)
  async getPublications(userId: string, page = 1, limit = 10): Promise<PaginatedResponse<any>> {
    return this.request<PaginatedResponse<any>>({
      method: 'GET',
      url: `/users/${userId}/publications`,
      params: { page, limit },
    });
  }

  async createPublication(publicationData: any): Promise<any> {
    return this.request<any>({
      method: 'POST',
      url: '/publications',
      data: publicationData,
    });
  }

  async updatePublication(publicationId: string, publicationData: any): Promise<any> {
    return this.request<any>({
      method: 'PATCH',
      url: `/publications/${publicationId}`,
      data: publicationData,
    });
  }

  async deletePublication(publicationId: string): Promise<void> {
    await this.request<void>({
      method: 'DELETE',
      url: `/publications/${publicationId}`,
    });
  }

  // Analytics methods (for different tiers)
  async getAnalytics(userId: string, tier: 'basic' | 'advanced' | 'full'): Promise<any> {
    return this.request<any>({
      method: 'GET',
      url: `/analytics/${userId}`,
      params: { tier },
    });
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>({
      method: 'GET',
      url: '/health',
    });
  }
}

// Export singleton instance
export const ApiService = new ApiService();

// Declare module augmentation for axios
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}