/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔐 Starting create-user function...');
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ No authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('✅ Supabase admin client created');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ Invalid token:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User authenticated:', user.email);

    const { data: currentUserProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!currentUserProfile || !['admin', 'manager'].includes(currentUserProfile.role)) {
      console.error('❌ User is not admin or manager:', currentUserProfile?.role);
      return new Response(
        JSON.stringify({ success: false, error: 'Only admins and managers can create users' }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User has permission:', currentUserProfile.role);

    const requestBody = await req.json();
    const { email, password, full_name, employee_id, department, position, role, is_active } = requestBody;

    console.log('📝 Creating user with data:', { email, full_name, role, employee_id });

    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email, password and full_name are required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ success: false, error: 'Password must be at least 6 characters' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (currentUserProfile.role === 'manager') {
      if (role && role !== 'employee') {
        console.error('❌ Manager trying to create non-employee:', role);
        return new Response(
          JSON.stringify({ success: false, error: 'Managers can only create employees' }), 
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('👤 Creating auth user...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name
      }
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return new Response(
        JSON.stringify({ success: false, error: authError.message }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authData.user) {
      console.error('❌ No user returned from auth');
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create user' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Auth user created:', authData.user.id);

    const finalEmployeeId = employee_id?.trim() || `EMP${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    console.log('📋 Creating profile with employee_id:', finalEmployeeId);
    
    // Criar profile com dados completos
    const profileData = {
      user_id: authData.user.id,
      full_name,
      email,
      employee_id: finalEmployeeId,
      department: department || null,
      position: position || null,
      role: role || 'employee',
      is_active: is_active !== undefined ? is_active : true,
    };
    
    console.log('📋 Profile data:', profileData);
    
    const { data: profileResult, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile error:', profileError);
      console.error('❌ Profile error details:', {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code
      });
      
      // Rollback: deletar usuário do auth
      console.log('🔄 Rolling back auth user...');
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Database error: ${profileError.message}`,
          details: profileError.details,
          hint: profileError.hint
        }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Profile created successfully:', profileResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: authData.user.id,
        profile_id: profileResult.id,
        employee_id: finalEmployeeId
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('❌ Error in create-user function:', error);
    console.error('❌ Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error',
        stack: error.stack
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});