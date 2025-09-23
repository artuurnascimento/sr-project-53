import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

// Dynamic import to avoid SSR issues and context problems
const DynamicMap = React.lazy(() => import('./DynamicMapComponent'));

interface LocationMapProps {
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  height?: string;
  zoom?: number;
}

const LocationMap: React.FC<LocationMapProps> = ({ 
  location, 
  height = '200px', 
  zoom = 15 
}) => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div 
        className="rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center"
        style={{ height, width: '100%' }}
      >
        <div className="text-center text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-2" />
          <div className="text-sm">Carregando mapa...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <React.Suspense 
        fallback={
          <div 
            className="bg-muted flex items-center justify-center"
            style={{ height, width: '100%' }}
          >
            <div className="text-center text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2" />
              <div className="text-sm">Carregando mapa...</div>
            </div>
          </div>
        }
      >
        <DynamicMap location={location} height={height} zoom={zoom} />
      </React.Suspense>
    </div>
  );
};

export default LocationMap;