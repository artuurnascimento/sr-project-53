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
    const { periodo = 'diario' } = await req.json();

    // Calcular data inicial baseada no período
    const hoje = new Date();
    let dataInicio = new Date();
    
    switch (periodo) {
      case 'diario':
        dataInicio.setDate(hoje.getDate() - 1);
        break;
      case 'semanal':
        dataInicio.setDate(hoje.getDate() - 7);
        break;
      case 'mensal':
        dataInicio.setMonth(hoje.getMonth() - 1);
        break;
      default:
        dataInicio.setDate(hoje.getDate() - 1);
    }

    // Buscar colaboradores que devem receber o resumo
    const { data: colaboradores, error: colabError } = await supabase
      .from('colaboradores')
      .select('*')
      .eq('ativo', true)
      .or(`envio_resumo.eq.${periodo},envio_resumo.eq.todos`);

    if (colabError) throw colabError;

    let enviados = 0;
    let erros = 0;

    for (const colaborador of colaboradores || []) {
      try {
        // Buscar resumo dos pontos
        const { data: resumo, error: resumoError } = await supabase
          .from('v_resumo_diario')
          .select('*')
          .eq('colaborador_id', colaborador.id)
          .gte('data', dataInicio.toISOString().split('T')[0])
          .order('data', { ascending: false });

        if (resumoError) throw resumoError;

        if (!resumo || resumo.length === 0) {
          console.log(`Sem registros para ${colaborador.nome}`);
          continue;
        }

        // Gerar HTML do resumo
        let tabelaHtml = `
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="border: 1px solid #dee2e6; padding: 10px;">Data</th>
                <th style="border: 1px solid #dee2e6; padding: 10px;">Entradas</th>
                <th style="border: 1px solid #dee2e6; padding: 10px;">Saídas</th>
                <th style="border: 1px solid #dee2e6; padding: 10px;">Pausas</th>
                <th style="border: 1px solid #dee2e6; padding: 10px;">Retornos</th>
                <th style="border: 1px solid #dee2e6; padding: 10px;">Total</th>
              </tr>
            </thead>
            <tbody>
        `;

        for (const dia of resumo) {
          const data = new Date(dia.data).toLocaleDateString('pt-BR');
          tabelaHtml += `
            <tr>
              <td style="border: 1px solid #dee2e6; padding: 10px;">${data}</td>
              <td style="border: 1px solid #dee2e6; padding: 10px; text-align: center;">${dia.entradas || 0}</td>
              <td style="border: 1px solid #dee2e6; padding: 10px; text-align: center;">${dia.saidas || 0}</td>
              <td style="border: 1px solid #dee2e6; padding: 10px; text-align: center;">${dia.pausas || 0}</td>
              <td style="border: 1px solid #dee2e6; padding: 10px; text-align: center;">${dia.retornos || 0}</td>
              <td style="border: 1px solid #dee2e6; padding: 10px; text-align: center;"><strong>${dia.total_registros || 0}</strong></td>
            </tr>
          `;
        }

        tabelaHtml += `
            </tbody>
          </table>
        `;

        const periodoLabel = {
          'diario': 'Diário',
          'semanal': 'Semanal',
          'mensal': 'Mensal'
        }[periodo] || periodo;

        // Enviar e-mail
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Ponto Eletrônico <onboarding@resend.dev>',
            to: [colaborador.email],
            subject: `Resumo ${periodoLabel} de Ponto - ${hoje.toLocaleDateString('pt-BR')}`,
            html: `
              <h1>Resumo ${periodoLabel} de Ponto</h1>
              <p>Olá <strong>${colaborador.nome}</strong>,</p>
              <p>Segue o resumo dos seus registros de ponto:</p>
              ${tabelaHtml}
              <hr>
              <p style="font-size: 12px; color: #666;">Este é um e-mail automático, por favor não responda.</p>
            `
          })
        });

        if (!emailResponse.ok) {
          throw new Error('Erro ao enviar e-mail');
        }

        enviados++;

        // Registrar log
        await supabase
          .from('logs_sistema')
          .insert({
            tipo: 'cron',
            status: 'success',
            referencia_id: colaborador.id,
            mensagem: `Resumo ${periodo} enviado`,
            payload: { email: colaborador.email, periodo }
          });

      } catch (error) {
        console.error(`Erro ao enviar resumo para ${colaborador.nome}:`, error);
        erros++;

        // Registrar erro
        await supabase
          .from('logs_sistema')
          .insert({
            tipo: 'cron',
            status: 'error',
            referencia_id: colaborador.id,
            mensagem: `Erro ao enviar resumo ${periodo}`,
            payload: { error: error.message }
          });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        enviados, 
        erros,
        total: (colaboradores || []).length 
      }),
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
