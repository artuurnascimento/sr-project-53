import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FacialRecognitionResult {
  userId?: string;
  userName?: string;
  confidence?: number;
  success: boolean;
  error?: string;
}

export const useFacialRecognition = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Simplified face recognition using direct database search
  const recognizeFace = useCallback(async (
    imageElement: HTMLImageElement | HTMLCanvasElement
  ): Promise<FacialRecognitionResult> => {
    setIsProcessing(true);
    
    try {
      // Convert image to base64
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (imageElement instanceof HTMLCanvasElement) {
        canvas.width = imageElement.width;
        canvas.height = imageElement.height;
        ctx?.drawImage(imageElement, 0, 0);
      } else {
        canvas.width = imageElement.naturalWidth || imageElement.width;
        canvas.height = imageElement.naturalHeight || imageElement.height;
        ctx?.drawImage(imageElement, 0, 0);
      }
      
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      
      // For now, we'll use a simplified approach
      // In production, you should use a proper face recognition service
      const { data, error } = await supabase.rpc('find_user_by_face_embedding', {
        face_embedding: base64Image, // Simplified - in production use actual embedding
        similarity_threshold: 0.7
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
  }, []);

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

  return {
    isProcessing,
    recognizeFace,
    capturePhoto,
    videoRef
  };
};