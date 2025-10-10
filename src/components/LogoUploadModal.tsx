import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { saveLogo, validateLogoFile, fileToBase64, LogoLocationInfo, LogoConfig } from '@/services/logoService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface LogoUploadModalProps {
  location: string;
  locationInfo: LogoLocationInfo;
  currentLogo: LogoConfig | null;
  onClose: () => void;
  onSave: () => void;
}

const LogoUploadModal: React.FC<LogoUploadModalProps> = ({
  location,
  locationInfo,
  currentLogo,
  onClose,
  onSave,
}) => {
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [width, setWidth] = useState(currentLogo?.width || 'auto');
  const [height, setHeight] = useState(currentLogo?.height || 'auto');
  const [backgroundColor, setBackgroundColor] = useState(
    currentLogo?.backgroundColor || 'transparent'
  );
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    const validation = validateLogoFile(file, location);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setNewLogoFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleSave = async () => {
    if (!previewUrl) {
      toast.error('Selecione uma imagem primeiro.');
      return;
    }

    setUploading(true);

    try {
      const logoData = {
        url: previewUrl,
        width,
        height,
        backgroundColor,
      };

      const success = await saveLogo(location, logoData);

      if (success) {
        toast.success('Logo atualizada com sucesso!');
        onSave();
      } else {
        toast.error('Erro ao salvar logo.');
      }
    } catch (err) {
      toast.error('Erro ao salvar logo.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-5" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-7 py-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">
              {locationInfo.icon} Alterar Logo - {locationInfo.label}
            </h2>
            <p className="text-sm text-gray-600">{locationInfo.description}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="px-7 py-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-3">📋 Recomendações</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li><strong>Tamanho:</strong> {locationInfo.recommendedSize}</li>
              <li><strong>Formato:</strong> {locationInfo.recommendedFormat}</li>
              <li><strong>Proporção:</strong> {locationInfo.aspectRatio}</li>
            </ul>
          </div>

          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#1a4d5c] bg-blue-50 border-[3px]'
                : 'border-gray-300 bg-gray-50 hover:border-[#1a4d5c] hover:bg-gray-100'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <div className="max-w-xs mx-auto">
                <img src={previewUrl} alt="Preview" className="max-w-full max-h-48 object-contain" />
              </div>
            ) : (
              <>
                <div className="text-5xl mb-4">📁</div>
                <p className="text-base font-medium text-gray-900 mb-1">Arraste e solte ou clique para selecionar</p>
                <span className="text-xs text-gray-500">
                  {location === 'favicon' ? 'ICO, PNG ou SVG' : 'PNG, JPG ou SVG'} • Máx 3MB
                </span>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={location === 'favicon' ? 'image/*,.ico' : 'image/png,image/jpeg,image/svg+xml'}
            onChange={handleInputChange}
            className="hidden"
          />

          {previewUrl && (
            <>
              <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                <h4 className="text-base font-semibold text-gray-900">⚙️ Configurações</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="width" className="text-sm font-medium text-gray-700">Largura</Label>
                    <Input
                      id="width"
                      type="text"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="auto, 100px, 50%"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="height" className="text-sm font-medium text-gray-700">Altura</Label>
                    <Input
                      id="height"
                      type="text"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="auto, 40px, 100%"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="bgColor" className="text-sm font-medium text-gray-700">Cor de Fundo</Label>
                    <div className="flex gap-2">
                      <Input
                        id="bgColor"
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        placeholder="transparent, #ffffff"
                        className="flex-1"
                      />
                      <Input
                        type="color"
                        value={backgroundColor === 'transparent' ? '#ffffff' : backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-14 h-10 p-1 cursor-pointer"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setBackgroundColor('transparent')}
                      >
                        Transparente
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h4 className="text-base font-semibold text-gray-900 mb-4">👁️ Preview no Contexto</h4>
                <div
                  className={`rounded-lg p-8 flex items-center justify-center min-h-[150px] ${
                    location === 'header' ? 'bg-[#1a4d5c]' :
                    location === 'sidebar' ? 'bg-[#2C3E50]' :
                    location === 'login' ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2]' :
                    location === 'pdf' ? 'bg-white border border-gray-300' :
                    location === 'email' ? 'bg-gray-100' :
                    'bg-gray-100'
                  }`}
                >
                  <div
                    className="p-3 rounded"
                    style={{
                      backgroundColor: backgroundColor,
                    }}
                  >
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="object-contain"
                      style={{
                        width: width,
                        height: height,
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-7 py-5 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={uploading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={uploading || !previewUrl}
            className="bg-[#1a4d5c] hover:bg-[#153d48]"
          >
            {uploading ? 'Salvando...' : '💾 Salvar Logo'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LogoUploadModal;
