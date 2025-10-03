import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, User, CheckCircle, AlertCircle, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFacialRecognition } from '@/hooks/useFacialRecognition';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FacialRecognitionProps {
  mode: 'register' | 'recognize';
  onRecognitionSuccess?: (userId: string, userName: string, confidence: number, auditId?: string) => void;
  onRegistrationSuccess?: () => void;
  locationData?: any;
}

const AdvancedFacialRecognition = ({ 
  mode, 
  onRecognitionSuccess,
  onRegistrationSuccess,
  locationData
}: FacialRecognitionProps) => {
  const { profile } = useAuth();
  const {
    isProcessing,
    modelsLoaded,
    recognizeFace,
    registerFace,
    capturePhoto,
    videoRef
  } = useFacialRecognition();
  
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [capturedImages, setCapturedImages] = useState<HTMLCanvasElement[]>([]);
  const [recognitionResult, setRecognitionResult] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [manualTestMode, setManualTestMode] = useState(false);
  const [isPerformingLiveness, setIsPerformingLiveness] = useState(false);
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [currentInstruction, setCurrentInstruction] = useState('');

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

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
    
    const canvas = capturePhoto();
    setCapturedImages(prev => [...prev, canvas]);
    
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
    if (file) {
      setSelectedFile(file);
      
      // Display image
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          setCapturedImages([canvas]);
          
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

  const performManualLivenessTest = async () => {
    if (!videoRef.current) return true;

    setIsPerformingLiveness(true);
    setLivenessProgress(0);

    try {
      const instructions = [
        "Por favor, pisque os olhos duas vezes",
        "Agora, sorria por 2 segundos",
        "Por fim, vire a cabeça lentamente para a direita"
      ];

      for (let i = 0; i < instructions.length; i++) {
        setCurrentInstruction(instructions[i]);
        setLivenessProgress((i / instructions.length) * 100);
        
        // Show instruction as toast
        toast.info(instructions[i], { duration: 3000 });
        
        // Wait for user to perform action
        await new Promise(resolve => setTimeout(resolve, 4000));
        
        // Update progress
        setLivenessProgress(((i + 1) / instructions.length) * 100);
      }

      // For manual test, always pass if user completes all steps
      const passed = true;
      const score = 0.8; // Fixed score for manual test

      toast.success('Teste manual concluído com sucesso!');
      return { passed, score };
    } catch (error) {
      toast.error('Erro no teste manual');
      return false;
    } finally {
      setIsPerformingLiveness(false);
      setCurrentInstruction('');
      setLivenessProgress(0);
    }
  };

  const processImages = async () => {
    if (capturedImages.length === 0 && !selectedFile) {
      toast.error('Por favor, capture uma foto ou selecione um arquivo');
      return;
    }

    if (!modelsLoaded) {
      toast.error('Modelos de reconhecimento ainda não carregados. Aguarde...');
      return;
    }

    if (mode === 'register') {
      if (!profile?.id) {
        toast.error('Usuário não autenticado');
        return;
      }

      const result = await registerFace(capturedImages[0], profile.id);

      if (!result.success) {
        toast.error(result.error || 'Erro no cadastro facial');
        return;
      }

      toast.success('Cadastro facial realizado com sucesso!');

      if (onRegistrationSuccess) {
        onRegistrationSuccess();
        resetComponent();
      }
    } else {
      const result = await recognizeFace(capturedImages[0]);

      setRecognitionResult(result);

      if (result.success && onRecognitionSuccess) {
        onRecognitionSuccess(result.userId!, result.userName!, result.confidence!);
      } else {
        toast.error(result.error || 'Face não reconhecida');
      }
    }
  };

  const resetComponent = () => {
    setCapturedImages([]);
    setRecognitionResult(null);
    setSelectedFile(null);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const hasImageToProcess = capturedImages.length > 0 || selectedFile;

  // Add visual feedback during liveness testing
  const renderLivenessFeedback = () => {
    if (isPerformingLiveness) {
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="animate-pulse mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center">
                  <Eye className="h-8 w-8 text-blue-600 animate-pulse" />
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mb-2">
                Teste de Prova de Vida
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                {currentInstruction || 'Preparando...'}
              </p>
              
              <Progress value={livenessProgress} className="w-full mb-4" />
              
              <p className="text-xs text-gray-500">
                {livenessProgress.toFixed(0)}% concluído
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Reconhecimento Facial Avançado
          </div>
          {!modelsLoaded && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Carregando modelos...
            </Badge>
          )}
          {modelsLoaded && (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Pronto
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Camera Controls */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium text-center">
              {mode === 'register' ? 'Capture sua foto para cadastro' : 'Use a câmera'}
            </h3>
            <div className="space-y-2">
              {!isStreamActive ? (
                <Button onClick={startCamera} className="w-full">
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
              onClick={processImages} 
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
              ? 'Capture uma foto clara do seu rosto usando a câmera ou selecione um arquivo para cadastrar o reconhecimento facial.'
              : 'Use a câmera ou selecione um arquivo para fazer o reconhecimento facial para bater ponto.'
            }
          </p>
          <p className="text-xs">
            Dica: Use boa iluminação e mantenha o rosto centralizado para melhores resultados.
          </p>
        </div>

        {renderLivenessFeedback()}
      </CardContent>
    </Card>
  );
};

export default AdvancedFacialRecognition;