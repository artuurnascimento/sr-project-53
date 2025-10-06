import { useState, useEffect } from 'react';
import { Clock, MapPin, Wifi, WifiOff, User, CheckCircle, AlertCircle, Loader2, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import PortalLayout from '@/components/layout/PortalLayout';
import FacialRecognitionModal from '@/components/FacialRecognitionModal';
import LocationMap from '@/components/LocationMap';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateTimeEntry, useTodayTimeEntries, useWorkingHours } from '@/hooks/useTimeTracking';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

const PortalHome = () => {
  const { profile } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isPunchingIn, setIsPunchingIn] = useState(false);
  const [usedPunchTypes, setUsedPunchTypes] = useState<Set<string>>(new Set());
  const [showFacialModal, setShowFacialModal] = useState(false);
  const [pendingPunchType, setPendingPunchType] = useState<'IN' | 'OUT' | 'BREAK_IN' | 'BREAK_OUT' | null>(null);
  const [selectedWorkLocation, setSelectedWorkLocation] = useState<string>('');

  const createTimeEntry = useCreateTimeEntry();
  const { data: todayEntries, refetch: refetchToday } = useTodayTimeEntries(profile?.id);
  const { data: workingHours } = useWorkingHours(profile?.id, new Date().toISOString().split('T')[0]);

  // Fetch work locations
  const { data: workLocations } = useQuery({
    queryKey: ['work_locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('work_locations')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não suportada pelo navegador');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        try {
          // Try to get address from coordinates (optional)
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${coords.lat}+${coords.lng}&key=YOUR_API_KEY`
          ).catch(() => null);

          let address = 'Localização obtida';
          if (response?.ok) {
            const data = await response.json();
            address = data.results?.[0]?.formatted || 'Localização obtida';
          }

          setLocation({ ...coords, address });
          setLocationError(null);
        } catch (error) {
          setLocation(coords);
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        setLocationError('Não foi possível obter sua localização. Verifique as permissões.');
        setIsGettingLocation(false);
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  const handlePunchClick = (type: 'IN' | 'OUT' | 'BREAK_IN' | 'BREAK_OUT') => {
    if (!location || !isOnline) {
      toast.error('Verifique sua localização e conexão');
      return;
    }

    if (!selectedWorkLocation) {
      toast.error('Selecione uma localização de trabalho');
      return;
    }

    // Verificar se tem face cadastrada - OBRIGATÓRIO
    if (!profile?.face_embedding && !profile?.facial_reference_url) {
      toast.error('Cadastro facial obrigatório! Registre sua face antes de bater o ponto.');
      return;
    }

    setPendingPunchType(type);
    setShowFacialModal(true);
  };

  const handleFacialSuccess = async (userId: string, userName: string, confidence: number, auditId?: string) => {
    if (pendingPunchType) {
      await handlePunch(pendingPunchType, auditId);
      setPendingPunchType(null);
    }
    setShowFacialModal(false);
  };

  const handlePunch = async (type: 'IN' | 'OUT' | 'BREAK_IN' | 'BREAK_OUT', auditId?: string) => {
    if (!profile || !location || isPunchingIn || createTimeEntry.isPending || !selectedWorkLocation) return;

    setIsPunchingIn(true);
    
    try {
      const entry = {
        employee_id: profile.id,
        punch_type: type,
        punch_time: new Date().toISOString(),
        location_lat: location.lat,
        location_lng: location.lng,
        location_address: location.address || 'Localização registrada',
        work_location_id: selectedWorkLocation,
      };

      const result = await createTimeEntry.mutateAsync(entry);
      
      // If we have an audit ID, link it to the time entry using secure function
      if (auditId && result?.id) {
        const { error: linkError } = await supabase.rpc('link_audit_to_time_entry', {
          _audit_id: auditId,
          _time_entry_id: result.id
        });
        
        if (linkError) {
          console.error('Error linking audit to time entry:', linkError);
        }
      }

      // Fallback: if no audit was created (e.g., camera/recognition path failed), create a minimal audit record
      if (!auditId && result?.id && profile?.id) {
        const { error: fallbackErr } = await supabase
          .from('facial_recognition_audit')
          .insert({
            profile_id: profile.id,
            attempt_image_url: `placeholder://time-entry/${result.id}`,
            recognition_result: {
              success: true,
              source: 'fallback_from_time_entry',
              punch_type: type
            },
            confidence_score: null,
            liveness_passed: false,
            status: 'approved',
            time_entry_id: result.id,
          });
        if (fallbackErr) {
          console.error('Fallback audit creation error:', fallbackErr);
        }
      }
      
      refetchToday();
      
      const punchNames = {
        'IN': 'Entrada',
        'OUT': 'Saída',
        'BREAK_IN': 'Início do Intervalo',
        'BREAK_OUT': 'Fim do Intervalo'
      };
      
      // Mark this punch type as used
      setUsedPunchTypes(prev => new Set(prev).add(type));
      
      toast.success(`${punchNames[type]} registrada com sucesso!`);
    } catch (error) {
      toast.error('Erro ao registrar ponto. Tente novamente.');
    } finally {
      setIsPunchingIn(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getLastPunchType = () => {
    if (!todayEntries || todayEntries.length === 0) return null;
    return todayEntries[0].punch_type;
  };

  const getNextExpectedPunch = () => {
    const lastPunch = getLastPunchType();
    if (!lastPunch) return 'IN';
    
    switch (lastPunch) {
      case 'IN': return 'BREAK_IN';
      case 'BREAK_IN': return 'BREAK_OUT';
      case 'BREAK_OUT': return 'OUT';
      case 'OUT': return 'IN';
      default: return 'IN';
    }
  };

  const isWorkingTime = () => {
    const hour = currentTime.getHours();
    return hour >= 8 && hour < 17;
  };

  const canPunch = (type: string) => {
    // Bloquear se não tem face cadastrada
    if (!profile?.face_embedding && !profile?.facial_reference_url) return false;
    if (!location || !isOnline || isPunchingIn || createTimeEntry.isPending) return false;
    if (!selectedWorkLocation) return false;
    // Check if this punch type was already used
    if (usedPunchTypes.has(type)) return false;
    return true;
  };

  return (
    <PortalLayout>
      <div className="max-w-2xl mx-auto space-y-4 md:space-y-6 p-4">
        {/* Header - Minimal */}
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Registro de Ponto</h1>
          <p className="text-sm md:text-base text-slate-600 mt-1">Registre sua jornada de trabalho</p>
        </div>
        
        {/* Status Bar */}
        <div className="flex items-center justify-between text-sm">
          <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-2">
            {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {profile?.full_name?.split(' ').slice(0, 2).join(' ') || 'Usuário'}
          </Badge>
        </div>

        {/* Clock Card - Clean & Minimal */}
        <Card className="text-center bg-white shadow-sm">
          <CardContent className="pt-6 pb-6">
            <div className="text-5xl font-mono font-bold text-slate-900 mb-2">
              {formatTime(currentTime)}
            </div>
            <p className="text-sm text-slate-500">{formatDate(currentTime)}</p>
          </CardContent>
        </Card>

        {/* Work Location Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5" />
              Localização de Trabalho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="work-location">Selecione onde você está trabalhando</Label>
              <Select value={selectedWorkLocation} onValueChange={setSelectedWorkLocation}>
                <SelectTrigger id="work-location">
                  <SelectValue placeholder="Escolha uma localização" />
                </SelectTrigger>
                <SelectContent>
                  {workLocations?.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedWorkLocation && (
                <p className="text-xs text-muted-foreground">
                  Você precisa selecionar uma localização antes de bater ponto
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location Status - Compact */}
        {locationError ? (
          <Alert variant="destructive" className="text-sm">
            <MapPin className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{locationError}</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={getLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? 'Obtendo...' : 'Tentar'}
              </Button>
            </AlertDescription>
          </Alert>
        ) : location ? (
          <Alert className="text-sm border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Localização confirmada
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="text-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isGettingLocation ? 'Obtendo localização...' : 'Localização necessária'}
            </AlertDescription>
          </Alert>
        )}

        {/* Punch Buttons - Large & Clean */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            size="lg" 
            className="h-32 flex flex-col gap-3 text-lg font-semibold bg-green-600 hover:bg-green-700"
            onClick={() => handlePunchClick('IN')}
            disabled={!canPunch('IN')}
          >
            {isPunchingIn && pendingPunchType === 'IN' ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <Clock className="h-8 w-8" />
            )}
            Entrada
          </Button>

          <Button 
            size="lg" 
            className="h-32 flex flex-col gap-3 text-lg font-semibold bg-red-600 hover:bg-red-700"
            onClick={() => handlePunchClick('OUT')}
            disabled={!canPunch('OUT')}
          >
            {isPunchingIn && pendingPunchType === 'OUT' ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <Clock className="h-8 w-8" />
            )}
            Saída
          </Button>

          <Button 
            size="lg" 
            className="h-32 flex flex-col gap-3 text-lg font-semibold bg-orange-600 hover:bg-orange-700"
            onClick={() => handlePunchClick('BREAK_IN')}
            disabled={!canPunch('BREAK_IN')}
          >
            {isPunchingIn && pendingPunchType === 'BREAK_IN' ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <Clock className="h-8 w-8" />
            )}
            Início Intervalo
          </Button>

          <Button 
            size="lg" 
            className="h-32 flex flex-col gap-3 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
            onClick={() => handlePunchClick('BREAK_OUT')}
            disabled={!canPunch('BREAK_OUT')}
          >
            {isPunchingIn && pendingPunchType === 'BREAK_OUT' ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <Clock className="h-8 w-8" />
            )}
            Fim Intervalo
          </Button>
        </div>

        {/* Facial Recognition Setup Banner - OBRIGATÓRIO */}
        {!profile?.face_embedding && !profile?.facial_reference_url && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">⚠️ Cadastro facial obrigatório</p>
                <p className="text-xs text-red-700 mt-1">Você precisa cadastrar sua face antes de registrar ponto</p>
              </div>
              <Button 
                onClick={() => window.location.href = '/portal/cadastro-facial'}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Cadastrar Agora
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Today Summary - Compact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumo do Dia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayEntries && todayEntries.length > 0 ? (
              <>
                {todayEntries.slice().reverse().map((entry) => (
                  <div key={entry.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {entry.punch_type === 'IN' ? 'Entrada' :
                         entry.punch_type === 'OUT' ? 'Saída' :
                         entry.punch_type === 'BREAK_IN' ? 'Início' : 'Fim'}
                      </Badge>
                      <span className="font-medium text-sm">
                        {new Date(entry.punch_time).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {entry.status === 'approved' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                ))}
                <div className="pt-3 mt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-700">Total Trabalhado:</span>
                    <span className="text-xl font-bold text-slate-900">
                      {workingHours?.totalHours || '00:00'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum registro hoje
              </p>
            )}
          </CardContent>
        </Card>

        {/* Facial Recognition Modal */}
        <FacialRecognitionModal 
          isOpen={showFacialModal}
          onClose={() => {
            setShowFacialModal(false);
            setPendingPunchType(null);
          }}
          onSuccess={handleFacialSuccess}
          expectedUserId={profile?.id}
        />
      </div>
    </PortalLayout>
  );
};

export default PortalHome;