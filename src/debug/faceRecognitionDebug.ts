import { supabase } from '@/integrations/supabase/client';

export async function debugFaceRecognition() {
  console.log('=== DEBUG: FACE RECOGNITION ===');
  
  // 1. Check profiles with facial data
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email, facial_reference_url, face_embedding')
    .not('facial_reference_url', 'is', null);
  
  console.log('Profiles with facial_reference_url:', profiles?.length || 0);
  console.log('Profiles with face_embedding:', profiles?.filter(p => p.face_embedding).length || 0);
  
  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
  }
  
  // 2. Check facial references
  const { data: facialRefs, error: facialRefsError } = await supabase
    .from('facial_references')
    .select('*');
  
  console.log('Total facial references:', facialRefs?.length || 0);
  console.log('Facial references with embedding:', facialRefs?.filter(fr => fr.embedding).length || 0);
  
  if (facialRefsError) {
    console.error('Error fetching facial references:', facialRefsError);
  }
  
  // 3. Test the search function
  try {
    const { data: searchResult, error: searchError } = await supabase
      .rpc('find_user_by_face_embedding', {
        face_embedding: 'test_embedding',
        similarity_threshold: 0.7
      });
    
    console.log('Search function result:', searchResult);
    if (searchError) {
      console.error('Search function error:', searchError);
    }
  } catch (error) {
    console.error('Search function exception:', error);
  }
  
  // 4. Check specific user
  if (profiles && profiles.length > 0) {
    const firstProfile = profiles[0];
    console.log('First profile with face data:', {
      id: firstProfile.id,
      name: firstProfile.full_name,
      hasReferenceUrl: !!firstProfile.facial_reference_url,
      hasEmbedding: !!firstProfile.face_embedding
    });
  }
  
  console.log('=== END DEBUG ===');
}

// Run this in browser console to debug
// debugFaceRecognition();