import { useState, useEffect } from 'react';
import { Clock, MapPin, Wifi, WifiOff, User, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PortalLayout from '@/components/layout/PortalLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateTimeEntry, useTodayTimeEntries, useWorkingHours } from '@/hooks/useTimeTracking';

const PortalHome = () => {
  const { profile } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const createTimeEntry = useCreateTimeEntry();
  const { data: todayEntries, refetch: refetchToday } = useTodayTimeEntries(profile?.id);
  const { data: workingHours } = useWorkingHours(profile?.id, new Date().toISOString().split('T')[0]);

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

  const handlePunch = async (type: 'IN' | 'OUT' | 'BREAK_IN' | 'BREAK_OUT') => {
    if (!profile || !location) return;

    const entry = {
      employee_id: profile.id,
      punch_type: type,
      punch_time: new Date().toISOString(),
      location_lat: location.lat,
      location_lng: location.lng,
      location_address: location.address || 'Localização registrada',
    };

    await createTimeEntry.mutateAsync(entry);
    refetchToday();
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
    if (!location || !isOnline) return false;
    const expected = getNextExpectedPunch();
    return type === expected;
  };

  return (
    <PortalLayout>
          <div className="max-w-md mx-auto space-y-6">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Portal do Colaborador</h1>
              <p className="text-slate-700">Registre seu ponto e acompanhe suas atividades</p>
            </div>
          {/* Status Connection */}
          <div className="flex items-center justify-between">
            <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-2">
              {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {profile?.full_name || 'Usuário'}
            </Badge>
          </div>

          {/* Clock */}
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                {formatDate(currentTime)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-mono font-bold text-primary mb-4">
                {formatTime(currentTime)}
              </div>
              <Badge variant={isWorkingTime() ? "default" : "secondary"} className="text-sm">
                {isWorkingTime() ? 'Horário de Trabalho' : 'Fora do Horário'}
              </Badge>
            </CardContent>
          </Card>

          {/* Location Status */}
          {locationError ? (
            <Alert variant="destructive">
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                {locationError}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={getLocation}
                  disabled={isGettingLocation}
                >
                  {isGettingLocation ? 'Obtendo...' : 'Tentar Novamente'}
                </Button>
              </AlertDescription>
            </Alert>
          ) : location ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Localização confirmada - Você pode bater ponto
                {location.address && (
                  <div className="text-xs mt-1 opacity-75">{location.address}</div>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {isGettingLocation ? 'Obtendo sua localização...' : 'Localização necessária para bater ponto'}
              </AlertDescription>
            </Alert>
          )}

          {/* Punch Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              size="lg" 
              className="h-20 flex flex-col gap-2"
              onClick={() => handlePunch('IN')}
              disabled={!canPunch('IN') || createTimeEntry.isPending}
              variant={canPunch('IN') ? 'default' : 'outline'}
            >
              <Clock className="h-6 w-6" />
              Entrada
            </Button>
            <Button 
              size="lg" 
              className="h-20 flex flex-col gap-2"
              onClick={() => handlePunch('OUT')}
              disabled={!canPunch('OUT') || createTimeEntry.isPending}
              variant={canPunch('OUT') ? 'default' : 'outline'}
            >
              <Clock className="h-6 w-6" />
              Saída
            </Button>
            <Button 
              size="lg" 
              className="h-20 flex flex-col gap-2"
              onClick={() => handlePunch('BREAK_IN')}
              disabled={!canPunch('BREAK_IN') || createTimeEntry.isPending}
              variant={canPunch('BREAK_IN') ? 'secondary' : 'outline'}
            >
              <Clock className="h-6 w-6" />
              Início Intervalo
            </Button>
            <Button 
              size="lg" 
              className="h-20 flex flex-col gap-2"
              onClick={() => handlePunch('BREAK_OUT')}
              disabled={!canPunch('BREAK_OUT') || createTimeEntry.isPending}
              variant={canPunch('BREAK_OUT') ? 'secondary' : 'outline'}
            >
              <Clock className="h-6 w-6" />
              Fim Intervalo
            </Button>
          </div>

          {/* Next Expected Action */}
          {location && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-blue-800">
                  Próxima ação esperada: <strong>{getNextExpectedPunch() === 'IN' ? 'Entrada' : 
                    getNextExpectedPunch() === 'OUT' ? 'Saída' :
                    getNextExpectedPunch() === 'BREAK_IN' ? 'Início do Intervalo' : 'Fim do Intervalo'}</strong>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Today Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo do Dia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayEntries && todayEntries.length > 0 ? (
                <>
                  {todayEntries.slice().reverse().map((entry, index) => (
                    <div key={entry.id} className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        {entry.punch_type === 'IN' ? 'Entrada' :
                         entry.punch_type === 'OUT' ? 'Saída' :
                         entry.punch_type === 'BREAK_IN' ? 'Início Intervalo' : 'Fim Intervalo'}:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {new Date(entry.punch_time).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {entry.status === 'approved' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : entry.status === 'pending' ? (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Horas trabalhadas:</span>
                      <span className="font-medium text-primary">
                        {workingHours?.totalHours || '0h 0m'}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center">
                  Nenhum registro de ponto hoje
                </p>
              )}
            </CardContent>
          </Card>
        </div>
    </PortalLayout>
  );
};

export default PortalHome;