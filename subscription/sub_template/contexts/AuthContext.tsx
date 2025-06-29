import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { authService } from '../services/authService';
import { User, AuthState, AuthCredentials, AuthError } from '../types/jwt';

interface AuthContextType {
  state: AuthState;
  login: (credentials: AuthCredentials) => Promise<void>;
  register: (userData: AuthCredentials & { name: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; accessToken: string; refreshToken: string; expiresAt: number } }
  | { type: 'AUTH_FAILURE'; payload: AuthError }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'TOKEN_REFRESH'; payload: { accessToken: string; expiresAt: number } };

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  tokenExpiresAt: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        tokenExpiresAt: action.payload.expiresAt,
        isAuthenticated: true,
        loading: false,
        error: null,
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };

    case 'AUTH_LOGOUT':
      return {
        ...initialState,
        loading: false,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };

    case 'TOKEN_REFRESH':
      return {
        ...state,
        accessToken: action.payload.accessToken,
        tokenExpiresAt: action.payload.expiresAt,
      };

    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication state
  const initializeAuth = useCallback(async () => {
    dispatch({ type: 'AUTH_START' });

    try {
      const token = authService.getAccessToken();
      const expiryTime = authService.getTokenExpiryTime();

      if (token && expiryTime) {
        // Fetch current user data
        const user = await authService.getCurrentUser();
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user,
            accessToken: token,
            refreshToken: '', // Don't expose refresh token in state
            expiresAt: expiryTime,
          },
        });
      } else {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    } catch (error) {
      console.warn('Auth initialization failed:', error);
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  // Login function with enhanced error handling
  const login = useCallback(async (credentials: AuthCredentials) => {
    dispatch({ type: 'AUTH_START' });

    // Input validation
    if (!credentials.email?.trim() || !credentials.password) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: {
          code: 'INVALID_INPUT',
          message: 'Email and password are required',
        },
      });
      return;
    }

    try {
      const response = await authService.login(credentials);
      const expiryTime = authService.getTokenExpiryTime() || Date.now() + (3600 * 1000);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresAt: expiryTime,
        },
      });
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error as AuthError,
      });
    }
  }, []);

  // Register function
  const register = useCallback(async (userData: AuthCredentials & { name: string }) => {
    dispatch({ type: 'AUTH_START' });

    // Input validation
    if (!userData.email?.trim() || !userData.password || !userData.name?.trim()) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: {
          code: 'INVALID_INPUT',
          message: 'All fields are required',
        },
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: {
          code: 'INVALID_EMAIL',
          message: 'Please enter a valid email address',
        },
      });
      return;
    }

    // Password strength validation
    if (userData.password.length < 8) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 8 characters long',
        },
      });
      return;
    }

    try {
      const response = await authService.register(userData);
      const expiryTime = authService.getTokenExpiryTime() || Date.now() + (3600 * 1000);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresAt: expiryTime,
        },
      });
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error as AuthError,
      });
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!state.isAuthenticated) return;

    try {
      const user = await authService.getCurrentUser();
      dispatch({ type: 'UPDATE_USER', payload: user });
    } catch (error) {
      console.warn('Failed to refresh user data:', error);
    }
  }, [state.isAuthenticated]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Token refresh timer
  useEffect(() => {
    if (!state.tokenExpiresAt || !state.isAuthenticated) return;

    const timeToExpiry = state.tokenExpiresAt - Date.now();
    const refreshTime = Math.max(timeToExpiry - (5 * 60 * 1000), 0); // Refresh 5 minutes before expiry

    const timer = setTimeout(async () => {
      try {
        const response = await authService.refreshTokens();
        const newExpiryTime = authService.getTokenExpiryTime() || Date.now() + (3600 * 1000);
        
        dispatch({
          type: 'TOKEN_REFRESH',
          payload: {
            accessToken: response.accessToken,
            expiresAt: newExpiryTime,
          },
        });
      } catch (error) {
        console.error('Token refresh failed:', error);
        await logout();
      }
    }, refreshTime);

    return () => clearTimeout(timer);
  }, [state.tokenExpiresAt, state.isAuthenticated, logout]);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Auto-logout on storage changes (multiple tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'eZunder_refresh_token' && !e.newValue && state.isAuthenticated) {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [state.isAuthenticated]);

  const contextValue: AuthContextType = {
    state,
    login,
    register,
    logout,
    refreshUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook with error handling
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};