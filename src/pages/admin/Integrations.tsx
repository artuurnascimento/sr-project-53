import { useState } from 'react';
import { Plus, Settings, Trash2, Plug, PlugZap, AlertCircle, CheckCircle } from 'lucide-react';
import { Users, DollarSign, Lock, MessageCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/components/layout/AdminLayout';

const Integrations = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);

  // Mock data for integrations
  const integrations = [
    {
      id: 1,
      name: 'Sistema de RH',
      description: 'Integração com sistema de recursos humanos para sincronização de dados',
      type: 'hr_system',
      status: 'active',
      isEnabled: true,
      lastSync: '2025-01-20T10:30:00',
      config: {
        apiUrl: 'https://api.rh.empresa.com',
        apiKey: '***hidden***',
        syncInterval: '1h'
      }
    },
    {
      id: 2,
      name: 'Folha de Pagamento',
      description: 'Sincronização automática de horas trabalhadas para folha de pagamento',
      type: 'payroll',
      status: 'active',
      isEnabled: true,
      lastSync: '2025-01-20T09:00:00',
      config: {
        apiUrl: 'https://folha.empresa.com/api',
        apiKey: '***hidden***',
        syncInterval: '24h'
      }
    },
    {
      id: 3,
      name: 'Sistema de Acesso',
      description: 'Integração com catracas e controle de acesso físico',
      type: 'access_control',
      status: 'error',
      isEnabled: false,
      lastSync: '2025-01-19T15:20:00',
      config: {
        deviceIp: '192.168.1.100',
        port: '8080',
        protocol: 'TCP'
      }
    },
    {
      id: 4,
      name: 'Notificações WhatsApp',
      description: 'Envio de notificações automáticas via WhatsApp Business',
      type: 'whatsapp',
      status: 'inactive',
      isEnabled: false,
      lastSync: null,
      config: {
        phoneNumber: '+5581999999999',
        apiToken: '***hidden***'
      }
    }
  ];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    config: '{}',
    isEnabled: true,
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      'active': 'default',
      'inactive': 'secondary',
      'error': 'destructive'
    } as const;

    const labels = {
      'active': 'Ativo',
      'inactive': 'Inativo',
      'error': 'Erro'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hr_system':
        return <Users className="h-5 w-5" />;
      case 'payroll':
        return <DollarSign className="h-5 w-5" />;
      case 'access_control':
        return <Lock className="h-5 w-5" />;
      case 'whatsapp':
        return <MessageCircle className="h-5 w-5" />;
      default:
        return <Plug className="h-5 w-5" />;
    }
  };

  const getTypeName = (type: string) => {
    const names = {
      'hr_system': 'Sistema de RH',
      'payroll': 'Folha de Pagamento',
      'access_control': 'Controle de Acesso',
      'whatsapp': 'WhatsApp Business',
      'email': 'Email/SMTP',
      'webhook': 'Webhook'
    };
    return names[type as keyof typeof names] || type;
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement integration creation
    console.log('Create integration:', formData);
    setIsCreateDialogOpen(false);
  };

  const handleToggle = (id: number, enabled: boolean) => {
    // TODO: Implement integration toggle
    console.log('Toggle integration:', id, enabled);
  };

  const handleTest = (id: number) => {
    // TODO: Implement integration test
    console.log('Test integration:', id);
  };

  const handleSync = (id: number) => {
    // TODO: Implement manual sync
    console.log('Sync integration:', id);
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Nunca';
    return new Date(lastSync).toLocaleString('pt-BR');
  };

  return (
    <AdminLayout>
        <div className="space-y-4 md:space-y-6 p-4 md:p-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-3xl font-bold">Integrações</h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Configure integrações com sistemas externos
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Integração
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nova Integração</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hr_system">Sistema de RH</SelectItem>
                        <SelectItem value="payroll">Folha de Pagamento</SelectItem>
                        <SelectItem value="access_control">Controle de Acesso</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp Business</SelectItem>
                        <SelectItem value="email">Email/SMTP</SelectItem>
                        <SelectItem value="webhook">Webhook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Criar Integração
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
            {integrations.map((integration) => (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {integration.status === 'active' ? (
                          <PlugZap className="h-5 w-5 text-primary" />
                        ) : integration.status === 'error' ? (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        ) : (
                          <Plug className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {getTypeName(integration.type)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(integration.status)}
                      <Switch
                        checked={integration.isEnabled}
                        onCheckedChange={(checked) => handleToggle(integration.id, checked)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {integration.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Última sincronização:</span>
                      <span className="font-medium">
                        {formatLastSync(integration.lastSync)}
                      </span>
                    </div>
                    
                    {integration.status === 'error' && (
                      <div className="text-sm text-destructive">
                        Erro na última tentativa de conexão
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleTest(integration.id)}>
                      Testar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleSync(integration.id)}>
                      Sincronizar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Integration Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Modelos de Integração</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="hr" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="hr">RH</TabsTrigger>
                  <TabsTrigger value="payroll">Folha</TabsTrigger>
                  <TabsTrigger value="access">Acesso</TabsTrigger>
                  <TabsTrigger value="notifications">Notificações</TabsTrigger>
                </TabsList>

                <TabsContent value="hr" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <h4 className="font-medium">Senior Sistemas</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Integração com sistema Senior para sincronização de colaboradores
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Users className="h-5 w-5 text-green-600" />
                          </div>
                          <h4 className="font-medium">TOTVS Protheus</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Conecte com TOTVS para gestão integrada de RH
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="payroll" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <DollarSign className="h-5 w-5 text-purple-600" />
                          </div>
                          <h4 className="font-medium">Folha Automática</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Exportação automática de horas para sistema de folha
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="access" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <Lock className="h-5 w-5 text-orange-600" />
                          </div>
                          <h4 className="font-medium">Catracas Inteligentes</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Sincronização com catracas para registro automático
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <MessageCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <h4 className="font-medium">WhatsApp Business</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Notificações automáticas via WhatsApp
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Mail className="h-5 w-5 text-blue-600" />
                          </div>
                          <h4 className="font-medium">Email SMTP</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Envio de relatórios e alertas por email
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
    </AdminLayout>
  );
};

export default Integrations;