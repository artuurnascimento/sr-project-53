import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DynamicMapProps {
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  height?: string;
  zoom?: number;
}

const DynamicMapComponent: React.FC<DynamicMapProps> = ({ 
  location, 
  height = '200px', 
  zoom = 15 
}) => {
  return (
    <MapContainer
      center={[location.lat, location.lng]}
      zoom={zoom}
      style={{ height, width: '100%' }}
      className="z-0"
    >
      {
        // @ts-ignore react-leaflet Consumer may expect a render function in this build
        (() => (
          <>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[location.lat, location.lng]}>
              <Popup>
                <div className="text-center">
                  <div className="font-medium text-sm">Sua localização</div>
                  {location.address && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {location.address}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )) as any
      }
    </MapContainer>
  );
};

export default DynamicMapComponent;