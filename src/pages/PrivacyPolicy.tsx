import SEO from '@/components/SEO';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/sections/WhatsAppButton';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Política de Privacidade"
        description="Conheça nossa política de privacidade e como protegemos seus dados pessoais na Sirius Ambiental."
        keywords="política privacidade, proteção dados, LGPD, privacidade online, dados pessoais"
        type="website"
      />
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-primary mb-8">Política de Privacidade</h1>
          
          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">1. Informações Gerais</h2>
              <p className="text-muted-foreground leading-relaxed">
                A SIRIUS PORT LTDA, inscrita no CNPJ sob o nº 53.279.793/0001-96, localizada na PE-024, 
                Rota dos Coqueiros, 4165, Torre 6 Apt. 702 - Paiva, Cabo de Santo Agostinho - PE, 
                está comprometida com a proteção da privacidade e dos dados pessoais de seus clientes, 
                parceiros e visitantes de nosso website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">2. Dados Coletados</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Coletamos as seguintes informações:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Dados de identificação (nome, email, telefone)</li>
                <li>Informações da empresa (razão social, CNPJ, endereço)</li>
                <li>Dados de navegação (cookies, logs de acesso)</li>
                <li>Informações técnicas sobre solicitações de serviços</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">3. Finalidade do Tratamento</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Os dados pessoais são utilizados para:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Prestação de serviços ambientais e marítimos</li>
                <li>Comunicação sobre nossos serviços</li>
                <li>Atendimento de emergências 24h</li>
                <li>Cumprimento de obrigações legais e regulatórias</li>
                <li>Melhoria de nossos serviços</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">4. Compartilhamento de Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Não compartilhamos dados pessoais com terceiros, exceto quando necessário para:
                prestação de serviços contratados, cumprimento de obrigações legais, 
                ou com autorização expressa do titular dos dados.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">5. Segurança dos Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Implementamos medidas técnicas e organizacionais adequadas para proteger 
                os dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">6. Direitos dos Titulares</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                De acordo com a LGPD, você tem direito a:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Confirmação da existência de tratamento</li>
                <li>Acesso aos dados</li>
                <li>Correção de dados incompletos, inexatos ou desatualizados</li>
                <li>Anonimização, bloqueio ou eliminação de dados</li>
                <li>Portabilidade dos dados</li>
                <li>Revogação do consentimento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">7. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos cookies para melhorar a experiência de navegação, 
                analisar o tráfego do site e personalizar conteúdos. 
                Você pode configurar seu navegador para recusar cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">8. Contato</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para exercer seus direitos ou esclarecer dúvidas sobre esta política, 
                entre em contato conosco através do e-mail contato@siriusport.com.br 
                ou pelo telefone +55 (81) 99822-1113.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">9. Alterações</h2>
              <p className="text-muted-foreground leading-relaxed">
                Esta política pode ser atualizada periodicamente. 
                Recomendamos que você a consulte regularmente.
              </p>
            </section>

            <div className="bg-muted p-6 rounded-lg mt-8">
              <p className="text-sm text-muted-foreground">
                <strong>Última atualização:</strong> Janeiro de 2025
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default PrivacyPolicy;