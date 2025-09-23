import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, User, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useFacialRecognition } from '@/hooks/useFacialRecognition';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FacialRecognitionProps {
  mode: 'register' | 'recognize';
  onRecognitionSuccess?: (userId: string, userName: string, confidence: number) => void;
  onRegistrationSuccess?: () => void;
}

const FacialRecognition = ({ 
  mode, 
  onRecognitionSuccess,
  onRegistrationSuccess 
}: FacialRecognitionProps) => {
  const { profile } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<HTMLCanvasElement | null>(null);
  const [recognitionResult, setRecognitionResult] = useState<any>(null);
  
  const {
    isInitializing,
    isProcessing,
    isModelLoaded,
    initializeModel,
    registerFace,
    recognizeFace,
    capturePhotoFromVideo
  } = useFacialRecognition();

  useEffect(() => {
    initializeModel();
    
    return () => {
      stopStream();
    };
  }, [initializeModel]);

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
      console.error('Camera access error:', error);
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

  const capturePhoto = () => {
    if (!videoRef.current || !isStreamActive) return;
    
    const canvas = capturePhotoFromVideo(videoRef.current);
    setCapturedImage(canvas);
    
    // Display captured image
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = canvas.width;
      canvasRef.current.height = canvas.height;
      ctx?.drawImage(canvas, 0, 0);
    }
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Removed - only camera capture allowed
  };

  const processImage = async () => {
    if (!capturedImage) {
      toast.error('Por favor, capture uma foto primeiro');
      return;
    }

    if (mode === 'register') {
      if (!profile?.id || !profile?.user_id) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Convert canvas to file
      const blob = await new Promise<Blob>((resolve) => {
        capturedImage.toBlob((blob) => {
          resolve(blob!);
        }, 'image/jpeg', 0.8);
      });
      const fileToUpload = new File([blob], `facial-ref-${Date.now()}.jpg`, { type: 'image/jpeg' });

      const success = await registerFace(fileToUpload, profile.id, profile.user_id);
      if (success && onRegistrationSuccess) {
        onRegistrationSuccess();
        resetComponent();
      }
    } else {
      // Recognition mode
      const result = await recognizeFace(capturedImage);
      setRecognitionResult(result);
      
      if (result.success && onRecognitionSuccess) {
        onRecognitionSuccess(result.userId!, result.userName!, result.confidence!);
      }
    }
  };

  const resetComponent = () => {
    setCapturedImage(null);
    setRecognitionResult(null);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const hasImageToProcess = capturedImage;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {mode === 'register' ? 'Cadastrar Reconhecimento Facial' : 'Reconhecimento Facial'}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Model Loading Status */}
        {isInitializing && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Carregando modelo de reconhecimento facial...
            </AlertDescription>
          </Alert>
        )}

        {/* Camera Only */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium text-center">
              {mode === 'register' ? 'Capture sua foto para cadastro' : 'Use a câmera para reconhecimento'}
            </h3>
            <div className="space-y-2">
              {!isStreamActive ? (
                <Button onClick={startCamera} className="w-full">
                  <Camera className="h-4 w-4 mr-2" />
                  Ativar Câmera
                </Button>
              ) : (
                <>
                  <Button onClick={capturePhoto} className="w-full">
                    <Camera className="h-4 w-4 mr-2" />
                    {mode === 'register' ? 'Capturar para Cadastro' : 'Capturar Foto'}
                  </Button>
                  <Button onClick={stopStream} variant="outline" className="w-full">
                    Parar Câmera
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Video Stream */}
        <div className="relative">
          <video
            ref={videoRef}
            className={`w-full rounded-lg border ${!isStreamActive ? 'hidden' : ''}`}
            autoPlay
            muted
            playsInline
          />
          
          {/* Canvas for displaying captured/selected images */}
          <canvas
            ref={canvasRef}
            className={`w-full rounded-lg border bg-slate-100 ${isStreamActive ? 'hidden' : ''}`}
            style={{ maxHeight: '480px' }}
          />
        </div>

        {/* Process Button */}
        {hasImageToProcess && isModelLoaded && (
          <div className="space-y-4">
            <Button 
              onClick={processImage} 
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : mode === 'register' ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <User className="h-4 w-4 mr-2" />
              )}
              {isProcessing 
                ? 'Processando...' 
                : mode === 'register' 
                  ? 'Cadastrar Face' 
                  : 'Reconhecer Face'
              }
            </Button>

            <Button 
              onClick={resetComponent} 
              variant="outline" 
              className="w-full"
            >
              Limpar
            </Button>
          </div>
        )}

        {/* Recognition Result */}
        {recognitionResult && mode === 'recognize' && (
          <Alert className={recognitionResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            {recognitionResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription>
              {recognitionResult.success ? (
                <div className="space-y-2">
                  <div className="font-medium text-green-800">
                    Usuário Reconhecido: {recognitionResult.userName}
                  </div>
                  <Badge variant="secondary">
                    Confiança: {recognitionResult.confidence?.toFixed(1)}%
                  </Badge>
                </div>
              ) : (
                <div className="text-red-800">
                  {recognitionResult.error}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <div className="text-sm text-muted-foreground">
          <p>
            {mode === 'register' 
              ? 'Capture uma foto clara do seu rosto usando a câmera para cadastrar o reconhecimento facial.'
              : 'Use a câmera para capturar sua foto e fazer o reconhecimento facial para bater o ponto.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FacialRecognition;