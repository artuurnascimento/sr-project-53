import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const DashboardRedirect = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Aguardar o profile ser carregado antes de redirecionar
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  // Redirecionamento baseado no cargo
  // Admin e Manager vão para o painel administrativo
  if (profile.role === 'admin' || profile.role === 'manager') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Employee vai para o portal do colaborador
  if (profile.role === 'employee') {
    return <Navigate to="/portal" replace />;
  }

  // Fallback: se não tiver cargo definido, vai para auth
  return <Navigate to="/auth" replace />;
};

export default DashboardRedirect;