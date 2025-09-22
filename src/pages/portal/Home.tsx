import { useState, useEffect } from 'react';
import { Clock, MapPin, Wifi, WifiOff, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PortalLayout from '@/components/layout/PortalLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const PortalHome = () => {
  const { profile } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

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

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationError(null);
        },
        (error) => {
          setLocationError('Não foi possível obter sua localização');
          console.error('Geolocation error:', error);
        }
      );
    }
  }, []);

  const handlePunch = (type: 'IN' | 'OUT' | 'BREAK_IN' | 'BREAK_OUT') => {
    // TODO: Implementar lógica de batida de ponto
    console.log('Punch:', type, location);
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

  return (
    <ProtectedRoute>
      <PortalLayout>
        <div className="max-w-md mx-auto space-y-6">
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
              <Badge variant="secondary" className="text-sm">
                Turno: 08:00 - 17:00
              </Badge>
            </CardContent>
          </Card>

          {/* Location Status */}
          {locationError ? (
            <Alert variant="destructive">
              <MapPin className="h-4 w-4" />
              <AlertDescription>{locationError}</AlertDescription>
            </Alert>
          ) : location ? (
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                Você está dentro da área permitida para bater ponto
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                Obtendo sua localização...
              </AlertDescription>
            </Alert>
          )}

          {/* Punch Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button 
              size="lg" 
              className="h-20 flex flex-col gap-2"
              onClick={() => handlePunch('IN')}
              disabled={!location}
            >
              <Clock className="h-6 w-6" />
              Entrada
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-20 flex flex-col gap-2"
              onClick={() => handlePunch('OUT')}
              disabled={!location}
            >
              <Clock className="h-6 w-6" />
              Saída
            </Button>
            <Button 
              size="lg" 
              variant="secondary" 
              className="h-20 flex flex-col gap-2"
              onClick={() => handlePunch('BREAK_IN')}
              disabled={!location}
            >
              <Clock className="h-6 w-6" />
              Início Intervalo
            </Button>
            <Button 
              size="lg" 
              variant="secondary" 
              className="h-20 flex flex-col gap-2"
              onClick={() => handlePunch('BREAK_OUT')}
              disabled={!location}
            >
              <Clock className="h-6 w-6" />
              Fim Intervalo
            </Button>
          </div>

          {/* Today Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo do Dia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entrada:</span>
                <span className="font-medium">08:15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saída para almoço:</span>
                <span className="font-medium">12:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Volta do almoço:</span>
                <span className="font-medium">13:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Horas trabalhadas:</span>
                <span className="font-medium text-primary">7h 45m</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </PortalLayout>
    </ProtectedRoute>
  );
};

export default PortalHome;