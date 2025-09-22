import { ReactNode } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  Plug, 
  FileText,
  LogOut,
  Menu,
  Bell,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/aprovacoes', icon: CheckSquare, label: 'Aprovações' },
    { path: '/admin/relatorios', icon: BarChart3, label: 'Relatórios' },
    { path: '/admin/cadastros', icon: Settings, label: 'Cadastros' },
    { path: '/admin/integracoes', icon: Plug, label: 'Integrações' },
    { path: '/admin/auditoria', icon: FileText, label: 'Auditoria' }
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    return location.pathname === path;
  };

  const NavContent = () => (
    <div className="space-y-2">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            isActive(item.path)
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </NavLink>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">A</span>
                  </div>
                  <span className="font-semibold">Admin</span>
                </div>
                <nav className="flex-1">
                  <NavContent />
                </nav>
                <div className="pt-4 border-t">
                  <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={signOut}>
                    <LogOut className="h-5 w-5 mr-3" />
                    Sair
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="font-semibold">Painel Administrativo</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
            <Badge variant="outline">{profile?.full_name || 'Admin'}</Badge>
          <Badge variant="outline">Admin</Badge>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 min-h-screen border-r bg-card">
          <div className="flex flex-col w-full p-6">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">A</span>
              </div>
              <span className="font-semibold text-lg">Admin</span>
            </div>
            
            <nav className="flex-1">
              <NavContent />
            </nav>

            <div className="pt-6 border-t space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'A'}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-sm">{profile?.full_name || 'Administrador'}</div>
                  <div className="text-xs text-muted-foreground">
                    {profile?.role === 'admin' ? 'Administrador' : profile?.role === 'manager' ? 'Gerente' : 'Colaborador'}
                  </div>
                </div>
              </div>
              <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;