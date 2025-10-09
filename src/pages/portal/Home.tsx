import { useState, useEffect } from 'react';
import { Clock, MapPin, Wifi, WifiOff, User, CheckCircle, AlertCircle, Loader2, Shield, Camera, FileText, ExternalLink, FileImage, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import PortalLayout from '@/components/layout/PortalLayout';
import FacialRecognitionModal from '@/components/FacialRecognitionModal';
import LocationMap from '@/components/LocationMap';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateTimeEntry, useTodayTimeEntries, useWorkingHours } from '@/hooks/useTimeTracking';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { downloadComprovanteAsImage, downloadComprovanteAsPDF } from '@/utils/comprovanteExport';

interface WorkLocation {
  id: string;
  name: string;
  type: string;
  latitude?: number;
  longitude?: number;
  radius_meters?: number;
  is_active: boolean;
}

const PortalHome = () => {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isPunchingIn, setIsPunchingIn] = useState(false);
  const [showFacialModal, setShowFacialModal] = useState(false);
  const [pendingPunchType, setPendingPunchType] = useState<'IN' | 'OUT' | 'BREAK_IN' | 'BREAK_OUT' | null>(null);
  const [validatedWorkLocation, setValidatedWorkLocation] = useState<WorkLocation | null>(null);
  const [hasFacialRegistration, setHasFacialRegistration] = useState(false);
  const [checkingFacialRegistration, setCheckingFacialRegistration] = useState(true);
  const [showComprovanteModal, setShowComprovanteModal] = useState(false);
  const [currentComprovanteId, setCurrentComprovanteId] = useState<string | null>(null);

  const createTimeEntry = useCreateTimeEntry();
  const { data: todayEntries, refetch: refetchToday } = useTodayTimeEntries(profile?.id);
  const { data: workingHours } = useWorkingHours(profile?.id, new Date().toISOString().split('T')[0]);

  // Verificar se o usuário tem cadastro facial
  useEffect(() => {
    const checkFacialRegistration = async () => {
      if (!profile?.id) {
        setCheckingFacialRegistration(false);
        return;
      }

      try {
        // Verificar se tem face_embedding ou facial_reference_url
        const { data, error } = await supabase
          .from('profiles')
          .select('face_embedding, facial_reference_url')
          .eq('id', profile.id)
          .single();

        if (error) throw error;

        const hasRegistration = !!(data?.face_embedding || data?.facial_reference_url);
        setHasFacialRegistration(hasRegistration);
        
        console.log('✅ Facial registration check:', {
          hasEmbedding: !!data?.face_embedding,
          hasReferenceUrl: !!data?.facial_reference_url,
          hasRegistration
        });
      } catch (error) {
        console.error('Error checking facial registration:', error);
        setHasFacialRegistration(false);
      } finally {
        setCheckingFacialRegistration(false);
      }
    };

    checkFacialRegistration();

    // Recarregar quando voltar para a página
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkFacialRegistration();
        refetchToday();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [profile?.id, refetchToday]);

  // Fetch geofencing config
  const { data: geofencingConfig } = useQuery({
    queryKey: ['geofencing_config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', 'geofencing')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return (data?.value as { enabled: boolean; default_radius: number }) || { enabled: false, default_radius: 100 };
    },
  });

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
      return data as WorkLocation[];
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

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Validate if user is within allowed location
  const validateLocation = (userLat: number, userLng: number): WorkLocation | null => {
    if (!geofencingConfig?.enabled || !workLocations) {
      return null; // Geofencing disabled, allow from anywhere
    }

    for (const workLoc of workLocations) {
      if (!workLoc.latitude || !workLoc.longitude) continue;
      
      const distance = calculateDistance(
        userLat,
        userLng,
        workLoc.latitude,
        workLoc.longitude
      );

      const allowedRadius = workLoc.radius_meters || 100;
      
      if (distance <= allowedRadius) {
        return workLoc;
      }
    }

    return null;
  };

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

        // Validate location if geofencing is enabled
        if (geofencingConfig?.enabled) {
          const validLocation = validateLocation(coords.lat, coords.lng);
          
          if (!validLocation) {
            setLocationError('Você não está em uma localização permitida para bater ponto');
            setLocation(null);
            setValidatedWorkLocation(null);
            setIsGettingLocation(false);
            return;
          }
          
          setValidatedWorkLocation(validLocation);
        }

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
  }, [geofencingConfig, workLocations]);

  // Buscar horário de trabalho configurado
  const { data: workSchedule } = useQuery({
    queryKey: ['work-schedule', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      const { data, error } = await supabase
        .from('work_schedules')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Verificar quais tipos de batimento já foram feitos hoje (exceto entrada)
  const getPunchTypesUsedToday = () => {
    if (!todayEntries) return new Set<string>();
    
    const usedTypes = new Set<string>();
    const now = new Date();
    
    todayEntries.forEach(entry => {
      const entryDate = new Date(entry.punch_time);
      
      // Para entrada (IN), verificar se já bateu HOJE dentro do horário configurado
      if (entry.punch_type === 'IN' && workSchedule) {
        const [schedHour, schedMin] = workSchedule.clock_in_time.split(':').map(Number);
        const scheduledTime = new Date(now);
        scheduledTime.setHours(schedHour, schedMin, 0, 0);
        
        // Se já bateu entrada hoje no horário configurado, marcar como usado
        if (entryDate.toDateString() === now.toDateString() &&
            entryDate >= new Date(scheduledTime.getTime() - workSchedule.tolerance_minutes * 60000)) {
          usedTypes.add('IN');
        }
      } else {
        // Outros tipos seguem a regra normal (uma vez por dia)
        usedTypes.add(entry.punch_type);
      }
    });
    
    return usedTypes;
  };

  const usedPunchTypes = getPunchTypesUsedToday();

  const handlePunchClick = (type: 'IN' | 'OUT' | 'BREAK_IN' | 'BREAK_OUT') => {
    if (!location || !isOnline) {
      toast.error('Verifique sua localização e conexão');
      return;
    }

    // Verificar geofencing se ativado
    if (geofencingConfig?.enabled && !validatedWorkLocation) {
      toast.error('Você não está em uma localização permitida para bater ponto');
      return;
    }

    // Verificar se tem face cadastrada - OBRIGATÓRIO
    if (!hasFacialRegistration) {
      toast.error('Cadastro facial obrigatório! Registre sua face antes de bater o ponto.');
      return;
    }

    // Verificar se já bateu este tipo de ponto hoje
    if (usedPunchTypes.has(type)) {
      const typeNames = {
        'IN': 'Entrada',
        'OUT': 'Saída',
        'BREAK_IN': 'Início do Intervalo',
        'BREAK_OUT': 'Fim do Intervalo'
      };
      toast.error(`Você já registrou ${typeNames[type]} hoje`);
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
    if (!profile || !location || isPunchingIn || createTimeEntry.isPending) return;

    setIsPunchingIn(true);
    
    try {
      const entry = {
        employee_id: profile.id,
        punch_type: type,
        punch_time: new Date().toISOString(),
        location_lat: location.lat,
        location_lng: location.lng,
        location_address: location.address || 'Localização registrada',
        work_location_id: validatedWorkLocation?.id || null,
      };

      const result = await createTimeEntry.mutateAsync(entry);

      // Chamar edge function para gerar comprovante
      if (result?.id) {
        try {
          await supabase.functions.invoke('gerar-comprovante-ponto', {
            body: { timeEntryId: result.id }
          });

          setCurrentComprovanteId(result.id);
          setShowComprovanteModal(true);
        } catch (err) {
          console.error('Erro ao gerar comprovante:', err);
          toast.error('Ponto registrado, mas houve erro ao gerar o comprovante');
        }
      }

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

      // Fallback: if no audit was created, create a minimal audit record
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
      
      // Recarregar registros de hoje
      await refetchToday();
      
      const punchNames = {
        'IN': 'Entrada',
        'OUT': 'Saída',
        'BREAK_IN': 'Início do Intervalo',
        'BREAK_OUT': 'Fim do Intervalo'
      };
      
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

  const canPunch = (type: string) => {
    // Bloquear se não tem face cadastrada
    if (!hasFacialRegistration) return false;
    if (!location || !isOnline || isPunchingIn || createTimeEntry.isPending) return false;
    
    // Validar geofencing se ativado
    if (geofencingConfig?.enabled && !validatedWorkLocation) return false;
    
    // Verificar se já bateu este tipo de ponto hoje
    if (usedPunchTypes.has(type)) return false;
    
    return true;
  };

  const getPunchButtonText = (type: string) => {
    if (usedPunchTypes.has(type)) {
      return '✓ Registrado';
    }
    
    const names = {
      'IN': 'Entrada',
      'OUT': 'Saída',
      'BREAK_IN': 'Início Intervalo',
      'BREAK_OUT': 'Fim Intervalo'
    };
    
    return names[type as keyof typeof names] || type;
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

        {/* Geofencing Status */}
        {geofencingConfig?.enabled && (
          <Alert className={validatedWorkLocation ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
            <Shield className={`h-5 w-5 ${validatedWorkLocation ? 'text-green-600' : 'text-orange-600'}`} />
            <AlertDescription>
              {validatedWorkLocation ? (
                <div className="text-green-800">
                  <p className="font-semibold">✓ Localização Validada</p>
                  <p className="text-sm mt-1">
                    Você está em: <strong>{validatedWorkLocation.name}</strong>
                  </p>
                </div>
              ) : (
                <div className="text-orange-800">
                  <p className="font-semibold">⚠ Fora da Área Permitida</p>
                  <p className="text-sm mt-1">
                    Você precisa estar em uma localização autorizada para bater ponto
                  </p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

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
              Localização GPS confirmada
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

        {/* Facial Registration Status - APENAS SE NÃO TIVER CADASTRO */}
        {checkingFacialRegistration ? (
          <Alert className="bg-blue-50 border-blue-200">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <AlertDescription className="text-blue-800">
              Verificando cadastro facial...
            </AlertDescription>
          </Alert>
        ) : !hasFacialRegistration && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">⚠️ Cadastro facial obrigatório</p>
                <p className="text-xs text-red-700 mt-1">Você precisa cadastrar sua face antes de registrar ponto</p>
              </div>
              <Button 
                onClick={() => navigate('/portal/cadastro-facial')}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Camera className="h-4 w-4 mr-2" />
                Cadastrar Agora
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Punch Buttons - Large & Clean */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            size="lg" 
            className={`h-32 flex flex-col gap-3 text-lg font-semibold ${
              usedPunchTypes.has('IN') 
                ? 'bg-green-200 text-green-800 hover:bg-green-200 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
            onClick={() => handlePunchClick('IN')}
            disabled={!canPunch('IN')}
          >
            {isPunchingIn && pendingPunchType === 'IN' ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : usedPunchTypes.has('IN') ? (
              <CheckCircle className="h-8 w-8" />
            ) : (
              <Clock className="h-8 w-8" />
            )}
            {getPunchButtonText('IN')}
          </Button>

          <Button 
            size="lg" 
            className={`h-32 flex flex-col gap-3 text-lg font-semibold ${
              usedPunchTypes.has('OUT') 
                ? 'bg-red-200 text-red-800 hover:bg-red-200 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
            onClick={() => handlePunchClick('OUT')}
            disabled={!canPunch('OUT')}
          >
            {isPunchingIn && pendingPunchType === 'OUT' ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : usedPunchTypes.has('OUT') ? (
              <CheckCircle className="h-8 w-8" />
            ) : (
              <Clock className="h-8 w-8" />
            )}
            {getPunchButtonText('OUT')}
          </Button>

          <Button 
            size="lg" 
            className={`h-32 flex flex-col gap-3 text-lg font-semibold ${
              usedPunchTypes.has('BREAK_IN') 
                ? 'bg-orange-200 text-orange-800 hover:bg-orange-200 cursor-not-allowed' 
                : 'bg-orange-600 hover:bg-orange-700'
            }`}
            onClick={() => handlePunchClick('BREAK_IN')}
            disabled={!canPunch('BREAK_IN')}
          >
            {isPunchingIn && pendingPunchType === 'BREAK_IN' ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : usedPunchTypes.has('BREAK_IN') ? (
              <CheckCircle className="h-8 w-8" />
            ) : (
              <Clock className="h-8 w-8" />
            )}
            {getPunchButtonText('BREAK_IN')}
          </Button>

          <Button 
            size="lg" 
            className={`h-32 flex flex-col gap-3 text-lg font-semibold ${
              usedPunchTypes.has('BREAK_OUT') 
                ? 'bg-blue-200 text-blue-800 hover:bg-blue-200 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            onClick={() => handlePunchClick('BREAK_OUT')}
            disabled={!canPunch('BREAK_OUT')}
          >
            {isPunchingIn && pendingPunchType === 'BREAK_OUT' ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : usedPunchTypes.has('BREAK_OUT') ? (
              <CheckCircle className="h-8 w-8" />
            ) : (
              <Clock className="h-8 w-8" />
            )}
            {getPunchButtonText('BREAK_OUT')}
          </Button>
        </div>

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

        {/* Comprovante Modal */}
        <Dialog open={showComprovanteModal} onOpenChange={setShowComprovanteModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Ponto Registrado com Sucesso!
              </DialogTitle>
              <DialogDescription>
                Seu comprovante de ponto foi gerado e está disponível para visualização.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Alert className="border-green-200 bg-green-50">
                <FileText className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <p className="font-semibold mb-1">Comprovante Disponível</p>
                  <p className="text-sm">
                    Acesse seu comprovante agora ou visualize-o posteriormente no histórico.
                  </p>
                </AlertDescription>
              </Alert>

              {currentComprovanteId && (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${window.location.origin}/comprovante?id=${currentComprovanteId}`)}`}
                    alt="QR Code do Comprovante de Ponto"
                    loading="lazy"
                    className="rounded-md border"
                  />
                  <span className="text-xs text-muted-foreground">Escaneie para validar no celular</span>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    if (currentComprovanteId) {
                      window.open(`/comprovante?id=${currentComprovanteId}`, '_blank');
                    }
                  }}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Comprovante Agora
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Para baixar como PDF ou Imagem, abra o comprovante e use os botões de download
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowComprovanteModal(false);
                    setCurrentComprovanteId(null);
                  }}
                  className="w-full"
                >
                  Fechar
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Você pode acessar todos os seus comprovantes na página de Histórico
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PortalLayout>
  );
};

export default PortalHome;