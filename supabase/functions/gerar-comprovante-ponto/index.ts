import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { timeEntryId } = await req.json();

    if (!timeEntryId) {
      throw new Error('timeEntryId é obrigatório');
    }

    const { data: timeEntry, error: timeEntryError } = await supabase
      .from('v_time_entries_completo')
      .select('*')
      .eq('id', timeEntryId)
      .maybeSingle();

    if (timeEntryError) {
      console.error('Erro ao buscar registro:', timeEntryError);
      throw new Error('Erro ao buscar registro de ponto');
    }

    if (!timeEntry) {
      throw new Error('Registro de ponto não encontrado');
    }

    const appDomain = Deno.env.get('APP_DOMAIN') ||
      supabaseUrl.replace('.supabase.co', '.lovableproject.com');

    const qrCodeUrl = `${appDomain}/comprovante?id=${timeEntryId}`;

    const tipoLabel: Record<string, string> = {
      'IN': 'Entrada',
      'OUT': 'Saída',
      'BREAK_OUT': 'Início de Pausa',
      'BREAK_IN': 'Fim de Pausa'
    };

    const dataHora = new Date(timeEntry.punch_time);
    const data = dataHora.toLocaleDateString('pt-BR');
    const hora = dataHora.toLocaleTimeString('pt-BR');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .content { margin: 20px 0; }
    .info-row { margin: 10px 0; }
    .label { font-weight: bold; }
    .qrcode { text-align: center; margin: 30px 0; }
    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Comprovante de Ponto Eletrônico</h1>
  </div>
  <div class="content">
    <div class="info-row">
      <span class="label">Colaborador:</span> ${timeEntry.employee_name}
    </div>
    <div class="info-row">
      <span class="label">E-mail:</span> ${timeEntry.employee_email}
    </div>
    <div class="info-row">
      <span class="label">Tipo:</span> ${tipoLabel[timeEntry.punch_type] || timeEntry.punch_type}
    </div>
    <div class="info-row">
      <span class="label">Data:</span> ${data}
    </div>
    <div class="info-row">
      <span class="label">Hora:</span> ${hora}
    </div>
    ${timeEntry.location_address ? `
    <div class="info-row">
      <span class="label">Localização:</span> ${timeEntry.location_address}
    </div>
    ` : ''}
    <div class="info-row">
      <span class="label">Código de Verificação:</span> ${timeEntryId}
    </div>
  </div>
  <div class="qrcode">
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}" alt="QR Code">
    <p>Escaneie o QR Code para validar</p>
  </div>
  <div class="footer">
    <p>Documento gerado automaticamente</p>
    <p>Hash: ${timeEntryId.substring(0, 8).toUpperCase()}</p>
  </div>
</body>
</html>
    `;

    const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
    const fileName = `comprovante-${timeEntryId}.html`;

    const { error: uploadError } = await supabase.storage
      .from('comprovantes')
      .upload(fileName, htmlBlob, {
        contentType: 'text/html',
        upsert: true
      });

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError);
      throw new Error('Erro ao salvar comprovante');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('comprovantes')
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from('time_entries')
      .update({
        comprovante_pdf: publicUrl,
        email_enviado: false
      })
      .eq('id', timeEntryId);

    if (updateError) {
      console.error('Erro ao atualizar registro:', updateError);
    }

    await supabase
      .from('logs_sistema')
      .insert({
        tipo: 'comprovante',
        status: 'success',
        referencia_id: timeEntryId,
        mensagem: 'Comprovante gerado com sucesso',
        payload: { url: publicUrl }
      });

    try {
      await supabase.functions.invoke('enviar-email-ponto', {
        body: { timeEntryId, pdfUrl: publicUrl }
      });
    } catch (emailError) {
      console.error('Erro ao enviar e-mail:', emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        pdfUrl: publicUrl,
        message: 'Comprovante gerado com sucesso'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Erro na função:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
