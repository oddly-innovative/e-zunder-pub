import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { ProtectedRoute, FeatureGate, AdminOnly } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';

// Page imports
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { SubscriptionPlansPage } from './pages/SubscriptionPlansPage';
import { SettingsPage } from './pages/SettingsPage';
import { PublicationsPage } from './pages/PublicationsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ApiKeysPage } from './pages/ApiKeysPage';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { NotFoundPage } from './pages/NotFoundPage';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SubscriptionProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                {/* Protected routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute requireSubscription>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/publications" element={
                  <ProtectedRoute requireSubscription>
                    <PublicationsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/publications/new" element={
                  <ProtectedRoute requireSubscription>
                    <FeatureGate feature="canCreatePublication">
                      <CreatePublicationPage />
                    </FeatureGate>
                  </ProtectedRoute>
                } />
                
                <Route path="/analytics" element={
                  <ProtectedRoute requiredTier="professional">
                    <AnalyticsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/api-keys" element={
                  <ProtectedRoute requiredTier="enterprise">
                    <ApiKeysPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/settings/*" element={
                  <ProtectedRoute requireSubscription>
                    <SettingsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/subscription/plans" element={
                  <ProtectedRoute>
                    <SubscriptionPlansPage />
                  </ProtectedRoute>
                } />
                
                {/* Admin routes */}
                <Route path="/admin/*" element={
                  <AdminOnly>
                    <AdminPanelPage />
                  </AdminOnly>
                } />
                
                {/* Redirects */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </div>
          </Router>
        </SubscriptionProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;