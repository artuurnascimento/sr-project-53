import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Loader2, LogIn } from 'lucide-react';
import logoSirius from '@/assets/logo-sirius-oficial.png';

const Auth = () => {
  const { signIn, loading, user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signIn(loginForm.email, loginForm.password);
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Redirecionamento automático baseado no cargo
  if (user && profile) {
    if (profile.role === 'employee') {
      return <Navigate to="/portal" replace />;
    }
    if (profile.role === 'manager' || profile.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-2xl border-slate-200/50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoSirius} alt="Sirius Ambiental" className="h-20 w-auto" />
          </div>
          <CardDescription>
            Sistema de Gestão - Entre na sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-slate-700 font-medium">Email</Label>
              <Input 
                id="login-email" 
                type="email" 
                placeholder="seu@email.com" 
                className="h-11 border-slate-300 focus:border-primary" 
                value={loginForm.email} 
                onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-slate-700 font-medium">Senha</Label>
              <Input 
                id="login-password" 
                type="password" 
                placeholder="••••••••" 
                className="h-11 border-slate-300 focus:border-primary" 
                value={loginForm.password} 
                onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} 
                required 
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar
                </>
              )}
            </Button>
            
            <div className="text-center pt-4">
              <p className="text-sm text-slate-500">
                Não possui conta? Entre em contato com o administrador.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;