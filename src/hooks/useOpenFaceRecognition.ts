import { useState, useCallback, useRef } from 'react';
import { OpenFaceService } from '@/services/openFaceService';
import { toast } from 'sonner';

export const useOpenFaceRecognition = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const openFaceService = OpenFaceService.getInstance();

  const initialize = useCallback(async () => {
    if (isInitialized) return;
    
    try {
      await openFaceService.initialize();
      setIsInitialized(true);
      toast.success('OpenFace inicializado com sucesso');
    } catch (error) {
      console.error('Failed to initialize OpenFace:', error);
      toast.error('Erro ao inicializar OpenFace');
    }
  }, [isInitialized]);

  const registerFace = useCallback(async (userId: string, imageFile: File) => {
    setIsProcessing(true);
    
    try {
      const result = await openFaceService.registerFace(userId, imageFile);
      
      if (result.success) {
        toast.success('Face registrada com sucesso!');
      } else {
        toast.error(result.error || 'Erro ao registrar face');
      }
    } catch (error) {
      console.error('Face registration error:', error);
      toast.error('Erro no registro facial');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const recognizeFace = useCallback(async (imageFile: File) => {
    setIsProcessing(true);
    
    try {
      const result = await openFaceService.recognizeFace(imageFile);
      
      if (result.success) {
        toast.success(`Usuário reconhecido: ${result.userName} (${result.confidence?.toFixed(1)}%)`);
      } else {
        toast.error(result.error || 'Face não reconhecida');
      }
    } catch (error) {
      console.error('Face recognition error:', error);
      toast.error('Erro no reconhecimento facial');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const recognizeFaceFromCanvas = useCallback(async (canvas: HTMLCanvasElement) => {
    setIsProcessing(true);
    
    try {
      const result = await openFaceService.recognizeFaceFromCanvas(canvas);
      
      if (result.success) {
        toast.success(`Usuário reconhecido: ${result.userName} (${result.confidence?.toFixed(1)}%)`);
      } else {
        toast.error(result.error || 'Face não reconhecida');
      }
    } catch (error) {
      console.error('Canvas recognition error:', error);
      toast.error('Erro no reconhecimento facial');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    isInitialized,
    isProcessing,
    initialize,
    registerFace,
    recognizeFace,
    recognizeFaceFromCanvas,
    videoRef
  };
};