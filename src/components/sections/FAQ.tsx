import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';

const FAQ = () => {
  const faqData = [
    {
      id: "item-1",
      question: "Qual o tempo de resposta em caso de emergência ambiental?",
      answer: "Nosso tempo de resposta para emergências é de até 2 horas em áreas metropolitanas e até 4 horas em locais mais remotos. Mantemos equipes estrategicamente posicionadas na região Nordeste para garantir atendimento rápido 24 horas por dia, 7 dias por semana."
    },
    {
      id: "item-2", 
      question: "Quais são as principais certificações da Sirius Ambiental?",
      answer: "Possuímos certificação ISO 14001 (Gestão Ambiental), certificações da Marinha do Brasil para operações portuárias, licenças do IBAMA para transporte de resíduos perigosos, e nossos profissionais possuem certificações específicas como HAZWOPER, OPRC e outras normas internacionais de segurança."
    },
    {
      id: "item-3",
      question: "Como funciona o PEI (Plano de Emergência Individual)?",
      answer: "O PEI é um documento obrigatório para instalações que manipulam óleo e seus derivados. Elaboramos o plano conforme a Resolução CONAMA 398/08, incluindo análise de riscos, procedimentos de resposta, dimensionamento de recursos e treinamentos. Também oferecemos suporte para aprovação nos órgãos competentes."
    },
    {
      id: "item-4",
      question: "Qual a diferença entre PEI e PAE?",
      answer: "O PEI (Plano de Emergência Individual) é específico para cada instalação, enquanto o PAE (Plano de Área de Emergência) abrange múltiplas instalações em uma região portuária. O PAE coordena a resposta integrada entre diferentes operadores, autoridades e prestadores de serviços em uma área portuária."
    },
    {
      id: "item-5",
      question: "Vocês atendem em toda a região Nordeste?",
      answer: "Sim, atendemos em toda a região Nordeste. Temos bases estratégicas nos principais estados nordestinos e parcerias locais que nos permitem mobilizar recursos rapidamente. Para projetos de grande porte ou longa duração, estabelecemos bases temporárias no local."
    },
    {
      id: "item-6",
      question: "Quais tipos de barreiras de contenção vocês oferecem?",
      answer: "Oferecemos diversos tipos: barreiras oceânicas para águas abertas, barreiras costeiras para proteção de praias, barreiras portuárias para terminais, barreiras permanentes para proteção contínua, e barreiras absorventes para remoção do contaminante. Todas são dimensionadas conforme as condições ambientais locais."
    },
    {
      id: "item-7",
      question: "Como é feito o monitoramento ambiental?",
      answer: "Realizamos monitoramento através de coletas programadas de água, sedimento e biota aquática, análises laboratoriais certificadas, relatórios técnicos periódicos e sistemas de monitoramento contínuo quando necessário. Todos os procedimentos seguem as normas CONAMA e protocolos internacionais."
    },
    {
      id: "item-8",
      question: "Qual o prazo para elaboração de um PEI/PAE?",
      answer: "O prazo varia conforme a complexidade da instalação. Para PEI simples: 30-45 dias. Para instalações complexas: 60-90 dias. Para PAE: 90-120 dias. Incluímos tempo para análises técnicas, elaboração de documentos, simulados e adequações conforme feedback dos órgãos ambientais."
    },
    {
      id: "item-9",
      question: "Vocês oferecem treinamentos para as equipes das empresas?",
      answer: "Sim, oferecemos treinamentos teóricos e práticos sobre resposta a emergências, manuseio de equipamentos, procedimentos de segurança, simulados de vazamento e capacitação em normativas ambientais. Os treinamentos são customizados conforme as necessidades específicas de cada cliente."
    },
    {
      id: "item-10",
      question: "Como funciona o atendimento para pequenas e médias empresas?",
      answer: "Temos pacotes adaptados para PMEs, incluindo consultorias simplificadas, planos básicos de emergência, treinamentos em grupo para reduzir custos, e opções de pagamento parcelado. Nosso objetivo é tornar a conformidade ambiental acessível para empresas de todos os portes."
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-primary mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Encontre respostas para as dúvidas mais comuns sobre nossos serviços ambientais
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqData.map((faq) => (
              <AccordionItem 
                key={faq.id} 
                value={faq.id}
                className="bg-card rounded-lg border shadow-sm px-6"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;