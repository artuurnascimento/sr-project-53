import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  to: string;
  employee_name: string;
  punch_type: string;
  punch_time: string;
  comprovante_url: string;
  verification_code: string;
  latitude?: string;
  longitude?: string;
  comprovante_image?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY não configurada');
    }

    const {
      to,
      employee_name,
      punch_type,
      punch_time,
      comprovante_url,
      verification_code,
      latitude,
      longitude,
      comprovante_image
    }: EmailRequest = await req.json();

    const dataHora = new Date(punch_time);
    const dataFormatada = dataHora.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const horaFormatada = dataHora.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const hashVerificacao = verification_code.substring(0, 8).toUpperCase();

    const tipoFormatado = punch_type === 'entrada' ? 'Entrada' : 
                          punch_type === 'saida' ? 'Saída' : 
                          punch_type === 'pausa_inicio' ? 'Início Pausa' : 
                          'Fim Pausa';

    const emailDestino = 'arturnascimentobusiness@gmail.com';
    const isTestMode = to !== emailDestino;

    const emailPayload: any = {
      from: 'Sirius Ambiental - Ponto Eletrônico <onboarding@resend.dev>',
      to: [emailDestino],
      subject: `Comprovante de Ponto - ${dataFormatada}${isTestMode ? ' [TESTE]' : ''}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
    .container { max-width: 680px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background-color: white; padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #e5e7eb; }
    .logo-container { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 24px; }
    .check-icon { width: 56px; height: 56px; background-color: #0F3C4C; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .check-icon svg { width: 32px; height: 32px; stroke: white; stroke-width: 3; fill: none; }
    .brand { text-align: right; }
    .brand-name { font-size: 28px; font-weight: 600; color: #0F3C4C; line-height: 1.2; }
    .brand-subtitle { font-size: 14px; color: #6b7280; }
    .title { font-size: 24px; font-weight: 600; color: #111827; margin-bottom: 8px; }
    .subtitle { font-size: 14px; color: #6b7280; }
    .test-notice { background-color: #fef3c7; border: 1px solid #fbbf24; padding: 12px 16px; margin: 0 40px 20px; border-radius: 6px; color: #92400e; font-size: 13px; }
    .content { padding: 32px 40px; }
    .employee-section { margin-bottom: 24px; }
    .employee-label { font-size: 12px; color: #6b7280; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
    .employee-name { font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 12px; }
    .punch-badge { display: inline-block; background-color: #0F3C4C; color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 500; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; }
    .info-item { background-color: white; }
    .info-label { font-size: 12px; color: #6b7280; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
    .info-value { font-size: 16px; font-weight: 500; color: #111827; }
    .location-section { background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 24px 0; }
    .location-label { font-size: 12px; color: #6b7280; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
    .location-value { font-size: 14px; color: #374151; font-family: 'Courier New', monospace; }
    .verification-section { background-color: #f9fafb; padding: 16px; border-radius: 8px; }
    .verification-label { font-size: 12px; color: #6b7280; margin-bottom: 8px; }
    .verification-code { font-size: 13px; color: #374151; font-family: 'Courier New', monospace; word-break: break-all; }
    .footer { background-color: #f9fafb; padding: 24px 40px; text-align: center; font-size: 12px; color: #6b7280; line-height: 1.6; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 4px 0; }
    .hash { font-weight: 600; color: #111827; }
    @media only screen and (max-width: 600px) {
      body { padding: 0; }
      .container { border-radius: 0; }
      .header, .content, .footer, .test-notice { padding-left: 20px; padding-right: 20px; }
      .info-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-container">
        <div class="check-icon">
          <svg viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <div class="brand">
          <div class="brand-name">Sirius</div>
          <div class="brand-subtitle">Ambiental</div>
        </div>
      </div>
      <h1 class="title">Comprovante Válido</h1>
      <p class="subtitle">Registro de Ponto Eletrônico Verificado</p>
    </div>
    
    ${isTestMode ? `<div class="test-notice"><strong>MODO TESTE:</strong> Este e-mail seria enviado para: <strong>${to}</strong></div>` : ''}
    
    <div class="content">
      <div class="employee-section">
        <div class="employee-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Colaborador
        </div>
        <div class="employee-name">${employee_name}</div>
        <span class="punch-badge">${tipoFormatado}</span>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Data
          </div>
          <div class="info-value">${dataFormatada}</div>
        </div>
        <div class="info-item">
          <div class="info-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Hora
          </div>
          <div class="info-value">${horaFormatada}</div>
        </div>
      </div>

      ${latitude && longitude ? `
      <div class="location-section">
        <div class="location-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          Localização
        </div>
        <div class="location-value">${latitude}, ${longitude}</div>
      </div>
      ` : ''}

      <div class="verification-section">
        <div class="verification-label">Código de Verificação</div>
        <div class="verification-code">${verification_code}</div>
      </div>
    </div>

    <div class="footer">
      <p>Este documento foi gerado automaticamente e possui validade legal.</p>
      <p>Hash de verificação: <span class="hash">${hashVerificacao}</span></p>
    </div>
  </div>
</body>
</html>
      `
    };

    if (comprovante_image) {
      emailPayload.attachments = [{
        filename: `comprovante-ponto-${dataFormatada.replace(/\//g, '-')}.png`,
        content: comprovante_image,
        content_type: 'image/png'
      }];
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(`Erro ao enviar e-mail: ${JSON.stringify(errorData)}`);
    }

    const emailData = await emailResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: isTestMode ? 'E-mail de teste enviado para arturnascimentobusiness@gmail.com' : 'E-mail enviado com sucesso',
        email_id: emailData.id,
        test_mode: isTestMode,
        original_recipient: to
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Erro ao enviar e-mail',
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