import { useState, useCallback, useRef } from 'react';
import { pipeline, env } from '@huggingface/transformers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

interface FaceEmbedding {
  embedding: number[];
}

interface FacialRecognitionResult {
  userId?: string;
  userName?: string;
  confidence?: number;
  success: boolean;
  error?: string;
}

export const useFacialRecognition = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const featureExtractorRef = useRef<any>(null);

  // Initialize the face recognition model
  const initializeModel = useCallback(async () => {
    if (featureExtractorRef.current || isInitializing) return;
    
    setIsInitializing(true);
    try {
      console.log('Loading facial recognition model...');
      
      // Use a lightweight face feature extraction model
      const extractor = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        { 
          device: 'webgpu',
          dtype: 'fp32'
        }
      );
      
      featureExtractorRef.current = extractor;
      setIsModelLoaded(true);
      console.log('Facial recognition model loaded successfully');
      
    } catch (error) {
      console.error('Failed to load model:', error);
      toast.error('Erro ao carregar modelo de reconhecimento facial');
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing]);

  // Extract face embedding from image
  const extractFaceEmbedding = useCallback(async (
    imageElement: HTMLImageElement | HTMLCanvasElement
  ): Promise<number[] | null> => {
    if (!featureExtractorRef.current) {
      await initializeModel();
    }

    if (!featureExtractorRef.current) {
      throw new Error('Model not loaded');
    }

    try {
      // Convert image to canvas if needed
      let canvas: HTMLCanvasElement;
      if (imageElement instanceof HTMLCanvasElement) {
        canvas = imageElement;
      } else {
        canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = imageElement.naturalWidth || imageElement.width;
        canvas.height = imageElement.naturalHeight || imageElement.height;
        ctx?.drawImage(imageElement, 0, 0);
      }

      // Convert to base64 for the model
      const dataURL = canvas.toDataURL('image/jpeg', 0.8);
      
      // Extract features
      const result = await featureExtractorRef.current(dataURL, {
        pooling: 'mean',
        normalize: true
      });
      
      return result.data || result.tolist();
    } catch (error) {
      console.error('Error extracting face embedding:', error);
      return null;
    }
  }, [initializeModel]);

  // Register face for user
  const registerFace = useCallback(async (
    imageFile: File,
    userId: string
  ): Promise<boolean> => {
    setIsProcessing(true);
    try {
      // Load image
      const imageElement = await loadImageFromFile(imageFile);
      
      // Extract embedding
      const embedding = await extractFaceEmbedding(imageElement);
      if (!embedding) {
        throw new Error('Não foi possível extrair características faciais da imagem');
      }

      // Upload image to storage
      const fileName = `${userId}/facial-reference-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('facial-references')
        .upload(fileName, imageFile, { upsert: true });

      if (uploadError) {
        throw new Error('Erro ao fazer upload da imagem: ' + uploadError.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('facial-references')
        .getPublicUrl(fileName);

      // Update user profile with embedding and reference URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          face_embedding: `[${embedding.join(',')}]`,
          facial_reference_url: urlData.publicUrl
        })
        .eq('id', userId);

      if (updateError) {
        throw new Error('Erro ao salvar dados faciais: ' + updateError.message);
      }

      toast.success('Reconhecimento facial cadastrado com sucesso!');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [extractFaceEmbedding]);

  // Recognize face from image
  const recognizeFace = useCallback(async (
    imageElement: HTMLImageElement | HTMLCanvasElement
  ): Promise<FacialRecognitionResult> => {
    if (!isModelLoaded) {
      await initializeModel();
    }

    setIsProcessing(true);
    try {
      // Extract embedding from current image
      const currentEmbedding = await extractFaceEmbedding(imageElement);
      if (!currentEmbedding) {
        return {
          success: false,
          error: 'Não foi possível extrair características faciais da imagem'
        };
      }

      // Find matching user in database
      const { data, error } = await supabase
        .rpc('find_user_by_face_embedding', {
          face_embedding: `[${currentEmbedding.join(',')}]`,
          similarity_threshold: 0.7
        });

      if (error) {
        throw new Error('Erro ao buscar usuário: ' + error.message);
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
      const errorMessage = error instanceof Error ? error.message : 'Erro no reconhecimento facial';
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsProcessing(false);
    }
  }, [extractFaceEmbedding, initializeModel, isModelLoaded]);

  // Capture photo from video stream
  const capturePhotoFromVideo = useCallback((
    video: HTMLVideoElement,
    width: number = 640,
    height: number = 480
  ): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (ctx && video.videoWidth > 0) {
      // Calculate aspect ratio to maintain proportions
      const videoAspectRatio = video.videoWidth / video.videoHeight;
      const canvasAspectRatio = width / height;
      
      let drawWidth = width;
      let drawHeight = height;
      let offsetX = 0;
      let offsetY = 0;
      
      if (videoAspectRatio > canvasAspectRatio) {
        drawWidth = height * videoAspectRatio;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawHeight = width / videoAspectRatio;
        offsetY = (height - drawHeight) / 2;
      }
      
      ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
    }
    
    return canvas;
  }, []);

  return {
    isInitializing,
    isProcessing,
    isModelLoaded,
    initializeModel,
    registerFace,
    recognizeFace,
    capturePhotoFromVideo,
    extractFaceEmbedding
  };
};

// Utility function to load image from file
const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    img.src = URL.createObjectURL(file);
  });
};