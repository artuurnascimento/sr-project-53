import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, User, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useOpenFaceRecognition } from '@/hooks/useOpenFaceRecognition';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FacialRecognitionProps {
  mode: 'register' | 'recognize';
  onRecognitionSuccess?: (userId: string, userName: string, confidence: number) => void;
  onRegistrationSuccess?: () => void;
}

const OpenFaceRecognition = ({ 
  mode, 
  onRecognitionSuccess,
  onRegistrationSuccess 
}: FacialRecognitionProps) => {
  const { profile } = useAuth();
  const { 
    isInitialized, 
    isProcessing, 
    initialize, 
    registerFace, 
    recognizeFace, 
    recognizeFaceFromCanvas,
    videoRef
  } = useOpenFaceRecognition();
  
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<HTMLCanvasElement | null>(null);
  const [recognitionResult, setRecognitionResult] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

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

  const handleCapturePhoto = () => {
    if (!videoRef.current || !isStreamActive) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 640;
    canvas.height = 480;
    
    if (ctx && videoRef.current.videoWidth > 0) {
      const videoAspectRatio = videoRef.current.videoWidth / videoRef.current.videoHeight;
      const canvasAspectRatio = canvas.width / canvas.height;
      
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let offsetX = 0;
      let offsetY = 0;
      
      if (videoAspectRatio > canvasAspectRatio) {
        drawWidth = canvas.height * videoAspectRatio;
        offsetX = (canvas.width - drawWidth) / 2;
      } else {
        drawHeight = canvas.width / videoAspectRatio;
        offsetY = (canvas.height - drawHeight) / 2;
      }
      
      ctx.drawImage(videoRef.current, offsetX, offsetY, drawWidth, drawHeight);
    }
    
    setCapturedImage(canvas);
    
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = canvas.width;
      canvasRef.current.height = canvas.height;
      ctx?.drawImage(canvas, 0, 0);
    }
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          setCapturedImage(canvas);
          
          if (canvasRef.current) {
            canvasRef.current.width = canvas.width;
            canvasRef.current.height = canvas.height;
            canvasRef.current.getContext('2d')?.drawImage(canvas, 0, 0);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!capturedImage && !selectedFile) {
      toast.error('Por favor, capture uma foto ou selecione um arquivo');
      return;
    }

    if (mode === 'register') {
      if (!profile?.id) {
        toast.error('Usuário não autenticado');
        return;
      }

      let imageFile: File;
      if (selectedFile) {
        imageFile = selectedFile;
      } else {
        const blob = await new Promise<Blob>((resolve) => {
          capturedImage.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
        });
        imageFile = new File([blob], `face-${Date.now()}.jpg`, { type: 'image/jpeg' });
      }

      const result = await registerFace(profile.id, imageFile);
      
      if (result.success) {
        toast.success('Cadastro realizado com sucesso!');
      } else {
        toast.error(result.error || 'Erro ao cadastrar face');
      }
      
      if (onRegistrationSuccess) {
        onRegistrationSuccess();
        resetComponent();
      }
    } else {
      // Recognition mode
      if (capturedImage) {
        const result = await recognizeFaceFromCanvas(capturedImage);
        setRecognitionResult(result);
        
        if (result.success && onRecognitionSuccess) {
          onRecognitionSuccess(result.userId!, result.userName!, result.confidence!);
        } else {
          toast.error(result.error || 'Face não reconhecida');
        }
      } else if (selectedFile) {
        const result = await recognizeFace(selectedFile);
        setRecognitionResult(result);
        
        if (result.success && onRecognitionSuccess) {
          onRecognitionSuccess(result.userId!, result.userName!, result.confidence!);
        } else {
          toast.error(result.error || 'Face não reconhecida');
        }
      }
    }
  };

  const resetComponent = () => {
    setCapturedImage(null);
    setRecognitionResult(null);
    setSelectedFile(null);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const hasImageToProcess = capturedImage || selectedFile;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Reconhecimento Facial OpenFace
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <Badge variant={isInitialized ? "default" : "secondary"}>
            {isInitialized ? "OpenFace Inicializado" : "Inicializando..."}
          </Badge>
          <Badge variant="outline">
            Powered by TensorFlow.js
          </Badge>
        </div>

        {/* Camera and File Upload */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium text-center">
              {mode === 'register' ? 'Capture sua foto para cadastro' : 'Use a câmera ou selecione um arquivo'}
            </h3>
            <div className="space-y-2">
              {!isStreamActive ? (
                <Button onClick={startCamera} className="w-full" disabled={!isInitialized}>
                  <Camera className="h-4 w-4 mr-2" />
                  Ativar Câmera
                </Button>
              ) : (
                <>
                  <Button onClick={handleCapturePhoto} className="w-full">
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

          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelection}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Selecionar Arquivo
            </Button>
          </div>
        </div>

        {/* Video/Image Display */}
        <div className="relative">
          <video
            ref={videoRef}
            className={`w-full rounded-lg border ${!isStreamActive ? 'hidden' : ''}`}
            autoPlay
            muted
            playsInline
          />
          
          <canvas
            ref={canvasRef}
            className={`w-full rounded-lg border bg-slate-100 ${isStreamActive ? 'hidden' : ''}`}
            style={{ maxHeight: '480px' }}
          />
        </div>

        {/* Process Button */}
        {hasImageToProcess && (
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
                    ✅ Usuário Reconhecido: {recognitionResult.userName}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      Confiança: {recognitionResult.confidence?.toFixed(1)}%
                    </Badge>
                    <Badge variant="outline">
                      OpenFace: {recognitionResult.confidence?.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-red-800">
                  ❌ {recognitionResult.error}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            {mode === 'register' 
              ? 'Capture uma foto clara do seu rosto usando a câmera ou selecione um arquivo para cadastrar o reconhecimento facial OpenFace.'
              : 'Use a câmera ou selecione um arquivo para fazer o reconhecimento facial OpenFace para bater ponto.'
            }
          </p>
          <p className="text-xs">
            <strong>OpenFace:</strong> Sistema de reconhecimento facial baseado em deep learning com 99.38% de precisão.
          </p>
          <p className="text-xs">
            Dica: Use boa iluminação e mantenha o rosto centralizado para melhores resultados.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OpenFaceRecognition;