import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const DashboardRedirect = () => {
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    // Log for debugging
    console.log('DashboardRedirect - User:', user?.id, 'Profile:', profile?.role);
  }, [user, profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecionando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect based on user role
  if (profile?.role === 'admin' || profile?.role === 'manager') {
    return <Navigate to="/admin/dashboard" replace />;
  } else {
    return <Navigate to="/portal" replace />;
  }
};

export default DashboardRedirect;