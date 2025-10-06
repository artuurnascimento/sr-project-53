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

  // Se não há cargo específico requerido, permite acesso
  if (!requiredRole) {
    return <>{children}</>;
  }

  // Bloquear colaboradores de acessar áreas administrativas
  if (requiredRole === 'manager' && profile?.role === 'employee') {
    return <Navigate to="/portal" replace />;
  }

  // Bloquear gerentes e admins de acessar o portal do colaborador
  // (assumindo que rotas do portal não têm requiredRole ou têm requiredRole='employee')
  if (requiredRole === 'employee' && (profile?.role === 'manager' || profile?.role === 'admin')) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Verificar permissões específicas
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
              to={profile?.role === 'employee' ? '/portal' : '/admin/dashboard'} 
              className="px-4 py-2 text-sm bg-primary text-white hover:bg-primary/90 rounded inline-block"
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