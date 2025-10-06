import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { useLanguage } from '@/contexts/LanguageContext';

interface Testimonial {
  company: string;
  textPt: string;
  textEn: string;
  rating: number;
}

const TestimonialsSection = () => {
  const { t, language } = useLanguage();

  const testimonials: Testimonial[] = [
    {
      company: "Agemar",
      textPt: "Excelente trabalho de consultoria ambiental marinha. A equipe demonstrou profundo conhecimento técnico e agilidade na execução dos serviços de monitoramento.",
      textEn: "Excellent marine environmental consulting work. The team demonstrated deep technical knowledge and agility in executing monitoring services.",
      rating: 5,
    },
    {
      company: "Ambipar",
      textPt: "Parceria estratégica em operações de emergência ambiental. Resposta rápida e eficiente em situações críticas de contenção de vazamentos.",
      textEn: "Strategic partnership in environmental emergency operations. Quick and efficient response in critical spill containment situations.",
      rating: 5,
    },
    {
      company: "Costa Marine",
      textPt: "Serviços de salvamento marítimo de primeira qualidade. Profissionais altamente capacitados e equipamentos modernos para operações complexas.",
      textEn: "First-class maritime salvage services. Highly trained professionals and modern equipment for complex operations.",
      rating: 5,
    },
    {
      company: "Estaleiro Promar S.A.",
      textPt: "Suporte técnico excepcional em projetos de construção naval. Consultoria especializada que agregou muito valor aos nossos processos.",
      textEn: "Exceptional technical support in shipbuilding projects. Specialized consulting that added great value to our processes.",
      rating: 5,
    },
    {
      company: "Estaleiro Atlântico Sul S.A.",
      textPt: "Parceria sólida em serviços de engenharia marítima. Equipe comprometida com prazos e qualidade técnica impecável.",
      textEn: "Solid partnership in maritime engineering services. Team committed to deadlines and impeccable technical quality.",
      rating: 5,
    },
    {
      company: "Davimar",
      textPt: "Serviços de monitoramento ambiental marinho com tecnologia de ponta. Relatórios detalhados e acompanhamento constante.",
      textEn: "Marine environmental monitoring services with cutting-edge technology. Detailed reports and constant monitoring.",
      rating: 5,
    },
    {
      company: "Usina JB",
      textPt: "Apoio fundamental em operações de emergência industrial. Resposta imediata e procedimentos técnicos de alta qualidade.",
      textEn: "Fundamental support in industrial emergency operations. Immediate response and high-quality technical procedures.",
      rating: 5,
    },
    {
      company: "Noronha Express",
      textPt: "Excelência em logística marítima e operações especializadas. Confiabilidade total em projetos de grande complexidade.",
      textEn: "Excellence in maritime logistics and specialized operations. Total reliability in high-complexity projects.",
      rating: 5,
    },
    {
      company: "Grupo Albatroz",
      textPt: "Parceria estratégica em conservação marinha. Trabalho conjunto eficiente e resultados ambientais significativos.",
      textEn: "Strategic partnership in marine conservation. Efficient joint work and significant environmental results.",
      rating: 5,
    },
    {
      company: "Wilson Sons",
      textPt: "Suporte técnico de alto nível em operações portuárias. Conhecimento profundo do setor e soluções inovadoras.",
      textEn: "High-level technical support in port operations. Deep industry knowledge and innovative solutions.",
      rating: 5,
    },
    {
      company: "SAAM Towage Brasil",
      textPt: "Colaboração excepcional em serviços de rebocadores. Operações coordenadas com máxima segurança e eficiência.",
      textEn: "Exceptional collaboration in tugboat services. Coordinated operations with maximum safety and efficiency.",
      rating: 5,
    },
    {
      company: "CHESF",
      textPt: "Consultoria especializada em projetos hidrelétricos costeiros. Expertise técnica e compromisso com sustentabilidade ambiental.",
      textEn: "Specialized consulting in coastal hydroelectric projects. Technical expertise and commitment to environmental sustainability.",
      rating: 5,
    },
  ];

  return (
    <section className="py-20 bg-gradient-accent">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold text-primary mb-4">
            {t('testimonials.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('testimonials.subtitle')}
          </p>
        </div>

        <div className="max-w-4xl mx-auto relative">
          <Carousel 
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={testimonial.company} className="md:basis-1/2 lg:basis-1/3 pl-4">
                  <Card 
                    className="shadow-soft hover:shadow-medium transition-all duration-300 animate-slide-up border-0 relative overflow-hidden h-full"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <CardContent className="p-6 h-full flex flex-col">
                      {/* Rating */}
                      <div className="flex mb-4">
                        {Array.from({ length: 5 }).map((_, starIndex) => (
                          <Star
                            key={starIndex}
                            className={`h-4 w-4 ${
                              starIndex < testimonial.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Testimonial Text */}
                      <p className="text-muted-foreground leading-relaxed mb-6 italic flex-grow">
                        "{language === 'pt' ? testimonial.textPt : testimonial.textEn}"
                      </p>

                      {/* Company Name */}
                      <div className="border-t pt-4">
                        <h4 className="font-semibold text-primary text-lg">
                          {testimonial.company}
                        </h4>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2 md:-left-12 bg-primary text-white border-primary hover:bg-primary/90 shadow-lg" />
            <CarouselNext className="right-2 md:-right-12 bg-primary text-white border-primary hover:bg-primary/90 shadow-lg" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;