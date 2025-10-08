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
    const { tipo } = await req.json(); // 'diario', 'semanal' ou 'mensal'

    // Calcular período
    const hoje = new Date();
    let dataInicio: Date;
    let dataFim = hoje;
    let periodoLabel: string;

    switch (tipo) {
      case 'diario':
        dataInicio = new Date(hoje);
        dataInicio.setDate(dataInicio.getDate() - 1);
        dataInicio.setHours(0, 0, 0, 0);
        dataFim.setHours(23, 59, 59, 999);
        periodoLabel = 'Diário';
        break;
      case 'semanal':
        dataInicio = new Date(hoje);
        dataInicio.setDate(dataInicio.getDate() - 7);
        periodoLabel = 'Semanal';
        break;
      case 'mensal':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        periodoLabel = 'Mensal';
        break;
      default:
        throw new Error('Tipo de período inválido');
    }

    // Buscar perfis que desejam receber este tipo de resumo
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .or(`envio_resumo.eq.${tipo},envio_resumo.eq.todos`)
      .eq('is_active', true);

    if (profilesError) throw profilesError;

    const resultados = [];

    for (const profile of profiles || []) {
      try {
        // Buscar pontos do período
        const { data: timeEntries, error: entriesError } = await supabase
          .from('v_time_entries_completo')
          .select('*')
          .eq('employee_id', profile.id)
          .gte('punch_time', dataInicio.toISOString())
          .lte('punch_time', dataFim.toISOString())
          .order('punch_time', { ascending: true });

        if (entriesError) throw entriesError;

        if (!timeEntries || timeEntries.length === 0) {
          console.log(`Nenhum ponto encontrado para ${profile.full_name}`);
          continue;
        }

        // Calcular total de horas
        let totalMinutos = 0;
        let entradaAtual: Date | null = null;

        for (const entry of timeEntries) {
          const punchTime = new Date(entry.punch_time);
          
          if (entry.punch_type === 'IN') {
            entradaAtual = punchTime;
          } else if (entry.punch_type === 'OUT' && entradaAtual) {
            const diff = punchTime.getTime() - entradaAtual.getTime();
            totalMinutos += diff / (1000 * 60);
            entradaAtual = null;
          }
        }

        const horas = Math.floor(totalMinutos / 60);
        const minutos = Math.floor(totalMinutos % 60);

        // Gerar tabela HTML
        const linhasTabela = timeEntries.map(entry => {
          const punchTime = new Date(entry.punch_time);
          const tipoLabel = {
            'IN': 'Entrada',
            'OUT': 'Saída',
            'BREAK_OUT': 'Início Pausa',
            'BREAK_IN': 'Fim Pausa'
          }[entry.punch_type] || entry.punch_type;

          return `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">${punchTime.toLocaleDateString('pt-BR')}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${punchTime.toLocaleTimeString('pt-BR')}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${tipoLabel}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${entry.location_address || '-'}</td>
            </tr>
          `;
        }).join('');

        // Enviar e-mail
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Ponto Eletrônico <onboarding@resend.dev>',
            to: [profile.email],
            subject: `Resumo ${periodoLabel} de Ponto - ${dataInicio.toLocaleDateString('pt-BR')} a ${dataFim.toLocaleDateString('pt-BR')}`,
            html: `
              <h1>Resumo ${periodoLabel} de Ponto Eletrônico</h1>
              <p>Olá <strong>${profile.full_name}</strong>,</p>
              <p>Segue o resumo dos seus registros de ponto do período de <strong>${dataInicio.toLocaleDateString('pt-BR')}</strong> a <strong>${dataFim.toLocaleDateString('pt-BR')}</strong>:</p>
              
              <h2>Total de Horas Trabalhadas: ${horas}h ${minutos}min</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                  <tr style="background-color: #f5f5f5;">
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Data</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Hora</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Tipo</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Localização</th>
                  </tr>
                </thead>
                <tbody>
                  ${linhasTabela}
                </tbody>
              </table>
              
              <p>Total de registros: <strong>${timeEntries.length}</strong></p>
              
              <hr>
              <p style="font-size: 12px; color: #666;">Este é um e-mail automático, por favor não responda.</p>
            `
          })
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          throw new Error(`Erro ao enviar e-mail: ${JSON.stringify(errorData)}`);
        }

        resultados.push({
          profile_id: profile.id,
          nome: profile.full_name,
          email: profile.email,
          registros: timeEntries.length,
          horas: `${horas}h ${minutos}min`,
          status: 'success'
        });

        // Registrar log
        await supabase
          .from('logs_sistema')
          .insert({
            tipo: 'resumo_periodico',
            status: 'success',
            referencia_id: profile.id,
            mensagem: `Resumo ${periodoLabel.toLowerCase()} enviado com sucesso`,
            payload: { 
              email: profile.email,
              periodo: tipo,
              registros: timeEntries.length,
              horas_trabalhadas: `${horas}h ${minutos}min`
            }
          });

      } catch (error) {
        console.error(`Erro ao processar ${profile.full_name}:`, error);
        
        resultados.push({
          profile_id: profile.id,
          nome: profile.full_name,
          email: profile.email,
          status: 'error',
          erro: error.message
        });

        // Registrar erro no log
        await supabase
          .from('logs_sistema')
          .insert({
            tipo: 'resumo_periodico',
            status: 'error',
            referencia_id: profile.id,
            mensagem: `Erro ao enviar resumo ${periodoLabel.toLowerCase()}`,
            payload: { 
              email: profile.email,
              periodo: tipo,
              erro: error.message
            }
          });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        tipo,
        periodo: periodoLabel,
        total_processados: resultados.length,
        resultados
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
