# Frontend App Component with Combined Theming - apps/frontend/src/App.tsx

```tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

// Theme imports
import { ezunderChakraTheme } from './theme/chakraTheme';
import { ezunderMuiTheme } from './theme/muiTheme';

// Context providers
import { AuthProvider } from './contexts/AuthContext';
import { AIProvider } from './contexts/AIContext';

// Components
import { Layout } from './components/Layout/Layout';
import { AuthGuard } from './components/Auth/AuthGuard';
import { LoadingSpinner } from './components/UI/LoadingSpinner';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { ProjectsPage } from './pages/Projects/ProjectsPage';
import { ProjectDetailPage } from './pages/Projects/ProjectDetailPage';
import { DocumentsPage } from './pages/Documents/DocumentsPage';
import { DocumentEditorPage } from './pages/Documents/DocumentEditorPage';
import { AIAssistantPage } from './pages/AI/AIAssistantPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Hooks
import { useAuth } from './hooks/useAuth';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

// App Routes Component
const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
      />

      {/* Protected routes */}
      <Route path="/dashboard" element={
        <AuthGuard>
          <Layout>
            <DashboardPage />
          </Layout>
        </AuthGuard>
      } />
      
      <Route path="/projects" element={
        <AuthGuard>
          <Layout>
            <ProjectsPage />
          </Layout>
        </AuthGuard>
      } />
      
      <Route path="/projects/:id" element={
        <AuthGuard>
          <Layout>
            <ProjectDetailPage />
          </Layout>
        </AuthGuard>
      } />
      
      <Route path="/documents" element={
        <AuthGuard>
          <Layout>
            <DocumentsPage />
          </Layout>
        </AuthGuard>
      } />
      
      <Route path="/documents/:id/edit" element={
        <AuthGuard>
          <Layout>
            <DocumentEditorPage />
          </Layout>
        </AuthGuard>
      } />
      
      <Route path="/ai-assistant" element={
        <AuthGuard>
          <Layout>
            <AIAssistantPage />
          </Layout>
        </AuthGuard>
      } />
      
      <Route path="/settings" element={
        <AuthGuard>
          <Layout>
            <SettingsPage />
          </Layout>
        </AuthGuard>
      } />

      {/* 404 route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={ezunderChakraTheme}>
        <ThemeProvider theme={ezunderMuiTheme}>
          <CssBaseline />
          <AuthProvider>
            <AIProvider>
              <Router>
                <div className="app">
                  <AppRoutes />
                  
                  {/* Global components */}
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        background: '#1A202C',
                        color: '#F7FAFC',
                        fontSize: '14px',
                        borderRadius: '8px',
                        padding: '12px 16px',
                      },
                      success: {
                        iconTheme: {
                          primary: '#48BB78',
                          secondary: '#F7FAFC',
                        },
                      },
                      error: {
                        iconTheme: {
                          primary: '#F56565',
                          secondary: '#F7FAFC',
                        },
                      },
                    }}
                  />
                </div>
              </Router>
            </AIProvider>
          </AuthProvider>
        </ThemeProvider>
      </ChakraProvider>
      
      {/* React Query DevTools */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
};

export default App;
```