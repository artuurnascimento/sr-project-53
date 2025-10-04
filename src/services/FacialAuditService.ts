import { supabase } from '@/integrations/supabase/client';

export type AuditStatus = 'approved' | 'rejected' | 'pending';

export interface LogAttemptParams {
  blob: Blob;
  profileId: string | null;
  recognitionResult: any;
  confidenceScore?: number;
  status: AuditStatus;
  livenessPassed?: boolean;
}

export class FacialAuditService {
  static async uploadEvidence(blob: Blob, profileId?: string | null): Promise<string | null> {
    try {
      const timestamp = Date.now();
      const key = `audit/${profileId || 'unknown'}/${timestamp}.jpg`;
      
      console.log('📸 Uploading facial evidence:', key);
      
      const { data, error } = await supabase.storage
        .from('facial-audit')
        .upload(key, blob, { 
          contentType: 'image/jpeg', 
          upsert: false 
        });
      
      if (error) {
        console.error('❌ Upload error:', error.message);
        return null;
      }
      
      console.log('✅ Upload successful:', key);
      return key;
    } catch (e) {
      console.error('❌ Upload exception:', e);
      return null;
    }
  }

  static async createAuditRecord(params: {
    profileId: string | null;
    attemptKey: string | null;
    recognitionResult: any;
    confidenceScore?: number;
    status: AuditStatus;
    livenessPassed?: boolean;
  }): Promise<string | undefined> {
    console.log('📝 Creating audit record:', {
      profileId: params.profileId,
      hasImage: !!params.attemptKey,
      status: params.status
    });

    const { data, error } = await supabase
      .from('facial_recognition_audit')
      .insert({
        profile_id: params.profileId,
        attempt_image_url: params.attemptKey || 'no-image',
        recognition_result: params.recognitionResult,
        confidence_score: params.confidenceScore,
        status: params.status,
        liveness_passed: params.livenessPassed ?? false,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Audit record error:', error.message);
      return undefined;
    }
    
    console.log('✅ Audit record created:', data?.id);
    return data?.id as string | undefined;
  }

  static async logAttempt({ blob, profileId, recognitionResult, confidenceScore, status, livenessPassed = false }: LogAttemptParams) {
    const key = await this.uploadEvidence(blob, profileId);
    const auditId = await this.createAuditRecord({
      profileId,
      attemptKey: key,
      recognitionResult,
      confidenceScore,
      status,
      livenessPassed,
    });
    return { auditId, key };
  }

  static async signUrl(urlOrKey?: string | null): Promise<string | null> {
    if (!urlOrKey || urlOrKey === 'no-image') return null;
    
    try {
      let key = urlOrKey;
      
      // Extract key from URL if needed
      if (urlOrKey.startsWith('http')) {
        const marker = '/facial-audit/';
        const idx = urlOrKey.indexOf(marker);
        if (idx === -1) return null;
        key = urlOrKey.substring(idx + marker.length);
      }
      
      // Clean up key prefix
      if (key.startsWith('facial-audit/')) {
        key = key.replace('facial-audit/', '');
      }
      
      console.log('🔐 Signing URL for key:', key);
      
      const { data, error } = await supabase.storage
        .from('facial-audit')
        .createSignedUrl(key, 3600);
      
      if (error) {
        console.error('❌ Sign URL error:', error.message);
        return null;
      }
      
      console.log('✅ URL signed successfully');
      return data?.signedUrl ?? null;
    } catch (e) {
      console.error('❌ Sign URL exception:', e);
      return null;
    }
  }
}
