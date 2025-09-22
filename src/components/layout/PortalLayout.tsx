import { ReactNode } from 'react';
import { Home, History, FileText, LogOut, Menu, Bell, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logoSirius from '@/assets/logo-sirius-oficial.png';

interface PortalLayoutProps {
  children: ReactNode;
}

const PortalLayout = ({ children }: PortalLayoutProps) => {
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const navItems = [
    { path: '/portal', icon: Home, label: 'Início' },
    { path: '/portal/historico', icon: History, label: 'Histórico' },
    { path: '/portal/justificativas', icon: FileText, label: 'Justificativas' }
  ];

  const isActive = (path: string) => {
    if (path === '/portal') {
      return location.pathname === '/portal' || location.pathname === '/portal/home';
    }
    return location.pathname === path;
  };

  const NavContent = () => (
    <div className="space-y-2">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            isActive(item.path)
              ? 'bg-gradient-to-r from-green-500 to-cyan-600 text-white shadow-lg shadow-green-500/25'
              : 'text-blue-100 hover:text-white hover:bg-blue-500/20'
          }`}
        >
          <item.icon className="h-5 w-5" />
          <span className="font-medium">{item.label}</span>
        </NavLink>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-green-50">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-blue-600/90 backdrop-blur-md border-b border-blue-200/60 sticky top-0 z-50 text-white">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="flex flex-col h-full bg-white">
                {/* Mobile Sidebar Header */}
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <img 
                      src={logoSirius} 
                      alt="Sirius Ambiental" 
                      className="h-10 w-auto"
                    />
                    <div>
                      <h2 className="font-bold text-white">Sirius Ambiental</h2>
                      <p className="text-sm text-blue-100">⚡ PORTAL DO COLABORADOR</p>
                    </div>
                  </div>
                </div>
                
                <nav className="flex-1 p-6">
                  <NavContent />
                </nav>
                
                <div className="p-6 border-t border-slate-200">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-slate-600 hover:text-slate-900" 
                    onClick={signOut}
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Sair
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          <div className="flex items-center gap-2">
            <img 
              src={logoSirius} 
              alt="Sirius Ambiental" 
              className="h-9 w-auto"
            />
            <div>
              <div className="flex flex-col">
                <h1 className="font-bold text-white text-xs leading-tight">Sirius</h1>
                <h2 className="font-bold text-white text-xs leading-tight -mt-0.5">Ambiental</h2>
                <p className="text-xs text-blue-100 mt-0.5">⚡ PORTAL</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">2</Badge>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary text-white text-xs">
                    {profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{profile?.full_name || 'Usuário'}</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {profile?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-80 min-h-screen">
          <div className="flex flex-col w-full bg-gradient-to-b from-blue-600 to-cyan-700 backdrop-blur-xl border-r border-blue-500/60 shadow-xl text-white">
            {/* Sidebar Header */}
            <div className="p-8 border-b border-blue-500/60">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img 
                    src={logoSirius} 
                    alt="Sirius Ambiental" 
                    className="h-12 w-auto filter brightness-0 invert"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Sirius Ambiental</h2>
                  <p className="text-sm text-blue-100 font-medium">⚡ PORTAL DO COLABORADOR</p>
                </div>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 p-6">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-4">
                  ⚡ MEU PAINEL PESSOAL
                </p>
                <NavContent />
              </div>
              
              {/* Quick Stats */}
              <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-cyan-500/20 border border-green-400/30">
                <h3 className="text-sm font-semibold text-white mb-3">📊 Hoje</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-100">Entrada</span>
                    <span className="text-sm font-medium text-white">08:00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-100">Horas trabalhadas</span>
                    <span className="text-sm font-medium text-green-300">6h 30m</span>
                  </div>
                </div>
              </div>
            </nav>

            {/* User Profile Section */}
            <div className="p-6 border-t border-blue-500/60">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30">
                <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-cyan-600 text-white font-semibold">
                    {profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">
                    {profile?.full_name || 'Usuário'}
                  </div>
                  <div className="text-sm text-blue-100 truncate">
                    ⚡ {profile?.role === 'admin' ? 'ADMINISTRADOR' : profile?.role === 'manager' ? 'GERENTE' : 'COLABORADOR'}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;