import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserSubscription } from '../types/auth';
import { ApiService } from '../services/api';

interface SubscriptionState {
  subscription: UserSubscription | null;
  loading: boolean;
  error: string | null;
  features: SubscriptionFeatures;
}

interface SubscriptionFeatures {
  maxPublications: number;
  customBranding: boolean;
  prioritySupport: boolean;
  apiAccess: boolean;
  whiteLabel: boolean;
  analytics: 'basic' | 'advanced' | 'full';
}

type SubscriptionAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SUBSCRIPTION'; payload: UserSubscription | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_SUBSCRIPTION'; payload: Partial<UserSubscription> };

const subscriptionReducer = (
  state: SubscriptionState,
  action: SubscriptionAction
): SubscriptionState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SUBSCRIPTION':
      return {
        ...state,
        subscription: action.payload,
        features: getFeaturesByTier(action.payload?.tier || null),
        loading: false,
        error: null
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'UPDATE_SUBSCRIPTION':
      if (!state.subscription) return state;
      const updatedSubscription = { ...state.subscription, ...action.payload };
      return {
        ...state,
        subscription: updatedSubscription,
        features: getFeaturesByTier(updatedSubscription.tier)
      };
    default:
      return state;
  }
};

const getFeaturesByTier = (tier: string | null): SubscriptionFeatures => {
  switch (tier) {
    case 'starter':
      return {
        maxPublications: 5,
        customBranding: false,
        prioritySupport: false,
        apiAccess: false,
        whiteLabel: false,
        analytics: 'basic'
      };
    case 'professional':
      return {
        maxPublications: 25,
        customBranding: true,
        prioritySupport: true,
        apiAccess: false,
        whiteLabel: false,
        analytics: 'advanced'
      };
    case 'enterprise':
      return {
        maxPublications: Infinity,
        customBranding: true,
        prioritySupport: true,
        apiAccess: true,
        whiteLabel: true,
        analytics: 'full'
      };
    default:
      return {
        maxPublications: 0,
        customBranding: false,
        prioritySupport: false,
        apiAccess: false,
        whiteLabel: false,
        analytics: 'basic'
      };
  }
};

const SubscriptionContext = createContext<{
  state: SubscriptionState;
  dispatch: React.Dispatch<SubscriptionAction>;
  refreshSubscription: () => Promise<void>;
  hasFeature: (feature: keyof SubscriptionFeatures) => boolean;
  canCreatePublication: () => boolean;
} | null>(null);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [state, dispatch] = useReducer(subscriptionReducer, {
    subscription: user?.subscription || null,
    loading: false,
    error: null,
    features: getFeaturesByTier(user?.subscription?.tier || null)
  });

  const refreshSubscription = async () => {
    if (!isAuthenticated || !user) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const subscription = await ApiService.getSubscription(user.id);
      dispatch({ type: 'SET_SUBSCRIPTION', payload: subscription });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch subscription' });
    }
  };

  const hasFeature = (feature: keyof SubscriptionFeatures): boolean => {
    return !!state.features[feature];
  };

  const canCreatePublication = (): boolean => {
    // This would integrate with your publication count logic
    const currentPublications = 0; // Fetch from your state/API
    return currentPublications < state.features.maxPublications;
  };

  useEffect(() => {
    if (user?.subscription) {
      dispatch({ type: 'SET_SUBSCRIPTION', payload: user.subscription });
    }
  }, [user]);

  return (
    <SubscriptionContext.Provider value={{
      state,
      dispatch,
      refreshSubscription,
      hasFeature,
      canCreatePublication
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};