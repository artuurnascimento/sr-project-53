import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'employee' | 'admin' | 'manager';
  redirectTo?: string;
  allowedRoles?: ('employee' | 'admin' | 'manager')[];
}

const ProtectedRoute = ({ children, requiredRole, allowedRoles, redirectTo }: ProtectedRouteProps) => {
  const { user, profile, loading, signOut } = useAuth();
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

  // Verificar se o usuário está ativo
  if (profile && !profile.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Sua conta foi desativada pelo administrador. Você não tem mais acesso ao sistema.
            </p>
            <p className="text-sm text-muted-foreground">
              Entre em contato com o departamento de RH para mais informações.
            </p>
            <Button 
              onClick={signOut}
              variant="outline"
              className="w-full"
            >
              Sair do Sistema
            </Button>
          </CardContent>
        </Card>
      </div>
    );
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