import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from '@/components/ui/toaster';

// Layout Components
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

// Page Components
import { Dashboard } from '@/pages/Dashboard';
import { ImageUpload } from '@/pages/ImageUpload';
import { ProcessingQueue } from '@/pages/ProcessingQueue';
import { ReviewCenter } from '@/pages/ReviewCenter';
import { ContentLibrary } from '@/pages/ContentLibrary';
import { Analytics } from '@/pages/Analytics';
import { Settings } from '@/pages/Settings';

// Contexts
import { AuthProvider } from '@/contexts/AuthContext';
import { AIProcessingProvider } from '@/contexts/AIProcessingContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

// Hooks
import { useAuth } from '@/hooks/useAuth';

// Styles
import './App.css';

// React Query Client Setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Protected Route Component
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/**
 * App Layout Component
 */
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header />
          
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

/**
 * Main App Component
 */
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <AIProcessingProvider>
            <Router>
              <div className="App">
                <Routes>
                  {/* Authentication Routes */}
                  <Route path="/login" element={<div>Login Page</div>} />
                  
                  {/* Protected Application Routes */}
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Routes>
                            {/* Dashboard */}
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            
                            {/* AI Style Creator Features */}
                            <Route path="/upload" element={<ImageUpload />} />
                            <Route path="/queue" element={<ProcessingQueue />} />
                            <Route path="/review" element={<ReviewCenter />} />
                            <Route path="/library" element={<ContentLibrary />} />
                            
                            {/* Analytics & Insights */}
                            <Route path="/analytics" element={<Analytics />} />
                            
                            {/* System Management */}
                            <Route path="/settings" element={<Settings />} />
                            
                            {/* Fallback */}
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                          </Routes>
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
                
                {/* Global Components */}
                <Toaster />
                
                {/* Development Tools */}
                {process.env.NODE_ENV === 'development' && (
                  <ReactQueryDevtools initialIsOpen={false} />
                )}
              </div>
            </Router>
          </AIProcessingProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;