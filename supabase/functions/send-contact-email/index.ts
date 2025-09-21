import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  company?: string;
  service?: string;
  message: string;
  honeypot?: string; // Campo honeypot para detectar bots
}

// Função de validação
function validateFormData(data: ContactFormData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Honeypot - se preenchido, é spam
  if (data.honeypot && data.honeypot.trim() !== '') {
    return { isValid: false, errors: ['Spam detectado'] };
  }

  // Validação de campos obrigatórios
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres');
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email inválido');
  }

  if (!data.phone || data.phone.trim().length < 10) {
    errors.push('Telefone deve ter pelo menos 10 caracteres');
  }

  if (!data.message || data.message.trim().length < 10) {
    errors.push('Mensagem deve ter pelo menos 10 caracteres');
  }

  // Validação de tamanho máximo
  if (data.name && data.name.length > 100) {
    errors.push('Nome muito longo');
  }

  if (data.message && data.message.length > 1000) {
    errors.push('Mensagem muito longa');
  }

  // Validação de caracteres suspeitos (básico)
  const suspiciousPatterns = [
    /http[s]?:\/\//i, // URLs
    /<script/i,       // Scripts
    /\[url=/i,        // BBCode
  ];

  const fullText = `${data.name} ${data.email} ${data.message}`;
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fullText)) {
      errors.push('Conteúdo suspeito detectado');
      break;
    }
  }

  return { isValid: errors.length === 0, errors };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData: ContactFormData = await req.json();

    // Validar dados do formulário
    const validation = validateFormData(formData);
    if (!validation.isValid) {
      console.log("Validation failed:", validation.errors);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Dados inválidos",
          details: validation.errors
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Verificar se a API key está configurada
    if (!Deno.env.get("RESEND_API_KEY")) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Serviço de email não configurado"
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Rate limiting básico - log do IP para monitoramento
    const clientIP = req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-forwarded-for') || 
                     'unknown';
    console.log(`Contact form submission from IP: ${clientIP}`);

    // Sanitizar dados para o email
    const sanitizedData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      company: formData.company?.trim() || '',
      service: formData.service || '',
      message: formData.message.trim()
    };

    // Send email to company
    const emailResponse = await resend.emails.send({
      from: "Sirius Port <no-reply@siriusport.com.br>",
      to: ["contato@siriusport.com.br"],
      reply_to: sanitizedData.email,
      subject: `Nova mensagem de ${sanitizedData.name} - Sirius Port`,
      text: `Nome: ${sanitizedData.name}\nEmail: ${sanitizedData.email}\nTelefone: ${sanitizedData.phone}\n${sanitizedData.company ? `Empresa: ${sanitizedData.company}\n` : ''}${sanitizedData.service ? `Serviço de Interesse: ${sanitizedData.service}\n` : ''}\nMensagem:\n${sanitizedData.message}\n\nEnviado através do site da Sirius Port | IP: ${clientIP}`,
      html: `
        <h2>Nova mensagem do formulário de contato</h2>
        
        <p><strong>Nome:</strong> ${sanitizedData.name}</p>
        <p><strong>Email:</strong> ${sanitizedData.email}</p>
        <p><strong>Telefone:</strong> ${sanitizedData.phone}</p>
        ${sanitizedData.company ? `<p><strong>Empresa:</strong> ${sanitizedData.company}</p>` : ''}
        ${sanitizedData.service ? `<p><strong>Serviço de Interesse:</strong> ${sanitizedData.service}</p>` : ''}
        
        <h3>Mensagem:</h3>
        <p>${sanitizedData.message.replace(/\n/g, '<br>')}</p>
        
        <hr>
        <p><small>Enviado através do site da Sirius Port | IP: ${clientIP}</small></p>
      `,
    });

    // Verificar se houve erro no envio do email
    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      
      // Verificar se é erro de domínio não verificado
      if (emailResponse.error.message?.includes('verify a domain')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Configuração de email pendente. Entre em contato por telefone.",
            details: ["Domínio de email não verificado no servidor"]
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            },
          }
        );
      }
      
      throw new Error(`Falha no envio do email: ${emailResponse.error.message}`);
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email enviado com sucesso!" 
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);