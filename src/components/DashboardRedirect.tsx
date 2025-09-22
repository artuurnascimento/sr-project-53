import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Settings, Clock, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const DashboardRedirect = () => {
  const { user, profile, loading, signOut } = useAuth();

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
    window.location.href = '/auth';
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Bem-vindo, {profile?.full_name || 'Usuário'}! 👋
          </h1>
          <p className="text-slate-600">
            Escolha qual sistema deseja acessar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Portal do Colaborador */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-blue-900">⚡ Portal do Colaborador</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-blue-700 mb-4">
                Registre seu ponto eletrônico, gerencie justificativas e acompanhe seu histórico pessoal.
              </p>
              <Link to="/portal">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">
                  Acessar Meu Portal
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Painel Administrativo */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-red-500 bg-gradient-to-br from-red-50 to-orange-50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-red-900">🔧 Painel Administrativo</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-red-700 mb-4">
                Gerencie colaboradores, aprove justificativas, configure sistemas e gere relatórios.
              </p>
              <Link to="/admin/dashboard">
                <Button variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50">
                  Acessar Administração
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button variant="ghost" onClick={signOut}>
            Sair do Sistema
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardRedirect;