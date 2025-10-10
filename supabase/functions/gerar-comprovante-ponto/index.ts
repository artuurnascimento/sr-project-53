import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Função para gerar uma imagem simples do comprovante usando Canvas
async function gerarImagemComprovante(timeEntry: any, qrCodeUrl: string, timeEntryId: string) {
  const tipoLabel: Record<string, string> = {
    'IN': 'Entrada',
    'OUT': 'Saída',
    'BREAK_OUT': 'Início de Pausa',
    'BREAK_IN': 'Fim de Pausa'
  };

  const dataHora = new Date(timeEntry.punch_time);
  const data = dataHora.toLocaleDateString('pt-BR');
  const hora = dataHora.toLocaleTimeString('pt-BR');

  // Gerar SVG para conversão em PNG
  const svgContent = `
    <svg width="800" height="1000" xmlns="http://www.w3.org/2000/svg">
      <!-- Background branco -->
      <rect width="800" height="1000" fill="#ffffff"/>
      
      <!-- Cabeçalho -->
      <rect x="0" y="0" width="800" height="120" fill="#0F3C4C"/>
      <text x="400" y="50" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#ffffff" text-anchor="middle">
        Comprovante de Ponto Eletrônico
      </text>
      <text x="400" y="85" font-family="Arial, sans-serif" font-size="18" fill="#ffffff" text-anchor="middle">
        Sirius Ambiental
      </text>
      
      <!-- Colaborador -->
      <text x="50" y="180" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#333333">
        Colaborador:
      </text>
      <text x="50" y="210" font-family="Arial, sans-serif" font-size="20" fill="#0F3C4C">
        ${timeEntry.employee_name}
      </text>
      
      <!-- Tipo de Registro -->
      <rect x="50" y="230" width="200" height="40" rx="20" fill="#0A6B5C"/>
      <text x="150" y="255" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">
        ${tipoLabel[timeEntry.punch_type] || timeEntry.punch_type}
      </text>
      
      <!-- Data -->
      <text x="50" y="320" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#333333">
        Data:
      </text>
      <text x="50" y="350" font-family="Arial, sans-serif" font-size="20" fill="#0F3C4C">
        ${data}
      </text>
      
      <!-- Hora -->
      <text x="400" y="320" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#333333">
        Hora:
      </text>
      <text x="400" y="350" font-family="Arial, sans-serif" font-size="20" fill="#0F3C4C">
        ${hora}
      </text>
      
      ${timeEntry.location_lat && timeEntry.location_lng ? `
      <!-- Localização -->
      <text x="50" y="410" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#333333">
        Localização:
      </text>
      <text x="50" y="440" font-family="Arial, sans-serif" font-size="16" fill="#555555">
        Lat: ${timeEntry.location_lat.toFixed(6)}, Lng: ${timeEntry.location_lng.toFixed(6)}
      </text>
      ` : ''}
      
      <!-- QR Code Placeholder -->
      <rect x="300" y="500" width="200" height="200" fill="#f0f0f0" stroke="#cccccc" stroke-width="2"/>
      <text x="400" y="600" font-family="Arial, sans-serif" font-size="14" fill="#666666" text-anchor="middle">
        QR Code
      </text>
      <text x="400" y="620" font-family="Arial, sans-serif" font-size="12" fill="#999999" text-anchor="middle">
        Escaneie para validar
      </text>
      
      <!-- Código de Verificação -->
      <rect x="50" y="750" width="700" height="80" fill="#f8f9fa" rx="8"/>
      <text x="400" y="780" font-family="Arial, sans-serif" font-size="14" fill="#666666" text-anchor="middle">
        Código de Verificação
      </text>
      <text x="400" y="810" font-family="monospace" font-size="12" fill="#333333" text-anchor="middle">
        ${timeEntryId}
      </text>
      
      <!-- Rodapé -->
      <line x1="50" y1="870" x2="750" y2="870" stroke="#e0e0e0" stroke-width="1"/>
      <text x="400" y="900" font-family="Arial, sans-serif" font-size="12" fill="#999999" text-anchor="middle">
        Documento gerado automaticamente
      </text>
      <text x="400" y="920" font-family="Arial, sans-serif" font-size="12" fill="#999999" text-anchor="middle">
        Hash: ${timeEntryId.substring(0, 8).toUpperCase()}
      </text>
      <text x="400" y="940" font-family="Arial, sans-serif" font-size="11" fill="#cccccc" text-anchor="middle">
        ${new Date().toLocaleString('pt-BR')}
      </text>
    </svg>
  `;

  // Converter SVG para PNG usando um serviço externo ou retornar SVG como base64
  const svgBase64 = btoa(unescape(encodeURIComponent(svgContent)));
  
  return {
    contentType: 'image/svg+xml',
    data: new TextEncoder().encode(svgContent),
    fileName: `comprovante-${timeEntryId}.svg`
  };
}

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

    // Gerar imagem do comprovante
    const imagemComprovante = await gerarImagemComprovante(timeEntry, qrCodeUrl, timeEntryId);

    const { error: uploadError } = await supabase.storage
      .from('comprovantes')
      .upload(imagemComprovante.fileName, imagemComprovante.data, {
        contentType: imagemComprovante.contentType,
        upsert: true
      });

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError);
      throw new Error('Erro ao salvar comprovante');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('comprovantes')
      .getPublicUrl(imagemComprovante.fileName);

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
