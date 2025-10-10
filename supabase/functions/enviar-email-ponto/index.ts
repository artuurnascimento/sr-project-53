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
      verification_code
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

    // Em modo de teste do Resend, enviar para o e-mail verificado
    const emailDestino = 'arturnascimentobusiness@gmail.com';
    const isTestMode = to !== emailDestino;

    // Enviar e-mail usando Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Sirius Ambiental - Ponto Eletrônico <onboarding@resend.dev>',
        to: [emailDestino],
        subject: `Comprovante de Ponto - ${dataFormatada}${isTestMode ? ' [TESTE]' : ''}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #0F3C4C; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .info-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .info-item { margin: 10px 0; }
              .info-label { font-weight: bold; color: #0F3C4C; }
              .button { display: inline-block; background-color: #0F3C4C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
              .verification-code { background-color: #e8f4f8; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all; }
              .test-notice { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; color: #856404; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Comprovante de Ponto Eletrônico</h1>
                <p>Sirius Ambiental</p>
              </div>
              <div class="content">
                ${isTestMode ? '<div class="test-notice"><strong>MODO TESTE:</strong> Este e-mail seria enviado para: <strong>' + to + '</strong></div>' : ''}
                <p>Olá <strong>${employee_name}</strong>,</p>
                <p>Seu registro de ponto foi confirmado com sucesso!</p>

                <div class="info-box">
                  <div class="info-item">
                    <span class="info-label">Tipo:</span> ${punch_type}
                  </div>
                  <div class="info-item">
                    <span class="info-label">Data:</span> ${dataFormatada}
                  </div>
                  <div class="info-item">
                    <span class="info-label">Hora:</span> ${horaFormatada}
                  </div>
                </div>

                <p>Você pode visualizar e baixar seu comprovante completo através do link abaixo:</p>
                <p style="text-align: center;">
                  <a href="${comprovante_url}" class="button">Visualizar Comprovante</a>
                </p>

                <div class="info-item">
                  <span class="info-label">Código de Verificação:</span>
                  <div class="verification-code">${verification_code}</div>
                </div>

                <div class="footer">
                  <p>Este documento foi gerado automaticamente e possui validade legal.</p>
                  <p>Este é um e-mail automático. Por favor, não responda.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      })
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