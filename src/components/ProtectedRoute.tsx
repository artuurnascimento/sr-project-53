import { ReactNode } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'employee' | 'admin' | 'manager';
  redirectTo?: string;
}

const ProtectedRoute = ({ children, requiredRole, redirectTo }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();

  // Wait for profile to be loaded before checking role
  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user is authenticated but no specific role required, allow access
  if (!requiredRole) {
    return <>{children}</>;
  }

// Check role permissions - only block access if specifically required and user doesn't have permission
  if (requiredRole && profile?.role !== requiredRole && profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Acesso Restrito</h1>
          <p className="text-muted-foreground mt-2">
            Esta área requer permissões de {requiredRole === 'manager' ? 'gerente' : 'administrador'}.
          </p>
          <div className="mt-4 space-x-2">
            <button 
              onClick={() => window.history.back()} 
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Voltar
            </button>
            <Link 
              to="/dashboard-redirect" 
              className="px-4 py-2 text-sm bg-primary text-white hover:bg-primary/90 rounded"
            >
              Ir para Início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;