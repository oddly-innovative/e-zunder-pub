import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { JWTPayload, TokenResponse, AuthCredentials, RefreshTokenRequest, AuthError } from '../types/jwt';

class AuthService {
  private api: AxiosInstance;
  private readonly TOKEN_KEY = 'eZunder_access_token';
  private readonly REFRESH_TOKEN_KEY = 'eZunder_refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'eZunder_token_expiry';
  
  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token && this.isTokenValid(token)) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await this.refreshTokens();
            const newToken = this.getAccessToken();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Secure login with comprehensive error handling
  async login(credentials: AuthCredentials): Promise<TokenResponse> {
    try {
      const response: AxiosResponse<TokenResponse> = await this.api.post('/auth/login', {
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password,
      });

      const { accessToken, refreshToken, expiresIn, user } = response.data;
      
      // Validate token structure before storing
      if (!this.isValidTokenStructure(accessToken)) {
        throw new Error('Invalid token received from server');
      }

      this.storeTokens(accessToken, refreshToken, expiresIn);
      return response.data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Secure registration
  async register(userData: AuthCredentials & { name: string }): Promise<TokenResponse> {
    try {
      const response: AxiosResponse<TokenResponse> = await this.api.post('/auth/register', {
        email: userData.email.toLowerCase().trim(),
        password: userData.password,
        name: userData.name.trim(),
      });

      const { accessToken, refreshToken, expiresIn } = response.data;
      this.storeTokens(accessToken, refreshToken, expiresIn);
      return response.data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Token refresh with retry logic
  async refreshTokens(): Promise<TokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response: AxiosResponse<TokenResponse> = await this.api.post('/auth/refresh', {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;
      this.storeTokens(accessToken, newRefreshToken, expiresIn);
      return response.data;
    } catch (error) {
      this.clearTokens();
      throw this.handleAuthError(error);
    }
  }

  // Secure logout with server-side cleanup
  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    
    try {
      if (refreshToken) {
        await this.api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.warn('Server logout failed:', error);
    } finally {
      this.clearTokens();
    }
  }

  // Get current user with token validation
  async getCurrentUser(): Promise<User> {
    const token = this.getAccessToken();
    if (!token || !this.isTokenValid(token)) {
      throw new Error('No valid token available');
    }

    try {
      const response: AxiosResponse<User> = await this.api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Token storage with security considerations
  private storeTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    const expiryTime = Date.now() + (expiresIn * 1000);
    
    // Use sessionStorage for access token (more secure)
    sessionStorage.setItem(this.TOKEN_KEY, accessToken);
    sessionStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    // Use localStorage for refresh token (persists across sessions)
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  // Secure token retrieval
  getAccessToken(): string | null {
    const token = sessionStorage.getItem(this.TOKEN_KEY);
    const expiry = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);
    
    if (!token || !expiry) return null;
    
    // Check if token is expired
    if (Date.now() >= parseInt(expiry)) {
      this.clearAccessToken();
      return null;
    }
    
    return token;
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // Token validation
  private isTokenValid(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  private isValidTokenStructure(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      const payload = this.decodeToken(token);
      return !!(payload.sub && payload.email && payload.exp);
    } catch {
      return false;
    }
  }

  // JWT token decoding
  decodeToken(token: string): JWTPayload {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid token format');
    }
  }

  // Secure token cleanup
  private clearTokens(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  private clearAccessToken(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }

  // Enhanced error handling
  private handleAuthError(error: any): AuthError {
    if (error.response?.data?.error) {
      return {
        code: error.response.data.code || 'AUTH_ERROR',
        message: error.response.data.message || 'Authentication failed',
        statusCode: error.response.status,
      };
    }

    if (error.code === 'NETWORK_ERROR') {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed. Please check your internet connection.',
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
    };
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!(token && this.isTokenValid(token));
  }

  // Get token expiry time
  getTokenExpiryTime(): number | null {
    const expiry = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);
    return expiry ? parseInt(expiry) : null;
  }
}

// Export singleton instance
export const authService = new AuthService();