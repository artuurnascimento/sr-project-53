import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'employee' | 'admin' | 'manager';
  redirectTo?: string;
}

const ProtectedRoute = ({ children, requiredRole, redirectTo }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
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

  // Check role permissions
  if (requiredRole && profile?.role !== requiredRole && profile?.role !== 'admin') {
    // If user has a role but not the required one, redirect to appropriate panel
    if (profile?.role === 'employee') {
      return <Navigate to="/portal" replace />;
    } else if (profile?.role === 'manager' || profile?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    
    // Fallback to access denied
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Acesso Negado</h1>
          <p className="text-muted-foreground mt-2">
            Você não tem permissão para acessar esta página.
          </p>
          <div className="mt-4 space-x-2">
            <button 
              onClick={() => window.history.back()} 
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Voltar
            </button>
            {profile?.role === 'employee' && (
              <a 
                href="/portal" 
                className="px-4 py-2 text-sm bg-primary text-white hover:bg-primary/90 rounded"
              >
                Ir para Portal do Colaborador
              </a>
            )}
            {(profile?.role === 'admin' || profile?.role === 'manager') && (
              <a 
                href="/admin" 
                className="px-4 py-2 text-sm bg-primary text-white hover:bg-primary/90 rounded"
              >
                Ir para Painel Administrativo
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;