import { Toaster } from "./components/ui/toaster"  // adjust relative path

import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import AuthForm from "./components/auth/AuthForm";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";

// Define types for auth context
interface User {
  id: string;
  email: string;
  // Add other user properties as needed
}

// Create a new QueryClient with proper configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Error Fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-6 max-w-md">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Something went wrong!</h2>
        <pre className="text-sm text-muted-foreground mb-4 overflow-auto">
          {error.message}
        </pre>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

// Loading component
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {user ? (
          <>
            <Route path="/" element={<Dashboard />} />
            {/* Redirect to home if user tries to access auth page while logged in */}
            <Route path="/auth" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/auth" element={<AuthForm />} />
            {/* Redirect to auth if user is not logged in */}
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </>
        )}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <Toaster />
            <Sonner />
            <AppContent />
          </Suspense>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
