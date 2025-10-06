import SEO from '@/components/SEO';
import { Calendar, MapPin, Award, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CTASection from '@/components/sections/CTASection';
import casePortoSantos from '@/assets/case-porto-santos.jpg';
import caseRefinariaEmergency from '@/assets/case-refinaria-emergency.jpg';
import caseOffshoreMonitoring from '@/assets/case-offshore-monitoring.jpg';
import caseValeConsultoria from '@/assets/case-vale-consultoria.jpg';
import caseSalvageSaoSebastiao from '@/assets/case-salvage-sao-sebastiao.jpg';
import caseBraskemTraining from '@/assets/case-braskem-training.jpg';

interface CaseStudy {
  id: string;
  title: string;
  client: string;
  location: string;
  date: string;
  category: string;
  description: string;
  challenge: string;
  solution: string;
  results: string[];
  image: string;
}

const caseStudies: CaseStudy[] = [
  {
    id: "porto-santos-containment",
    title: "Contenção de Vazamento no Porto de Santos",
    client: "Terminal Portuário Santos",
    location: "Santos - SP",
    date: "Março 2024",
    category: "Contenção Marítima",
    description: "Resposta rápida a vazamento de óleo combustível durante operação de abastecimento",
    challenge: "Vazamento de 500 litros de óleo combustível em área portuária sensível, com risco de contaminação da vida marinha e praias próximas.",
    solution: "Implantação imediata de barreiras de contenção flutuantes, aspiração do produto derramado e tratamento da água contaminada com equipamentos especializados.",
    results: [
      "100% do produto contido em 2 horas",
      "Zero impacto na vida marinha",
      "Operações portuárias retomadas em 6 horas",
      "Conformidade total com órgãos ambientais"
    ],
    image: casePortoSantos
  },
  {
    id: "refinaria-petrobras-emergency",
    title: "Emergência Ambiental em Refinaria",
    client: "Refinaria Brasileira SA",
    location: "Cubatão - SP",
    date: "Janeiro 2024",
    category: "Emergência Industrial",
    description: "Atendimento a emergência ambiental com vazamento de produto químico em unidade industrial",
    challenge: "Ruptura de tubulação causou vazamento de 1.200 litros de solvente orgânico, exigindo contenção imediata e descontaminação do solo.",
    solution: "Mobilização de equipe especializada em 45 minutos, contenção terrestre com barreiras absorventes e processo de biorremediação do solo contaminado.",
    results: [
      "Contenção completa em 90 minutos",
      "Solo totalmente descontaminado",
      "Plano de monitoramento implantado",
      "Zero multas ou penalidades"
    ],
    image: caseRefinariaEmergency
  },
  {
    id: "plataforma-petrobras-monitoring",
    title: "Monitoramento Ambiental Offshore",
    client: "Petróleo Brasileiro SA",
    location: "Bacia de Santos",
    date: "Dezembro 2023",
    category: "Monitoramento",
    description: "Programa de monitoramento ambiental contínuo em plataforma de petróleo",
    challenge: "Implementar sistema de monitoramento ambiental 24/7 em plataforma offshore, garantindo conformidade com regulamentações ambientais rigorosas.",
    solution: "Instalação de sensores automáticos de qualidade da água, sistema de telemetria em tempo real e programa de coleta e análise laboratorial.",
    results: [
      "Monitoramento 24/7 automatizado",
      "Relatórios mensais para órgãos ambientais",
      "100% de conformidade regulatória",
      "Redução de 30% nos custos operacionais"
    ],
    image: caseOffshoreMonitoring
  },
  {
    id: "vale-consultoria-pei",
    title: "Desenvolvimento de PEI para Mineradora",
    client: "Vale Mineração Ltda",
    location: "Parauapebas - PA",
    date: "Novembro 2023",
    category: "Consultoria",
    description: "Elaboração de Plano de Emergência Individual para complexo minerário",
    challenge: "Desenvolver PEI abrangente para operação minerária de grande porte, contemplando múltiplos cenários de risco ambiental.",
    solution: "Análise de riscos detalhada, mapeamento de vulnerabilidades, definição de procedimentos de resposta e programa de treinamento para equipes.",
    results: [
      "PEI aprovado pelos órgãos competentes",
      "200 funcionários treinados",
      "Simulados trimestrais implementados",
      "Certificação de excelência obtida"
    ],
    image: caseValeConsultoria
  },
  {
    id: "cosipa-salvage-operation",
    title: "Operação de Salvatagem no Canal de São Sebastião",
    client: "Companhia Siderúrgica Paulista",
    location: "São Sebastião - SP",
    date: "Outubro 2023",
    category: "Salvatagem",
    description: "Resgate de embarcação encalhada com carga de produtos siderúrgicos",
    challenge: "Embarcação de 180 metros encalhada em área ecologicamente sensível, com risco de vazamento de combustível e perda da carga.",
    solution: "Operação coordenada de reflutuação usando rebocadores especializados, contenção preventiva e monitoramento ambiental contínuo.",
    results: [
      "Embarcação reflutuada com sucesso",
      "Carga totalmente preservada",
      "Zero impacto ambiental",
      "Operação concluída em 72 horas"
    ],
    image: caseSalvageSaoSebastiao
  },
  {
    id: "braskem-training-program",
    title: "Programa de Treinamento em Resposta a Emergências",
    client: "Braskem Petroquímica",
    location: "Camaçari - BA",
    date: "Setembro 2023",
    category: "Treinamento",
    description: "Capacitação de equipes internas para resposta a emergências ambientais",
    challenge: "Capacitar 150 funcionários em procedimentos de resposta a emergências ambientais, incluindo simulações práticas realísticas.",
    solution: "Programa de treinamento modular com aulas teóricas, simulações práticas e certificação individual, utilizando cenários reais da indústria petroquímica.",
    results: [
      "150 funcionários certificados",
      "5 simulações de emergência realizadas",
      "Tempo de resposta reduzido em 40%",
      "Programa renovado por mais 2 anos"
    ],
    image: caseBraskemTraining
  }
];

const Cases = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Cases de Sucesso - Sirius Ambiental",
    "description": "Casos de sucesso em emergências ambientais, operações de contenção, salvamento marítimo e consultoria especializada.",
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": 6,
      "itemListElement": [
        {
          "@type": "Article",
          "name": "Contenção de Vazamento no Porto de Santos",
          "description": "Resposta rápida a vazamento de óleo combustível durante operação de abastecimento"
        },
        {
          "@type": "Article", 
          "name": "Emergência Ambiental em Refinaria",
          "description": "Atendimento a emergência ambiental com vazamento de produto químico em unidade industrial"
        }
      ]
    }
  };
  
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Contenção Marítima": "bg-blue-100 text-blue-800",
      "Emergência Industrial": "bg-red-100 text-red-800",
      "Monitoramento": "bg-green-100 text-green-800",
      "Consultoria": "bg-purple-100 text-purple-800",
      "Salvatagem": "bg-orange-100 text-orange-800",
      "Treinamento": "bg-yellow-100 text-yellow-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Cases de Sucesso"
        description="Conheça nossos principais projetos e como ajudamos empresas a superar desafios ambientais complexos com soluções eficazes."
        keywords="cases sucesso, projetos ambientais, emergências resolvidas, contenção vazamentos casos, porto santos, refinaria, offshore"
        type="website"
        structuredData={structuredData}
      />
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 gradient-hero">
        <div className="container mx-auto px-4">
          <div className="text-center text-white animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Cases de Sucesso
            </h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto leading-relaxed">
              Conheça alguns dos nossos principais projetos e como ajudamos empresas 
              a superar desafios ambientais complexos
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Projetos Executados</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-secondary mb-2">15+</div>
              <div className="text-muted-foreground">Anos de Experiência</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">100%</div>
              <div className="text-muted-foreground">Taxa de Sucesso</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-secondary mb-2">24h</div>
              <div className="text-muted-foreground">Resposta de Emergência</div>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-20 bg-gradient-accent">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-12">
            {caseStudies.map((caseStudy, index) => (
              <Card 
                key={caseStudy.id}
                className="shadow-soft hover:shadow-medium transition-all duration-300 animate-slide-up border-0 overflow-hidden"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="lg:flex">
                  <div className="lg:w-1/3">
                    <img 
                      src={caseStudy.image}
                      alt={caseStudy.title}
                      className="w-full h-64 lg:h-full object-cover"
                    />
                  </div>
                  <div className="lg:w-2/3 p-8">
                    <CardHeader className="p-0 mb-6">
                      <div className="flex items-start justify-between mb-4">
                        <Badge className={getCategoryColor(caseStudy.category)}>
                          {caseStudy.category}
                        </Badge>
                        <div className="text-right text-sm text-muted-foreground">
                          <div className="flex items-center mb-1">
                            <Calendar className="h-4 w-4 mr-1" />
                            {caseStudy.date}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {caseStudy.location}
                          </div>
                        </div>
                      </div>
                      
                      <CardTitle className="text-2xl font-bold text-foreground mb-2">
                        {caseStudy.title}
                      </CardTitle>
                      <CardDescription className="text-primary font-medium">
                        Cliente: {caseStudy.client}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-0 space-y-6">
                      <p className="text-muted-foreground leading-relaxed">
                        {caseStudy.description}
                      </p>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Desafio</h4>
                          <p className="text-sm text-muted-foreground">
                            {caseStudy.challenge}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Solução</h4>
                          <p className="text-sm text-muted-foreground">
                            {caseStudy.solution}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-foreground mb-3">Resultados Alcançados</h4>
                        <ul className="grid md:grid-cols-2 gap-2">
                          {caseStudy.results.map((result, resultIndex) => (
                            <li key={resultIndex} className="flex items-center text-sm text-muted-foreground">
                              <Award className="h-4 w-4 text-secondary mr-2 flex-shrink-0" />
                              {result}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Load More Button */}
          <div className="text-center mt-12">
            <Button 
              variant="outline"
              size="lg"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver Mais Cases
            </Button>
          </div>
        </div>
      </section>

      <CTASection />
      <Footer />
    </div>
  );
};

export default Cases;