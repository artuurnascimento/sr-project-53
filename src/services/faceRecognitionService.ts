import { supabase } from '@/integrations/supabase/client';

export class FaceRecognitionService {
  private static instance: FaceRecognitionService;

  private constructor() {}

  public static getInstance(): FaceRecognitionService {
    if (!FaceRecognitionService.instance) {
      FaceRecognitionService.instance = new FaceRecognitionService();
    }
    return FaceRecognitionService.instance;
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

  async recognizeFace(imageData: string): Promise<{ 
    success: boolean; 
    userId?: string; 
    userName?: string;
    confidence?: number;
    error?: string 
  }> {
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