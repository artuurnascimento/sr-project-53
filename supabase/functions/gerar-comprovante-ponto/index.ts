import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import PDFDocument from "https://cdn.skypack.dev/pdfkit@0.13.0";
import QRCode from "https://esm.sh/qrcode@1.5.3";

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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { pontoId } = await req.json();

    // Buscar dados do ponto
    const { data: ponto, error: pontoError } = await supabase
      .from('v_pontos_completo')
      .select('*')
      .eq('id', pontoId)
      .single();

    if (pontoError || !ponto) {
      throw new Error('Ponto não encontrado');
    }

    // Gerar QR Code
    const qrCodeUrl = `${supabaseUrl.replace('https://', 'https://').replace('.supabase.co', '')}/comprovante/${pontoId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, { width: 150 });
    const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

    // Criar PDF
    const chunks: Uint8Array[] = [];
    const doc = new PDFDocument({ margin: 50 });

    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    // Cabeçalho
    doc.fontSize(20).text('Comprovante de Ponto Eletrônico', { align: 'center' });
    doc.moveDown(2);

    // Informações do colaborador
    doc.fontSize(14).text(`Colaborador: ${ponto.colaborador_nome}`, { continued: false });
    doc.fontSize(12).text(`E-mail: ${ponto.colaborador_email}`);
    doc.moveDown();

    // Informações do registro
    const tipoLabel = {
      'entrada': 'Entrada',
      'saida': 'Saída',
      'pausa': 'Pausa',
      'retorno': 'Retorno'
    }[ponto.tipo] || ponto.tipo;

    doc.fontSize(12).text(`Tipo: ${tipoLabel}`);
    const dataHora = new Date(ponto.data_hora);
    doc.text(`Data: ${dataHora.toLocaleDateString('pt-BR')}`);
    doc.text(`Hora: ${dataHora.toLocaleTimeString('pt-BR')}`);
    
    if (ponto.localizacao) {
      doc.text(`Localização: ${ponto.localizacao}`);
    }
    
    doc.moveDown();
    doc.text(`Código de Verificação: ${pontoId}`);
    doc.moveDown(2);

    // QR Code
    doc.image(qrCodeBuffer, { fit: [150, 150], align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text('Escaneie o QR Code para validar', { align: 'center' });

    // Rodapé
    doc.moveDown(2);
    doc.fontSize(8).text('Documento gerado automaticamente', { align: 'center' });
    doc.text(`Hash: ${pontoId.substring(0, 8).toUpperCase()}`, { align: 'center' });

    doc.end();

    const pdfBuffer = await pdfPromise;

    // Upload para Supabase Storage
    const fileName = `comprovante-${pontoId}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('comprovantes')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('comprovantes')
      .getPublicUrl(fileName);

    // Atualizar registro do ponto
    await supabase
      .from('pontos')
      .update({ comprovante_pdf: publicUrl })
      .eq('id', pontoId);

    // Registrar log
    await supabase
      .from('logs_sistema')
      .insert({
        tipo: 'pdf',
        status: 'success',
        referencia_id: pontoId,
        mensagem: 'Comprovante gerado com sucesso',
        payload: { url: publicUrl }
      });

    // Chamar função de envio de e-mail
    try {
      await supabase.functions.invoke('enviar-email-ponto', {
        body: { pontoId, pdfUrl: publicUrl }
      });
    } catch (emailError) {
      console.error('Erro ao enviar e-mail:', emailError);
    }

    return new Response(
      JSON.stringify({ success: true, pdfUrl: publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
