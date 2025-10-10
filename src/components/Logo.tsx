import React, { useEffect, useState } from 'react';
import { loadLogo, LogoConfig } from '@/services/logoService';

interface LogoProps {
  location?: string;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({
  location = 'header',
  className = '',
  style = {},
  alt = 'Logo',
  onClick,
}) => {
  const [logoConfig, setLogoConfig] = useState<LogoConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogo = async () => {
      const config = await loadLogo(location);
      setLogoConfig(config);
      setLoading(false);
    };

    fetchLogo();

    const handleLogosUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (!customEvent.detail || customEvent.detail.location === location || !customEvent.detail.location) {
        fetchLogo();
      }
    };

    window.addEventListener('logos-updated', handleLogosUpdated);

    return () => {
      window.removeEventListener('logos-updated', handleLogosUpdated);
    };
  }, [location]);

  if (loading || !logoConfig) {
    return (
      <div
        className={`logo-container logo-${location} ${className}`}
        style={style}
      >
        <div className="w-8 h-8 bg-gray-200 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div
      className={`logo-container logo-${location} ${className} inline-flex items-center justify-center`}
      style={{
        backgroundColor: logoConfig.backgroundColor,
        ...style
      }}
      onClick={onClick}
    >
      <img
        src={logoConfig.url}
        alt={alt}
        className="logo-image block max-w-full max-h-full object-contain"
        style={{
          width: logoConfig.width,
          height: logoConfig.height,
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = '/logo-sirius.png';
        }}
      />
    </div>
  );
};

export default Logo;
