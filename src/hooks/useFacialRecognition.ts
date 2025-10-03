import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as faceapi from 'face-api.js';

interface FacialRecognitionResult {
  userId?: string;
  userName?: string;
  confidence?: number;
  success: boolean;
  error?: string;
}

export const useFacialRecognition = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      setModelsLoaded(true);
      console.log('Face-api models loaded successfully');
    } catch (error) {
      console.error('Error loading face-api models:', error);
      toast.error('Erro ao carregar modelos de reconhecimento facial');
    }
  };

  const recognizeFace = useCallback(async (
    imageElement: HTMLImageElement | HTMLCanvasElement
  ): Promise<FacialRecognitionResult> => {
    setIsProcessing(true);

    try {
      if (!modelsLoaded) {
        return {
          success: false,
          error: 'Modelos de reconhecimento ainda não foram carregados'
        };
      }

      const detections = await faceapi
        .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        return {
          success: false,
          error: 'Nenhuma face detectada na imagem'
        };
      }

      const descriptor = Array.from(detections.descriptor);

      const { data, error } = await supabase.rpc('find_user_by_face_embedding', {
        face_embedding: JSON.stringify(descriptor),
        similarity_threshold: 0.6
      });

      if (error) {
        console.error('Face recognition error:', error);
        return {
          success: false,
          error: 'Erro no reconhecimento facial'
        };
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          error: 'Nenhum usuário encontrado com essa face'
        };
      }

      const match = data[0];
      return {
        success: true,
        userId: match.profile_id,
        userName: match.full_name,
        confidence: match.similarity_score * 100
      };

    } catch (error) {
      console.error('Face recognition error:', error);
      return {
        success: false,
        error: 'Erro no processamento da imagem'
      };
    } finally {
      setIsProcessing(false);
    }
  }, [modelsLoaded]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return null;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 640;
    canvas.height = 480;
    
    if (ctx && videoRef.current.videoWidth > 0) {
      // Calculate aspect ratio to maintain proportions
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
    
    return canvas;
  }, []);

  const registerFace = useCallback(async (
    imageElement: HTMLImageElement | HTMLCanvasElement,
    userId: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsProcessing(true);

    try {
      if (!modelsLoaded) {
        return {
          success: false,
          error: 'Modelos de reconhecimento ainda não foram carregados'
        };
      }

      const detections = await faceapi
        .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        return {
          success: false,
          error: 'Nenhuma face detectada na imagem'
        };
      }

      const descriptor = Array.from(detections.descriptor);

      const { error } = await supabase
        .from('profiles')
        .update({
          face_embedding: JSON.stringify(descriptor),
          facial_reference_url: 'registered'
        })
        .eq('id', userId);

      if (error) {
        console.error('Face registration error:', error);
        return {
          success: false,
          error: 'Erro ao salvar dados faciais'
        };
      }

      return { success: true };

    } catch (error) {
      console.error('Face registration error:', error);
      return {
        success: false,
        error: 'Erro no processamento da imagem'
      };
    } finally {
      setIsProcessing(false);
    }
  }, [modelsLoaded]);

  return {
    isProcessing,
    modelsLoaded,
    recognizeFace,
    registerFace,
    capturePhoto,
    videoRef
  };
};