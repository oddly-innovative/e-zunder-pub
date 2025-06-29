export interface JWTPayload {
  sub: string; // User ID
  email: string;
  name: string;
  role: UserRole;
  iat: number; // Issued at
  exp: number; // Expiration time
  subscription?: {
    tier: 'starter' | 'professional' | 'enterprise';
    status: 'active' | 'canceled' | 'past_due' | 'incomplete';
    expiresAt: number;
  };
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthError {
  code: string;
  message: string;
  statusCode?: number;
}

// Enhanced User interface with JWT-specific fields
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  subscription?: UserSubscription;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  lastLoginAt?: Date;
}

export interface UserSubscription {
  id: string;
  tier: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
}

// Security-focused auth state
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: AuthError | null;
  tokenExpiresAt: number | null;
}