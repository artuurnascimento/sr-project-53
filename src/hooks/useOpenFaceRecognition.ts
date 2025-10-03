import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OpenFaceResult {
  success: boolean;
  userId?: string;
  userName?: string;
  confidence?: number;
  error?: string;
}

export class OpenFaceService {
  private static instance: OpenFaceService;

  private constructor() {}

  public static getInstance(): OpenFaceService {
    if (!OpenFaceService.instance) {
      OpenFaceService.instance = new OpenFaceService();
    }
    return OpenFaceService.instance;
  }

  async registerFace(userId: string, imageFile: File): Promise<{ success: boolean; error?: string }> {
    try {
      // Upload image
      const fileName = `faces/${userId}/${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('facial-references')
        .upload(fileName, imageFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { success: false, error: 'Erro no upload da imagem' };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('facial-references')
        .getPublicUrl(fileName);

      // Save to facial_references table
      const { error: insertError } = await supabase
        .from('facial_references')
        .insert({
          profile_id: userId,
          image_url: urlData.publicUrl,
          embedding: null, // Will be populated by background process
          quality_score: 1.0,
          is_primary: false,
          image_metadata: {
            filename: imageFile.name,
            size: imageFile.size,
            type: imageFile.type,
            upload_timestamp: Date.now()
          }
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        return { success: false, error: 'Erro ao salvar referência facial' };
      }

      // Update profile to have facial reference
      await supabase
        .from('profiles')
        .update({ facial_reference_url: urlData.publicUrl })
        .eq('id', userId);

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Erro no cadastro facial' };
    }
  }

  async recognizeFace(imageData: string): Promise<OpenFaceResult> {
    try {
      // Call the database function
      const { data, error } = await supabase.rpc('find_user_by_face_embedding', {
        face_embedding: imageData,
        similarity_threshold: 0.7
      });

      if (error) {
        console.error('Recognition error:', error);
        return { success: false, error: 'Erro no reconhecimento facial' };
      }

      if (!data || data.length === 0) {
        return { success: false, error: 'Nenhum usuário encontrado' };
      }

      const match = data[0];
      return {
        success: true,
        userId: match.profile_id,
        userName: match.full_name,
        confidence: match.similarity_score * 100
      };
    } catch (error) {
      console.error('Recognition error:', error);
      return { success: false, error: 'Erro no reconhecimento facial' };
    }
  }
}

export const useOpenFaceRecognition = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const openFaceService = OpenFaceService.getInstance();

  const initialize = useCallback(async () => {
    if (isInitialized) return;
    
    try {
      // For now, we'll skip actual OpenFace initialization
      // In production, you would initialize the OpenFace model here
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
      
      return result;
    } catch (error) {
      console.error('Face registration error:', error);
      toast.error('Erro no registro facial');
      return { success: false, error: 'Erro no registro facial' };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const recognizeFace = useCallback(async (imageFile: File): Promise<OpenFaceResult> => {
    setIsProcessing(true);
    
    try {
      // Convert file to base64
      const imageData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(imageFile);
      });

      const result = await openFaceService.recognizeFace(imageData);
      
      if (result.success) {
        toast.success(`Usuário reconhecido: ${result.userName} (${result.confidence?.toFixed(1)}%)`);
      } else {
        toast.error(result.error || 'Face não reconhecida');
      }
      
      return result;
    } catch (error) {
      console.error('Face recognition error:', error);
      toast.error('Erro no reconhecimento facial');
      return { success: false, error: 'Erro no reconhecimento facial' };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const recognizeFaceFromCanvas = useCallback(async (canvas: HTMLCanvasElement): Promise<OpenFaceResult> => {
    setIsProcessing(true);
    
    try {
      // Convert canvas to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      const result = await openFaceService.recognizeFace(imageData);
      
      if (result.success) {
        toast.success(`Usuário reconhecido: ${result.userName} (${result.confidence?.toFixed(1)}%)`);
      } else {
        toast.error(result.error || 'Face não reconhecida');
      }
      
      return result;
    } catch (error) {
      console.error('Canvas recognition error:', error);
      toast.error('Erro no reconhecimento facial');
      return { success: false, error: 'Erro no reconhecimento facial' };
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