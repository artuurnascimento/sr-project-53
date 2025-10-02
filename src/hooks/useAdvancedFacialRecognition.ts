import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LivenessConfig {
  sensitivity: 'low' | 'medium' | 'high';
  testMode: 'automatic' | 'manual';
  movementThreshold: number;
  frameInterval: number;
  numFrames: number;
  liveness_required: boolean;
}

// Improved frame difference calculation
const calculateFrameDifference = (frame1: ImageData, frame2: ImageData): number => {
  if (!frame1 || !frame2 || frame1.data.length !== frame2.data.length) {
    return 0;
  }

  const data1 = frame1.data;
  const data2 = frame2.data;
  let totalDiff = 0;
  let pixelCount = 0;
  
  // Use a more lenient approach - sample every 8th pixel and use luminance
  for (let i = 0; i < data1.length; i += 32) { // Sample every 8th pixel (4x4 block)
    const r1 = data1[i], g1 = data1[i+1], b1 = data1[i+2];
    const r2 = data2[i], g2 = data2[i+1], b2 = data2[i+2];
    
    // Calculate luminance difference (more stable than RGB)
    const lum1 = 0.299 * r1 + 0.587 * g1 + 0.114 * b1;
    const lum2 = 0.299 * r2 + 0.587 * g2 + 0.114 * b2;
    
    const diff = Math.abs(lum1 - lum2);
    totalDiff += diff;
    pixelCount++;
  }
  
  // Normalize and return a more lenient score
  const avgDiff = pixelCount > 0 ? totalDiff / pixelCount : 0;
  return Math.min(avgDiff / 40, 1.0); // Normalize to 0-1 range with max of 40/255
};

// Improved liveness check
const performLivenessCheck = useCallback(async (
  videoElement: HTMLVideoElement,
  config: LivenessConfig
): Promise<{ passed: boolean; score: number }> => {
  if (!config?.liveness_required) {
    return { passed: true, score: 1.0 };
  }

  try {
    console.log('Starting improved liveness check...');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Could not get canvas context');
      return { passed: false, score: 0 };
    }

    // Use higher resolution for better detection
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;
    
    console.log(`Canvas dimensions: ${canvas.width}x${canvas.height}`);

    // Capture frames with better timing
    const frames: ImageData[] = [];
    const numFrames = config.numFrames || 4;
    const frameInterval = config.frameInterval || 800;

    // Show instructions to user
    const instructions = [
      "Por favor, mova a cabeça lentamente para a esquerda",
      "Agora, mova a cabeça lentamente para a direita", 
      "Por fim, sorria por 2 segundos"
    ];

    for (let i = 0; i < numFrames; i++) {
      // Show instruction
      if (i < instructions.length) {
        // toast.info(instructions[i], { duration: 2000 });
      }
      
      // Wait a bit for user to perform action
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Draw current video frame to canvas
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      frames.push(imageData);
      
      console.log(`Captured frame ${i + 1}/${numFrames}`);
    }

    // Calculate movement between consecutive frames
    let totalMovement = 0;
    let validComparisons = 0;

    for (let i = 1; i < frames.length; i++) {
      const movement = calculateFrameDifference(frames[i-1], frames[i]);
      console.log(`Movement between frame ${i-1} and ${i}: ${movement.toFixed(4)}`);
      
      // Use a much lower threshold for movement detection
      if (movement > config.movementThreshold) {
        totalMovement += movement;
        validComparisons++;
      }
    }

    const averageMovement = validComparisons > 0 ? totalMovement / validComparisons : 0;
    console.log(`Average movement: ${averageMovement.toFixed(4)}, Valid comparisons: ${validComparisons}`);

    // Much more lenient scoring system
    let score = 0;
    
    // Base score from average movement
    if (averageMovement > 0.01) score += 0.3;
    if (averageMovement > 0.02) score += 0.3;
    if (averageMovement > 0.04) score += 0.2;
    if (averageMovement > 0.08) score += 0.2;
    
    // Bonus for having multiple frames with movement
    if (validComparisons >= 2) score += 0.2;

    // Ensure score is between 0 and 1
    score = Math.min(1.0, Math.max(0, score));
    
    // Use a much lower threshold for passing
    const passed = score >= 0.2;
    
    console.log(`Liveness check result - Score: ${score.toFixed(2)}, Passed: ${passed}`);
    
    return { passed, score };
  } catch (error) {
    console.error('Liveness check failed:', error);
    return { passed: false, score: 0 };
  }
}, []);

export const useAdvancedFacialRecognition = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Add configuration options
  const [livenessConfig, setLivenessConfig] = useState<LivenessConfig>({
    sensitivity: 'medium',
    testMode: 'automatic',
    movementThreshold: 0.01,
    frameInterval: 800,
    numFrames: 4,
    liveness_required: true
  });

  // Simplified face recognition using direct database search
  const recognizeFace = useCallback(async (
    imageElement: HTMLImageElement | HTMLCanvasElement,
    videoElement?: HTMLVideoElement,
    locationData?: any
  ): Promise<{ userId?: string; userName?: string; confidence?: number; success: boolean; error?: string }> => {
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

  const [isPerformingLiveness, setIsPerformingLiveness] = useState(false);
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [currentInstruction, setCurrentInstruction] = useState('');

  const performLivenessSequence = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!livenessConfig.liveness_required) {
      return true;
    }

    setIsPerformingLiveness(true);
    setLivenessProgress(0);

    try {
      const result = await performLivenessCheck(videoElement, livenessConfig);
      setLivenessProgress(100);
      
      if (!result.passed) {
        throw new Error('Teste de prova de vida falhou');
      }
      
      return true;
    } catch (error) {
      console.error('Liveness check failed:', error);
      throw error;
    } finally {
      setIsPerformingLiveness(false);
      setCurrentInstruction('');
      setLivenessProgress(0);
    }
  }, [livenessConfig]);

  return {
    isProcessing,
    recognizeFace,
    capturePhoto,
    videoRef,
    isPerformingLiveness,
    performLivenessSequence,
    livenessProgress,
    currentInstruction,
    livenessConfig,
    setLivenessConfig
  };
};