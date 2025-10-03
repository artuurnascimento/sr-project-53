import { useState, useRef, useEffect } from 'react';
import { Camera, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFacialRecognition } from '@/hooks/useFacialRecognition';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FacialAuditService } from '@/services/FacialAuditService';

interface FacialRecognitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userId: string, userName: string, confidence: number, auditId?: string) => void;
  expectedUserId?: string;
}

const FacialRecognitionModal = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  expectedUserId 
}: FacialRecognitionModalProps) => {
  const {
    isProcessing,
    modelsLoaded,
    recognizeFace,
    capturePhoto,
    videoRef
  } = useFacialRecognition();
  
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [recognitionState, setRecognitionState] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
      resetState();
    }
    
    // Cleanup: sempre desligar câmera ao desmontar
    return () => {
      stopStream();
    };
  }, [isOpen]);

  const resetState = () => {
    setRecognitionState('idle');
    setErrorMessage('');
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreamActive(true);
      }
    } catch (error) {
      toast.error('Erro ao acessar câmera. Verifique as permissões.');
      setErrorMessage('Não foi possível acessar a câmera');
      setRecognitionState('error');
    }
  };

  const stopStream = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreamActive(false);
  };

  const handleRecognize = async () => {
    if (!isStreamActive || !videoRef.current) {
      toast.error('Câmera não está ativa');
      return;
    }

    setRecognitionState('validating');
    
    try {
      const canvas = capturePhoto();
      const result = await recognizeFace(canvas);

      if (result.success) {
        // Check if the recognized user matches the expected user
        if (expectedUserId && result.userId !== expectedUserId) {
          setRecognitionState('error');
          setErrorMessage('Face não reconhecida para este usuário');
          toast.error('Face não reconhecida para este usuário');
          return;
        }

        setRecognitionState('success');
        toast.success(`Reconhecido: ${result.userName} (${(result.confidence!).toFixed(1)}%)`);
        
        // Desligar câmera imediatamente
        stopStream();
        
        // Wait a moment to show success, then call onSuccess
        setTimeout(() => {
          onSuccess(result.userId!, result.userName!, result.confidence!, result.auditId);
          onClose();
        }, 1500);
      } else {
        setRecognitionState('error');
        setErrorMessage(result.error || 'Rosto não reconhecido, tente novamente');
        toast.error('Rosto não reconhecido');
      }
    } catch (error) {
      setRecognitionState('error');
      setErrorMessage('Erro ao processar reconhecimento facial');
      toast.error('Erro ao processar reconhecimento facial');
    }
  };

  const handleTryAgain = () => {
    resetState();
  };

  const handleManualPunch = async () => {
    try {
      // Obter o ID do usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Buscar o profile_id do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        toast.error('Perfil não encontrado');
        return;
      }

      let auditId: string | undefined;
      const canvas = capturePhoto();

      if (canvas) {
        const blob: Blob = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.8)
        );

        const { auditId } = await FacialAuditService.logAttempt({
          blob,
          profileId: profile.id,
          recognitionResult: { success: true, reason: 'manual_capture' },
          status: 'pending',
          confidenceScore: 0,
          livenessPassed: false,
        });

        if (auditId) {
          console.log('Registro de auditoria criado:', auditId);
        }
      }

      // Retorna para que possamos vincular ao registro de ponto
      onSuccess(profile.id, 'Registro capturado', 0, auditId);
    } catch (e) {
      console.error('Erro no registro com foto:', e);
      toast.error('Não foi possível capturar a foto para auditoria');
    } finally {
      stopStream();
      onClose();
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        stopStream();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {recognitionState === 'idle' && 'Reconhecimento Facial'}
            {recognitionState === 'validating' && 'Validando rosto...'}
            {recognitionState === 'success' && 'Reconhecido com sucesso!'}
            {recognitionState === 'error' && 'Rosto não reconhecido'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera/Status Display */}
          <div className="relative">
            {recognitionState === 'idle' || recognitionState === 'validating' ? (
              <video
                ref={videoRef}
                className="w-full rounded-lg border"
                autoPlay
                muted
                playsInline
              />
            ) : recognitionState === 'success' ? (
              <div className="flex flex-col items-center justify-center p-8 bg-green-50 rounded-lg border-2 border-green-200">
                <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
                <p className="text-lg font-medium text-green-800">Rosto reconhecido!</p>
                <p className="text-sm text-green-600 mt-2">Registrando ponto...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg border-2 border-red-200">
                <XCircle className="h-16 w-16 text-red-600 mb-4" />
                <p className="text-lg font-medium text-red-800">{errorMessage}</p>
                <p className="text-sm text-red-600 mt-2">Tente novamente</p>
              </div>
            )}

            {recognitionState === 'validating' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                <div className="text-center text-white">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Validando rosto...</p>
                </div>
              </div>
            )}
          </div>

          {/* Loading state for models */}
          {!modelsLoaded && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando modelos de reconhecimento...
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {recognitionState === 'idle' && isStreamActive && modelsLoaded && (
              <Button 
                onClick={handleRecognize} 
                className="w-full"
                size="lg"
              >
                <Camera className="h-4 w-4 mr-2" />
                Capturar e Reconhecer
              </Button>
            )}

            {recognitionState === 'error' && (
              <>
                <Button 
                  onClick={handleTryAgain} 
                  className="w-full"
                  size="lg"
                >
                  Tentar Novamente
                </Button>
                <Button 
                  onClick={handleManualPunch} 
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  Usar Registro Manual
                </Button>
              </>
            )}

            {recognitionState === 'idle' && (
              <Button 
                onClick={onClose} 
                variant="outline"
                className="w-full"
                size="sm"
              >
                Cancelar
              </Button>
            )}
          </div>

          {/* Instructions */}
          {recognitionState === 'idle' && (
            <div className="text-xs text-center text-muted-foreground">
              Posicione seu rosto no centro da câmera e clique em capturar
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FacialRecognitionModal;
