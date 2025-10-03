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
      const key = `${profileId || 'unknown'}_${Date.now()}.jpg`;
      const { error } = await supabase.storage
        .from('facial-audit')
        .upload(key, blob, { contentType: 'image/jpeg', upsert: false });
      if (error) {
        console.warn('FacialAuditService.uploadEvidence upload error:', error.message);
      }
      return key; // even if upload failed, keep key for consistency
    } catch (e) {
      console.error('FacialAuditService.uploadEvidence error:', e);
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
    const { data, error } = await supabase
      .from('facial_recognition_audit')
      .insert({
        profile_id: params.profileId,
        attempt_image_url: params.attemptKey || undefined,
        recognition_result: params.recognitionResult,
        confidence_score: params.confidenceScore,
        status: params.status,
        liveness_passed: params.livenessPassed ?? false,
      })
      .select()
      .single();

    if (error) {
      console.error('FacialAuditService.createAuditRecord error:', error.message);
      return undefined;
    }
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
    if (!urlOrKey) return null;
    try {
      let key = urlOrKey;
      if (urlOrKey.startsWith('http')) {
        const marker = '/facial-audit/';
        const idx = urlOrKey.indexOf(marker);
        if (idx === -1) return null;
        key = urlOrKey.substring(idx + marker.length);
      }
      if (key.startsWith('facial-audit/')) key = key.replace('facial-audit/', '');
      const { data, error } = await supabase.storage
        .from('facial-audit')
        .createSignedUrl(key, 60 * 60);
      if (error) {
        console.error('FacialAuditService.signUrl error:', error.message);
        return null;
      }
      return data?.signedUrl ?? null;
    } catch (e) {
      console.error('FacialAuditService.signUrl exception:', e);
      return null;
    }
  }
}
