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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<HTMLCanvasElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB permitido.');
      return;
    }

    setSelectedFile(file);
    
    // Preview the selected image
    const img = new Image();
    img.onload = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = 640;
        canvas.height = 480;
        
        // Calculate aspect ratio to maintain proportions
        const aspectRatio = img.width / img.height;
        const canvasAspectRatio = canvas.width / canvas.height;
        
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let offsetX = 0;
        let offsetY = 0;
        
        if (aspectRatio > canvasAspectRatio) {
          drawWidth = canvas.height * aspectRatio;
          offsetX = (canvas.width - drawWidth) / 2;
        } else {
          drawHeight = canvas.width / aspectRatio;
          offsetY = (canvas.height - drawHeight) / 2;
        }
        
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        ctx?.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      }
    };
    img.src = URL.createObjectURL(file);
  };

  const processImage = async () => {
    let imageToProcess: HTMLCanvasElement | null = null;
    
    if (capturedImage) {
      imageToProcess = capturedImage;
    } else if (selectedFile && canvasRef.current) {
      imageToProcess = canvasRef.current;
    }
    
    if (!imageToProcess) {
      toast.error('Nenhuma imagem para processar');
      return;
    }

    if (mode === 'register') {
      if (!profile?.id) {
        toast.error('Usuário não autenticado');
        return;
      }

      let fileToUpload: File;
      if (selectedFile) {
        fileToUpload = selectedFile;
      } else {
        // Convert canvas to file
        const blob = await new Promise<Blob>((resolve) => {
          imageToProcess!.toBlob((blob) => {
            resolve(blob!);
          }, 'image/jpeg', 0.8);
        });
        fileToUpload = new File([blob], `facial-ref-${Date.now()}.jpg`, { type: 'image/jpeg' });
      }

      const success = await registerFace(fileToUpload, profile.id);
      if (success && onRegistrationSuccess) {
        onRegistrationSuccess();
        resetComponent();
      }
    } else {
      // Recognition mode
      const result = await recognizeFace(imageToProcess);
      setRecognitionResult(result);
      
      if (result.success && onRecognitionSuccess) {
        onRecognitionSuccess(result.userId!, result.userName!, result.confidence!);
      }
    }
  };

  const resetComponent = () => {
    setCapturedImage(null);
    setSelectedFile(null);
    setRecognitionResult(null);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasImageToProcess = capturedImage || selectedFile;

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

        {/* Camera or File Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium">Câmera</h3>
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
                    Capturar Foto
                  </Button>
                  <Button onClick={stopStream} variant="outline" className="w-full">
                    Parar Câmera
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Upload de Imagem</h3>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelection}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline" 
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Selecionar Imagem
              </Button>
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  {selectedFile.name}
                </p>
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
              ? 'Capture uma foto clara do seu rosto ou faça upload de uma imagem para cadastrar o reconhecimento facial.'
              : 'Use a câmera ou faça upload de uma imagem para fazer o reconhecimento facial e bater o ponto.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FacialRecognition;