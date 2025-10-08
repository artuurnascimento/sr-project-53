import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY não configurada');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { timeEntryId, pdfUrl } = await req.json();

    // Buscar dados do registro de ponto
    const { data: timeEntry, error: timeEntryError } = await supabase
      .from('v_time_entries_completo')
      .select('*')
      .eq('id', timeEntryId)
      .single();

    if (timeEntryError || !timeEntry) {
      throw new Error('Registro de ponto não encontrado');
    }

    const tipoLabel = {
      'IN': 'Entrada',
      'OUT': 'Saída',
      'BREAK_OUT': 'Início de Pausa',
      'BREAK_IN': 'Fim de Pausa'
    }[timeEntry.punch_type] || timeEntry.punch_type;

    const dataHora = new Date(timeEntry.punch_time);
    const dataFormatada = dataHora.toLocaleDateString('pt-BR');
    const horaFormatada = dataHora.toLocaleTimeString('pt-BR');

    // Enviar e-mail usando Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Ponto Eletrônico <onboarding@resend.dev>',
        to: [timeEntry.employee_email],
        subject: `Comprovante de Ponto - ${dataFormatada}`,
        html: `
          <h1>Comprovante de Ponto Eletrônico</h1>
          <p>Olá <strong>${timeEntry.employee_name}</strong>,</p>
          <p>Seu registro de ponto foi confirmado com sucesso:</p>
          <ul>
            <li><strong>Tipo:</strong> ${tipoLabel}</li>
            <li><strong>Data:</strong> ${dataFormatada}</li>
            <li><strong>Hora:</strong> ${horaFormatada}</li>
            ${timeEntry.location_address ? `<li><strong>Localização:</strong> ${timeEntry.location_address}</li>` : ''}
          </ul>
          <p>Seu comprovante está disponível no link abaixo:</p>
          <p><a href="${pdfUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Baixar Comprovante</a></p>
          <p>Código de verificação: <code>${timeEntryId}</code></p>
          <hr>
          <p style="font-size: 12px; color: #666;">Este é um e-mail automático, por favor não responda.</p>
        `
      })
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(`Erro ao enviar e-mail: ${JSON.stringify(errorData)}`);
    }

    // Atualizar registro
    await supabase
      .from('time_entries')
      .update({ email_enviado: true })
      .eq('id', timeEntryId);

    // Registrar log
    await supabase
      .from('logs_sistema')
      .insert({
        tipo: 'email',
        status: 'success',
        referencia_id: timeEntryId,
        mensagem: 'E-mail enviado com sucesso',
        payload: { email: timeEntry.employee_email }
      });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    
    // Registrar erro no log
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('logs_sistema')
        .insert({
          tipo: 'email',
          status: 'error',
          mensagem: error.message,
          payload: { error: error.message }
        });
    } catch (logError) {
      console.error('Erro ao registrar log:', logError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
