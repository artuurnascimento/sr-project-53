import { Shield, Waves, FileText, Activity, Users, Anchor, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SEO from '@/components/SEO';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CTASection from '@/components/sections/CTASection';
import serviceContainmentBarriers from '@/assets/service-containment-barriers.jpg';
import serviceMaritimeEmergency from '@/assets/service-maritime-emergency.jpg';
import servicePeiPae from '@/assets/service-pei-pae.jpg';
import serviceMonitoring from '@/assets/service-monitoring.jpg';
import serviceEnvironmentalConsulting from '@/assets/service-environmental-consulting.jpg';
import serviceSalvageRescue from '@/assets/service-salvage-rescue.jpg';
import { useLanguage } from '@/contexts/LanguageContext';
interface Service {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  image: string;
  href: string;
}
const Services = () => {
  const { t } = useLanguage();
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "provider": {
      "@type": "Organization",
      "name": "Sirius Ambiental"
    },
    "serviceType": "Environmental Emergency Services",
    "description": "Serviços especializados em emergências ambientais, contenção de vazamentos, consultoria e monitoramento ambiental.",
    "offers": [
      {
        "@type": "Service",
        "name": "Barreiras de Contenção",
        "description": "Sistemas de contenção para vazamentos marítimos e terrestres"
      },
      {
        "@type": "Service", 
        "name": "Emergências Marítimas",
        "description": "Resposta rápida a emergências em ambiente marítimo"
      },
      {
        "@type": "Service",
        "name": "PEI e PAE",
        "description": "Desenvolvimento de Planos de Emergência Individual e de Área"
      },
      {
        "@type": "Service",
        "name": "Monitoramento Ambiental",
        "description": "Sistemas de monitoramento contínuo da qualidade ambiental"
      }
    ]
  };
  
  const services: Service[] = [
    {
      icon: <Shield className="h-12 w-12 text-primary" />,
      title: t('services.containment.full.title'),
      description: t('services.containment.full.desc'),
      features: [
        t('services.containment.feature1'),
        t('services.containment.feature2'),
        t('services.containment.feature3'),
        t('services.containment.feature4')
      ],
      image: serviceContainmentBarriers,
      href: "/servicos/barreiras-contencao"
    },
    {
      icon: <Waves className="h-12 w-12 text-secondary" />,
      title: t('services.maritime.full.title'),
      description: t('services.maritime.full.desc'),
      features: [
        t('services.maritime.feature1'),
        t('services.maritime.feature2'),
        t('services.maritime.feature3'),
        t('services.maritime.feature4')
      ],
      image: serviceMaritimeEmergency,
      href: "/servicos/emergencias-maritimas"
    },
    {
      icon: <FileText className="h-12 w-12 text-primary" />,
      title: t('services.pei.full.title'),
      description: t('services.pei.full.desc'),
      features: [
        t('services.pei.feature1'),
        t('services.pei.feature2'),
        t('services.pei.feature3'),
        t('services.pei.feature4')
      ],
      image: servicePeiPae,
      href: "/servicos/pei-pae"
    },
    {
      icon: <Activity className="h-12 w-12 text-secondary" />,
      title: t('services.monitoring.full.title'),
      description: t('services.monitoring.full.desc'),
      features: [
        t('services.monitoring.feature1'),
        t('services.monitoring.feature2'),
        t('services.monitoring.feature3'),
        t('services.monitoring.feature4')
      ],
      image: serviceMonitoring,
      href: "/servicos/monitoramento"
    },
    {
      icon: <Users className="h-12 w-12 text-primary" />,
      title: t('services.consulting.full.title'),
      description: t('services.consulting.full.desc'),
      features: [
        t('services.consulting.feature1'),
        t('services.consulting.feature2'),
        t('services.consulting.feature3'),
        t('services.consulting.feature4')
      ],
      image: serviceEnvironmentalConsulting,
      href: "/servicos/consultoria"
    },
    {
      icon: <Anchor className="h-12 w-12 text-secondary" />,
      title: t('services.salvage.full.title'),
      description: t('services.salvage.full.desc'),
      features: [
        t('services.salvage.feature1'),
        t('services.salvage.feature2'),
        t('services.salvage.feature3'),
        t('services.salvage.feature4')
      ],
      image: serviceSalvageRescue,
      href: "/servicos/salvatagem"
    }
  ];

  return <div className="min-h-screen bg-background">
      <SEO 
        title="Serviços de Emergência Ambiental"
        description="Conheça nossos serviços especializados em contenção, emergências marítimas, PEI/PAE, monitoramento e consultoria ambiental."
        keywords="serviços ambientais, contenção vazamentos, emergência marítima, PEI PAE, monitoramento ambiental, consultoria especializada"
        type="service"
        structuredData={structuredData}
      />
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 gradient-hero">
        <div className="container mx-auto px-4">
          <div className="text-center text-white animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">{t('services.page.title')}</h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto leading-relaxed">
              {t('services.page.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-gradient-accent">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {services.map((service, index) => <Card key={service.title} className="shadow-soft hover:shadow-medium transition-all duration-300 animate-slide-up border-0 overflow-hidden" style={{
            animationDelay: `${index * 150}ms`
          }}>
                <div className="md:flex">
                  <div className="md:w-1/3">
                    <img src={service.image} alt={service.title} className="w-full h-64 md:h-full object-cover" />
                  </div>
                  <div className="md:w-2/3 p-6">
                    <CardHeader className="p-0 mb-4">
                      <div className="flex items-center mb-3">
                        <div className="p-2 bg-accent rounded-lg mr-3">
                          {service.icon}
                        </div>
                        <CardTitle className="text-2xl font-bold text-foreground">
                          {service.title}
                        </CardTitle>
                      </div>
                      <CardDescription className="text-muted-foreground text-base">
                        {service.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-0">
                      <ul className="space-y-2 mb-6">
                        {service.features.map((feature, featureIndex) => <li key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 text-secondary mr-2 flex-shrink-0" />
                            {feature}
                          </li>)}
                      </ul>
                      
                      <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground" asChild>
                        <a href="/contato">
                          <ArrowRight className="mr-2 h-4 w-4" />
                          {t('services.learnMore')}
                        </a>
                      </Button>
                    </CardContent>
                  </div>
                </div>
              </Card>)}
          </div>
        </div>
      </section>

      <CTASection />
      <Footer />
    </div>;
};
export default Services;