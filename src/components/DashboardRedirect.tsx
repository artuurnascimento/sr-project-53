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
  if (profile.role === 'employee') {
    return <Navigate to="/portal" replace />;
  }

  if (profile.role === 'manager' || profile.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Fallback: se não tiver cargo definido, vai para o portal
  return <Navigate to="/portal" replace />;
};

export default DashboardRedirect;