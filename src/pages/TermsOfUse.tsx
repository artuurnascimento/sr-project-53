import SEO from '@/components/SEO';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/sections/WhatsAppButton';

const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Termos de Uso"
        description="Leia os termos de uso dos serviços da Sirius Ambiental e as condições para utilização de nossos serviços."
        keywords="termos uso, condições serviço, contrato, termos legais, sirius ambiental"
        type="website"
      />
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-primary mb-8">Termos de Uso</h1>
          
          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ao acessar e utilizar os serviços da SIRIUS PORT LTDA, inscrita no CNPJ 53.279.793/0001-96, 
                você concorda em cumprir estes termos de uso. Se não concordar com algum destes termos, 
                não utilize nossos serviços.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">2. Serviços Oferecidos</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                A SIRIUS PORT oferece serviços especializados em:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Barreiras de contenção ambiental</li>
                <li>Planos de Emergência Individual (PEI) e Planos de Área (PAE)</li>
                <li>Resposta a emergências marítimas 24h</li>
                <li>Monitoramento ambiental</li>
                <li>Consultoria ambiental especializada</li>
                <li>Serviços de salvatagem e resgate</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">3. Uso do Website</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                O uso deste website está sujeito às seguintes condições:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Não utilizar o site para fins ilegais ou não autorizados</li>
                <li>Não transmitir vírus ou códigos maliciosos</li>
                <li>Não tentar acessar áreas restritas do sistema</li>
                <li>Respeitar os direitos de propriedade intelectual</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">4. Contratação de Serviços</h2>
              <p className="text-muted-foreground leading-relaxed">
                A contratação de nossos serviços está sujeita a condições específicas 
                que serão definidas em contrato separado. Os preços e condições podem 
                variar conforme a complexidade e urgência do projeto.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">5. Emergências 24h</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nosso serviço de emergência está disponível 24 horas por dia, 7 dias por semana. 
                O tempo de resposta pode variar conforme a localização e natureza da emergência. 
                Taxas especiais podem ser aplicadas para atendimentos em horários não comerciais.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">6. Propriedade Intelectual</h2>
              <p className="text-muted-foreground leading-relaxed">
                Todo o conteúdo deste website, incluindo textos, imagens, logos e design, 
                é propriedade da SIRIUS PORT LTDA e está protegido por leis de direitos autorais. 
                É proibida a reprodução sem autorização prévia.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">7. Limitação de Responsabilidade</h2>
              <p className="text-muted-foreground leading-relaxed">
                A SIRIUS PORT não se responsabiliza por danos indiretos, incidentais ou 
                consequenciais resultantes do uso deste website. Nossa responsabilidade 
                está limitada aos serviços efetivamente contratados.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">8. Modificações</h2>
              <p className="text-muted-foreground leading-relaxed">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. 
                As alterações entrarão em vigor imediatamente após sua publicação no website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">9. Lei Aplicável</h2>
              <p className="text-muted-foreground leading-relaxed">
                Estes termos são regidos pelas leis brasileiras. 
                Qualquer disputa será resolvida no foro da comarca de Cabo de Santo Agostinho - PE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-primary mb-4">10. Contato</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para dúvidas sobre estes termos, entre em contato através do e-mail 
                contato@siriusport.com.br ou pelo telefone +55 (81) 99822-1113.
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

export default TermsOfUse;