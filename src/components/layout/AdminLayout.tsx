import { ReactNode, useState, useEffect } from 'react';
import { Home, CheckCircle, FileText, UserPlus, Settings, Search, LogOut, Menu, Bell, User, MapPin, Clock, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import logoSirius from '@/assets/logo-sirius-oficial.png';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingJustifications, setPendingJustifications] = useState<any[]>([]);

  // Load pending justifications count
  useEffect(() => {
    const loadPendingCount = async () => {
      try {
        const { data, error } = await supabase
          .from('justifications')
          .select(`
            *,
            profiles:employee_id (
              full_name,
              email
            )
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        
        setPendingJustifications(data || []);
        setPendingCount(data?.length || 0);
      } catch (error) {
        console.error('Error loading pending count:', error);
      }
    };

    loadPendingCount();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('justifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'justifications',
          filter: 'status=eq.pending'
        },
        () => {
          loadPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      'absence': 'Falta',
      'overtime': 'Hora Extra',
      'vacation': 'Férias',
      'expense': 'Despesa',
      'other': 'Outro'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const navItems = [
    { path: '/admin/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/admin/aprovacoes', icon: CheckCircle, label: 'Aprovações' },
    { path: '/admin/relatorios', icon: FileText, label: 'Relatórios' },
    { path: '/admin/cadastros', icon: UserPlus, label: 'Cadastros' },
    { path: '/admin/localizacoes', icon: MapPin, label: 'Localizações' },
    { path: '/admin/horarios', icon: Clock, label: 'Horários' },
    { path: '/admin/integracoes', icon: Settings, label: 'Integrações' },
    { path: '/admin/auditoria', icon: Search, label: 'Auditoria' },
    { path: '/admin/comprovantes', icon: FileCheck, label: 'Comprovantes' }
  ];

  const isActive = (path: string) => {
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
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <item.icon className="h-5 w-5" />
          <span className="font-medium">{item.label}</span>
        </NavLink>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-white/90 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 text-slate-900">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 bg-gradient-to-b from-slate-900 to-slate-800 border-slate-700/60">
              <div className="flex flex-col h-full">
                {/* Mobile Sidebar Header */}
                <div className="p-6 border-b border-slate-700/60">
                  <div className="flex items-center gap-3">
                    <img 
                      src={logoSirius} 
                      alt="Sirius Ambiental" 
                      className="h-10 w-auto filter brightness-0 invert"
                    />
                  </div>
                </div>
                
                {/* Menu Label */}
                <div className="px-6 pt-6 pb-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Menu
                  </p>
                </div>
                
                {/* Navigation */}
                <nav className="flex-1 px-6">
                  <NavContent />
                </nav>
                
                {/* User Profile Section */}
                <div className="p-6 border-t border-slate-700/60">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-slate-700/20 to-slate-600/20 border border-slate-600/30">
                    <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                      <AvatarImage src={profile?.avatar_url || ''} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                        {profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'AD'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white truncate">
                        {profile?.full_name || 'Administrador'}
                      </div>
                      <div className="text-sm text-slate-300 truncate">
                        {profile?.role === 'admin' ? 'Administrador' : 'Gerente'}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700/50 mt-4" 
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
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                {pendingCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-orange-500 hover:bg-orange-600">
                    {pendingCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-sm">Notificações</h3>
                <p className="text-xs text-muted-foreground">
                  {pendingCount} aprovação(ões) pendente(s)
                </p>
              </div>
              <ScrollArea className="h-80">
                {pendingJustifications.length > 0 ? (
                  <div className="p-2">
                    {pendingJustifications.map((justification) => (
                      <button
                        key={justification.id}
                        onClick={() => navigate('/admin/aprovacoes')}
                        className="w-full p-3 rounded-lg hover:bg-slate-50 transition-colors text-left mb-1"
                      >
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {justification.profiles?.full_name || 'Usuário'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {getTypeLabel(justification.request_type)} - {justification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimeAgo(justification.created_at)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Nenhuma notificação pendente
                  </div>
                )}
              </ScrollArea>
              {pendingCount > 0 && (
                <div className="p-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate('/admin/aprovacoes')}
                  >
                    Ver todas as aprovações
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary text-white text-xs">
                    {profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'AD'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{profile?.full_name || 'Administrador'}</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {profile?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <NavLink to="/portal/perfil" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Meu Perfil
                </NavLink>
              </DropdownMenuItem>
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
          <div className="flex flex-col w-full bg-gradient-to-b from-slate-900 to-slate-800 backdrop-blur-xl border-r border-slate-700/60 shadow-xl text-white">
            {/* Sidebar Header */}
            <div className="p-8 border-b border-slate-700/60">
              <div className="flex items-center gap-4">
                <img 
                  src={logoSirius} 
                  alt="Sirius Ambiental" 
                  className="h-12 w-auto filter brightness-0 invert"
                />
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex-1 p-6">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Menu
                </p>
                <NavContent />
              </div>
            </nav>

            {/* User Profile Section */}
            <div className="p-6 border-t border-slate-700/60">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-slate-700/20 to-slate-600/20 border border-slate-600/30">
                <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                    {profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'AD'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">
                    {profile?.full_name || 'Administrador'}
                  </div>
                  <div className="text-sm text-slate-300 truncate">
                    {profile?.role === 'admin' ? 'Administrador' : 'Gerente'}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <NavLink to="/portal/perfil" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Meu Perfil
                      </NavLink>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
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
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          {/* Desktop Header with Notifications */}
          <div className="hidden lg:flex items-center justify-end mb-6 gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  {pendingCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-orange-500 hover:bg-orange-600">
                      {pendingCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-sm">Notificações</h3>
                  <p className="text-xs text-muted-foreground">
                    {pendingCount} aprovação(ões) pendente(s)
                  </p>
                </div>
                <ScrollArea className="h-80">
                  {pendingJustifications.length > 0 ? (
                    <div className="p-2">
                      {pendingJustifications.map((justification) => (
                        <button
                          key={justification.id}
                          onClick={() => navigate('/admin/aprovacoes')}
                          className="w-full p-3 rounded-lg hover:bg-slate-50 transition-colors text-left mb-1"
                        >
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {justification.profiles?.full_name || 'Usuário'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {getTypeLabel(justification.request_type)} - {justification.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTimeAgo(justification.created_at)}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      Nenhuma notificação pendente
                    </div>
                  )}
                </ScrollArea>
                {pendingCount > 0 && (
                  <div className="p-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate('/admin/aprovacoes')}
                    >
                      Ver todas as aprovações
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;