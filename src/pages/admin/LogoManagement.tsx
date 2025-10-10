import React, { useState, useEffect } from 'react';
import { RotateCcw, Edit2, Trash2 } from 'lucide-react';
import { loadLogos, logoLocations, removeLogo, resetAllLogos, LogoConfig } from '@/services/logoService';
import Logo from '@/components/Logo';
import LogoUploadModal from '@/components/LogoUploadModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const LogoManagement = () => {
  const [logos, setLogos] = useState<Record<string, LogoConfig>>({});
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentLogos();
  }, []);

  const loadCurrentLogos = async () => {
    setLoading(true);
    const currentLogos = await loadLogos();
    const logosMap = currentLogos.reduce((acc, logo) => {
      acc[logo.location] = logo;
      return acc;
    }, {} as Record<string, LogoConfig>);
    setLogos(logosMap);
    setLoading(false);
  };

  const handleOpenUpload = (location: string) => {
    setSelectedLocation(location);
    setShowUploadModal(true);
  };

  const handleCloseUpload = () => {
    setSelectedLocation(null);
    setShowUploadModal(false);
  };

  const handleLogoSaved = () => {
    loadCurrentLogos();
    setShowUploadModal(false);
    toast.success('Logo atualizada com sucesso!');
  };

  const handleRemoveLogo = async (location: string) => {
    const confirmed = window.confirm(
      `Deseja remover a logo personalizada de "${logoLocations[location].label}"?`
    );

    if (confirmed) {
      const success = await removeLogo(location);
      if (success) {
        loadCurrentLogos();
        toast.success('Logo removida. Padrão restaurado.');
      } else {
        toast.error('Erro ao remover logo.');
      }
    }
  };

  const handleResetAll = async () => {
    const confirmed = window.confirm(
      '⚠️ Deseja restaurar TODAS as logos para o padrão? Esta ação não pode ser desfeita.'
    );

    if (confirmed) {
      const success = await resetAllLogos();
      if (success) {
        loadCurrentLogos();
        toast.success('Todas as logos foram restauradas ao padrão!');
      } else {
        toast.error('Erro ao resetar logos.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1a4d5c] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando logos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🎨 Gerenciamento de Logos</h1>
          <p className="text-gray-600">Configure logos específicas para cada área do sistema</p>
        </div>
        <Button
          variant="outline"
          onClick={handleResetAll}
          className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Restaurar Todas ao Padrão
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.keys(logoLocations).map((location) => {
          const info = logoLocations[location];
          const currentLogo = logos[location];
          const isCustomized = currentLogo?.updatedAt !== currentLogo?.createdAt;

          return (
            <Card key={location} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 relative overflow-hidden">
              {isCustomized && (
                <Badge className="absolute top-3 right-3 bg-green-500 hover:bg-green-600 z-10">
                  ✨ Personalizada
                </Badge>
              )}

              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <CardTitle className="flex items-center gap-3">
                  <span className="text-2xl">{info.icon}</span>
                  <span className="text-lg">{info.label}</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-8 bg-gray-50/50 min-h-[180px] flex items-center justify-center">
                <div
                  className={`w-full flex items-center justify-center p-5 bg-white rounded-lg border-2 border-dashed border-gray-300 ${
                    location === 'header' ? 'bg-[#1a4d5c]/10' :
                    location === 'sidebar' ? 'bg-[#2C3E50]/10' :
                    location === 'login' ? 'bg-gradient-to-br from-blue-50 to-purple-50' :
                    ''
                  }`}
                >
                  <Logo location={location} />
                </div>
              </CardContent>

              <CardContent className="pt-5 pb-0">
                <CardDescription className="mb-4 text-sm leading-relaxed">
                  {info.description}
                </CardDescription>

                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 font-medium">📏 Tamanho:</span>
                    <span className="text-gray-900 font-semibold">{info.recommendedSize}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 font-medium">📦 Formato:</span>
                    <span className="text-gray-900 font-semibold">{info.recommendedFormat}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 font-medium">📐 Proporção:</span>
                    <span className="text-gray-900 font-semibold">{info.aspectRatio}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex gap-3 pt-4 border-t border-gray-200 mt-5">
                <Button
                  className="flex-1 bg-[#1a4d5c] hover:bg-[#153d48]"
                  onClick={() => handleOpenUpload(location)}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Alterar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleRemoveLogo(location)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {showUploadModal && selectedLocation && (
        <LogoUploadModal
          location={selectedLocation}
          locationInfo={logoLocations[selectedLocation]}
          currentLogo={logos[selectedLocation]}
          onClose={handleCloseUpload}
          onSave={handleLogoSaved}
        />
      )}
    </div>
  );
};

export default LogoManagement;
