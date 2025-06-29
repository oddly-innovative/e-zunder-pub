import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { authService } from '../services/authService';
import { LoadingSpinner } from './LoadingSpinner';
import { UpgradePrompt } from './UpgradePrompt';
import { ErrorBoundary } from './ErrorBoundary';

interface ProtectedRouteProps {
  children: ReactNode;
  requireSubscription?: boolean;
  requiredTier?: 'starter' | 'professional' | 'enterprise';
  requiredFeature?: string;
  fallback?: ReactNode;
  roles?: Array<'admin' | 'user' | 'guest'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireSubscription = false,
  requiredTier,
  requiredFeature,
  fallback,
  roles = ['user', 'admin'],
}) => {
  const { state: authState } = useAuth();
  const { state: subscriptionState, hasFeature } = useSubscription();
  const location = useLocation();
  const [tokenValidated, setTokenValidated] = useState(false);

  // Validate token integrity on mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        if (authState.accessToken) {
          const isValid = authService.isAuthenticated();
          if (!isValid && authState.isAuthenticated) {
            // Token is invalid but auth state thinks we're authenticated
            console.warn('Token validation failed, logging out');
            await authService.logout();
          }
        }
      } catch (error) {
        console.error('Token validation error:', error);
      } finally {
        setTokenValidated(true);
      }
    };

    validateToken();
  }, [authState.accessToken, authState.isAuthenticated]);

  // Show loading while authentication is being determined
  if (authState.loading || subscriptionState.loading || !tokenValidated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!authState.isAuthenticated || !authState.user) {
    return (
      <Navigate 
        to="/login" 
        state={{ 
          from: location.pathname + location.search,
          message: 'Please log in to access this page'
        }} 
        replace 
      />
    );
  }

  // Check role-based access
  if (roles && roles.length > 0 && !roles.includes(authState.user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Check subscription requirements
  if (requireSubscription && !subscriptionState.subscription) {
    return fallback || <Navigate to="/subscription/plans" replace />;
  }

  // Check tier requirements with hierarchy validation
  if (requiredTier && subscriptionState.subscription) {
    const tierHierarchy = { starter: 1, professional: 2, enterprise: 3 };
    const userTierLevel = tierHierarchy[subscriptionState.subscription.tier];
    const requiredTierLevel = tierHierarchy[requiredTier];

    if (userTierLevel < requiredTierLevel) {
      return fallback || <UpgradePrompt requiredTier={requiredTier} />;
    }
  }

  // Check subscription status (must be active for paid features)
  if (requireSubscription && subscriptionState.subscription?.status !== 'active') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-yellow-600 mb-4">Subscription Required</h2>
          <p className="text-gray-600 mb-4">
            Your subscription is {subscriptionState.subscription?.status || 'inactive'}. 
            Please update your subscription to continue.
          </p>
          <button 
            onClick={() => window.location.href = '/subscription/plans'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Update Subscription
          </button>
        </div>
      </div>
    );
  }

  // Check feature requirements
  if (requiredFeature && !hasFeature(requiredFeature as any)) {
    return fallback || <UpgradePrompt feature={requiredFeature} />;
  }

  // Wrap children in error boundary for additional security
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
};

// Higher-order component for role-based access
export const withRoleProtection = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles: Array<'admin' | 'user' | 'guest'>
) => {
  return (props: P) => (
    <ProtectedRoute roles={requiredRoles}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

// Feature gate component with enhanced security
interface FeatureGateProps {
  feature: string;
  tier?: 'starter' | 'professional' | 'enterprise';
  roles?: Array<'admin' | 'user' | 'guest'>;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgrade?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  tier,
  roles,
  children,
  fallback,
  showUpgrade = true,
}) => {
  const { state: authState } = useAuth();
  const { hasFeature, state: subscriptionState } = useSubscription();

  // Check authentication
  if (!authState.isAuthenticated || !authState.user) {
    return <>{fallback}</>;
  }

  // Check role requirements
  if (roles && roles.length > 0 && !roles.includes(authState.user.role)) {
    return <>{fallback}</>;
  }

  // Check tier requirements
  if (tier && subscriptionState.subscription) {
    const tierHierarchy = { starter: 1, professional: 2, enterprise: 3 };
    const userTierLevel = tierHierarchy[subscriptionState.subscription.tier];
    const requiredTierLevel = tierHierarchy[tier];

    if (userTierLevel < requiredTierLevel) {
      return showUpgrade ? <UpgradePrompt requiredTier={tier} /> : <>{fallback}</>;
    }
  }

  // Check feature access
  if (!hasFeature(feature as any)) {
    return showUpgrade ? <UpgradePrompt feature={feature} /> : <>{fallback}</>;
  }

  return <>{children}</>;
};

// Admin-only component wrapper
export const AdminOnly: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({
  children,
  fallback,
}) => {
  return (
    <FeatureGate 
      feature="admin_access" 
      roles={['admin']} 
      fallback={fallback}
      showUpgrade={false}
    >
      {children}
    </FeatureGate>
  );
};