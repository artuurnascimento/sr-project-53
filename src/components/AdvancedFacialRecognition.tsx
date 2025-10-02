import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, User, CheckCircle, AlertCircle, Loader2, Eye, Smile, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAdvancedFacialRecognition } from '@/hooks/useAdvancedFacialRecognition';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AdvancedFacialRecognitionProps {
  mode: 'register' | 'recognize';
  onRecognitionSuccess?: (
    userId: string, 
    userName: string, 
    confidence: number, 
    auditId: string | undefined
  ) => void;
  onRegistrationSuccess?: () => void;
  locationData?: any;
}

const AdvancedFacialRecognition = ({ 
  mode, 
  onRecognitionSuccess,
  onRegistrationSuccess,
  locationData
}: AdvancedFacialRecognitionProps) => {
  const { profile } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [capturedImages, setCapturedImages] = useState<HTMLCanvasElement[]>([]);
  const [recognitionResult, setRecognitionResult] = useState<any>(null);
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [isPerformingLiveness, setIsPerformingLiveness] = useState(false);
  const [currentInstruction, setCurrentInstruction] = useState('');

  const {
    isInitializing,
    isProcessing,
    isModelLoaded,
    config,
    livenessTests,
    currentLivenessTest,
    initializeModels,
    initializeLivenessTests,
    registerMultipleFaces,
    recognizeFaceAdvanced,
    performLivenessCheck
  } = useAdvancedFacialRecognition();

  useEffect(() => {
    initializeModels();
    if (mode === 'recognize' && config?.liveness_required) {
      initializeLivenessTests();
    }
    
    return () => {
      stopStream();
    };
  }, [initializeModels, initializeLivenessTests, mode, config]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280, min: 640 }, 
          height: { ideal: 720, min: 480 },
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
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      
      if (mode === 'register') {
        // For registration, collect multiple images
        setCapturedImages(prev => {
          const updated = [...prev, canvas];
          if (updated.length >= (config?.max_images_per_user || 3)) {
            toast.success(`${updated.length} imagens capturadas. Pronto para cadastro!`);
          }
          return updated;
        });
      } else {
        // For recognition, use single image
        setCapturedImages([canvas]);
      }
      
      // Display latest captured image
      if (canvasRef.current) {
        const displayCtx = canvasRef.current.getContext('2d');
        canvasRef.current.width = canvas.width;
        canvasRef.current.height = canvas.height;
        displayCtx?.drawImage(canvas, 0, 0);
      }
    }
  };

  const performLivenessSequence = async () => {
    if (!config?.liveness_required || !videoRef.current) return true;

    setIsPerformingLiveness(true);
    setLivenessProgress(0);

    try {
      // Guide user through liveness tests
      for (let i = 0; i < livenessTests.length; i++) {
        const test = livenessTests[i];
        setCurrentInstruction(test.instruction);
        setLivenessProgress((i / livenessTests.length) * 100);
        
        // Wait for user to perform action (simplified - in production use computer vision)
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Update progress
        setLivenessProgress(((i + 1) / livenessTests.length) * 100);
      }

      // Perform actual liveness check
      const livenessResult = await performLivenessCheck(videoRef.current);
      
      if (!livenessResult.passed) {
        toast.error(`Teste de prova de vida falhou (${(livenessResult.score * 100).toFixed(1)}%)`);
        return false;
      }

      toast.success('Prova de vida confirmada!');
      return true;
    } catch (error) {
      toast.error('Erro no teste de prova de vida');
      return false;
    } finally {
      setIsPerformingLiveness(false);
      setCurrentInstruction('');
      setLivenessProgress(0);
    }
  };

  const processImages = async () => {
    if (capturedImages.length === 0) {
      toast.error('Por favor, capture pelo menos uma foto');
      return;
    }

    if (mode === 'register') {
      if (!profile?.id || !profile?.user_id) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Convert canvases to files
      const files: File[] = [];
      for (let i = 0; i < capturedImages.length; i++) {
        const canvas = capturedImages[i];
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9);
        });
        files.push(new File([blob], `facial-ref-${Date.now()}-${i}.jpg`, { type: 'image/jpeg' }));
      }

      const success = await registerMultipleFaces(files, profile.id, profile.user_id);
      if (success && onRegistrationSuccess) {
        onRegistrationSuccess();
        resetComponent();
      }
    } else {
      // Recognition mode with liveness check
      let livenessValid = true;
      if (config?.liveness_required) {
        livenessValid = await performLivenessSequence();
      }

      if (!livenessValid) return;

      const result = await recognizeFaceAdvanced(
        capturedImages[0], 
        videoRef.current || undefined,
        locationData
      );
      setRecognitionResult(result);
      
      if (result.success && onRecognitionSuccess) {
        onRecognitionSuccess(
          result.userId!, 
          result.userName!, 
          result.confidence!,
          result.auditId
        );
      }
    }
  };

  const resetComponent = () => {
    setCapturedImages([]);
    setRecognitionResult(null);
    setLivenessProgress(0);
    setIsPerformingLiveness(false);
    setCurrentInstruction('');
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const getInstructionIcon = (type: string) => {
    switch (type) {
      case 'blink': return <Eye className="h-4 w-4" />;
      case 'smile': return <Smile className="h-4 w-4" />;
      case 'turn_head': return <RotateCw className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const hasImagesToProcess = capturedImages.length > 0;
  const maxImages = config?.max_images_per_user || 5;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {mode === 'register' ? 'Cadastro Avançado de Reconhecimento Facial' : 'Reconhecimento Facial Avançado'}
        </CardTitle>
        {config && (
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="outline">
              Precisão: {(config.similarity_threshold * 100).toFixed(0)}%
            </Badge>
            <Badge variant="outline">
              Qualidade mín: {(config.min_confidence_score * 100).toFixed(0)}%
            </Badge>
            {config.liveness_required && (
              <Badge variant="outline">Prova de vida: Ativada</Badge>
            )}
            {mode === 'register' && (
              <Badge variant="outline">
                Máx imagens: {maxImages}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Model Loading Status */}
        {isInitializing && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Carregando modelos avançados de reconhecimento facial...
            </AlertDescription>
          </Alert>
        )}

        {/* Liveness Test Progress */}
        {isPerformingLiveness && (
          <Alert className="border-blue-200 bg-blue-50">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {currentInstruction && getInstructionIcon(livenessTests[currentLivenessTest]?.type)}
                <AlertDescription className="font-medium">
                  {currentInstruction || 'Preparando teste de prova de vida...'}
                </AlertDescription>
              </div>
              <Progress value={livenessProgress} className="w-full" />
            </div>
          </Alert>
        )}

        {/* Camera Controls */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium text-center">
              {mode === 'register' 
                ? `Capture ${maxImages} fotos diferentes para um cadastro robusto`
                : 'Use a câmera para reconhecimento seguro'
              }
            </h3>
            <div className="space-y-2">
              {!isStreamActive ? (
                <Button onClick={startCamera} className="w-full" size="lg">
                  <Camera className="h-4 w-4 mr-2" />
                  Ativar Câmera de Alta Resolução
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    onClick={capturePhoto} 
                    className="flex-1"
                    disabled={mode === 'register' && capturedImages.length >= maxImages}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {mode === 'register' 
                      ? `Capturar (${capturedImages.length}/${maxImages})`
                      : 'Capturar Foto'
                    }
                  </Button>
                  <Button onClick={stopStream} variant="outline">
                    Parar Câmera
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Video Stream and Canvas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Live Video */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Câmera Ao Vivo</h4>
            <video
              ref={videoRef}
              className={`w-full rounded-lg border aspect-video ${!isStreamActive ? 'hidden' : ''}`}
              autoPlay
              muted
              playsInline
            />
            {!isStreamActive && (
              <div className="w-full aspect-video bg-slate-100 rounded-lg border flex items-center justify-center">
                <p className="text-muted-foreground">Câmera inativa</p>
              </div>
            )}
          </div>

          {/* Captured Image */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              {mode === 'register' ? 'Última Imagem Capturada' : 'Imagem para Reconhecimento'}
            </h4>
            <canvas
              ref={canvasRef}
              className="w-full rounded-lg border bg-slate-100 aspect-video"
            />
          </div>
        </div>

        {/* Captured Images Preview (Registration Mode) */}
        {mode === 'register' && capturedImages.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Imagens Capturadas ({capturedImages.length})</h4>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {capturedImages.map((canvas, index) => (
                <div key={index} className="relative">
                  <img 
                    src={canvas.toDataURL('image/jpeg', 0.5)}
                    alt={`Captured ${index + 1}`}
                    className="w-full aspect-square object-cover rounded border"
                  />
                  <Badge 
                    variant="secondary" 
                    className="absolute top-1 right-1 text-xs"
                  >
                    {index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Process Button */}
        {hasImagesToProcess && isModelLoaded && !isPerformingLiveness && (
          <div className="space-y-4">
            <Button 
              onClick={processImages} 
              disabled={isProcessing}
              className="w-full"
              size="lg"
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
                  ? `Cadastrar ${capturedImages.length} Referência(s) Facial(is)`
                  : 'Iniciar Reconhecimento Seguro'
              }
            </Button>

            <Button 
              onClick={resetComponent} 
              variant="outline" 
              className="w-full"
            >
              Limpar e Recomeçar
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
                <div className="space-y-3">
                  <div className="font-medium text-green-800">
                    ✅ Usuário Reconhecido: {recognitionResult.userName}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      Confiança: {recognitionResult.confidence?.toFixed(1)}%
                    </Badge>
                    <Badge variant="secondary">
                      Nível: {recognitionResult.confidenceLevel}
                    </Badge>
                    {recognitionResult.livenessScore && (
                      <Badge variant="secondary">
                        Prova de vida: {(recognitionResult.livenessScore * 100).toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                  {recognitionResult.auditId && (
                    <p className="text-xs text-muted-foreground">
                      ID da auditoria: {recognitionResult.auditId}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-red-800 font-medium">
                    ❌ {recognitionResult.error}
                  </div>
                  {recognitionResult.livenessScore !== undefined && (
                    <Badge variant="destructive">
                      Prova de vida: {(recognitionResult.livenessScore * 100).toFixed(1)}%
                    </Badge>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Advanced Instructions */}
        <div className="text-sm text-muted-foreground space-y-3">
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="font-medium text-blue-900">Instruções para melhor resultado:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Use boa iluminação natural ou artificial</li>
              <li>Mantenha o rosto centralizado na câmera</li>
              <li>Evite óculos escuros, chapéus ou objetos cobrindo o rosto</li>
              <li>Para cadastro: varie ligeiramente a expressão e ângulo entre as fotos</li>
              {config?.liveness_required && (
                <li>Siga as instruções de prova de vida atentamente</li>
              )}
            </ul>
          </div>
          
          {mode === 'register' && (
            <div className="border-l-4 border-green-500 pl-4">
              <p className="font-medium text-green-900">Cadastro robusto:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Múltiplas imagens melhoram a precisão do reconhecimento</li>
                <li>O sistema avalia automaticamente a qualidade de cada imagem</li>
                <li>Todas as tentativas são registradas para auditoria</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedFacialRecognition;