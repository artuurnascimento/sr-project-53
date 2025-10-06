import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'employee' | 'admin' | 'manager';
  redirectTo?: string;
  allowedRoles?: ('employee' | 'admin' | 'manager')[];
}

const ProtectedRoute = ({ children, requiredRole, allowedRoles, redirectTo }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

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

  // Se não há cargo específico requerido e não há lista de cargos permitidos, permite acesso
  if (!requiredRole && !allowedRoles) {
    return <>{children}</>;
  }

  // Verificar se o usuário tem permissão para acessar esta rota
  const hasPermission = () => {
    if (!profile) return false;
    
    // Se há lista de cargos permitidos, verificar se o usuário está nela
    if (allowedRoles) {
      return allowedRoles.includes(profile.role);
    }
    
    // Admin tem acesso a tudo
    if (profile.role === 'admin') return true;
    
    // Manager tem acesso a rotas de manager
    if (requiredRole === 'manager' && profile.role === 'manager') return true;
    
    // Employee tem acesso apenas a rotas de employee
    if (requiredRole === 'employee' && profile.role === 'employee') return true;
    
    return false;
  };

  // Se não tem permissão, redireciona para a área apropriada
  if (!hasPermission()) {
    // Se foi especificado um redirect customizado, usar ele
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    
    // Determinar para onde redirecionar baseado no role do usuário
    if (profile?.role === 'employee') {
      return <Navigate to="/portal" replace />;
    }
    
    if (profile?.role === 'manager' || profile?.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    
    // Fallback
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;