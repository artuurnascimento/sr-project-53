import React from 'react';

interface LocationMapProps {
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  height?: string;
  zoom?: number; // kept for API compatibility, not used by OSM embed directly
}

const LocationMap: React.FC<LocationMapProps> = ({ location, height = '200px' }) => {
  const { lat, lng, address } = location;

  // Simple bbox around the point for OSM embed
  const delta = 0.01; // ~1km box depending on latitude
  const south = lat - delta;
  const west = lng - delta;
  const north = lat + delta;
  const east = lng + delta;

  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${west}%2C${south}%2C${east}%2C${north}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <iframe
        title={address ? `Mapa - ${address}` : `Mapa - ${lat.toFixed(6)}, ${lng.toFixed(6)}`}
        src={src}
        style={{ border: 0, width: '100%', height }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        aria-label="Mapa de localização"
      />
      <div className="p-2 text-xs text-muted-foreground bg-muted/30">
        {address ? (
          <span>{address} • </span>
        ) : null}
        <a
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Ver no OpenStreetMap
        </a>
      </div>
    </div>
  );
};

export default LocationMap;
