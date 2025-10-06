import { Shield, Waves, FileText, Activity, Users, Anchor } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const ServicesOverview = () => {
  const { t } = useLanguage();

  const services = [
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: t('services.containment.title'),
      description: t('services.containment.desc'),
      href: "/servicos/barreiras-contencao"
    },
    {
      icon: <Waves className="h-8 w-8 text-secondary" />,
      title: t('services.emergency.title'),
      description: t('services.emergency.desc'),
      href: "/servicos/emergencias-maritimas"
    },
    {
      icon: <FileText className="h-8 w-8 text-primary" />,
      title: t('services.pei.title'),
      description: t('services.pei.desc'),
      href: "/servicos/pei-pae"
    },
    {
      icon: <Activity className="h-8 w-8 text-secondary" />,
      title: t('services.monitoring.title'),
      description: t('services.monitoring.desc'),
      href: "/servicos/monitoramento"
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: t('services.consulting.title'),
      description: t('services.consulting.desc'),
      href: "/servicos/consultoria"
    },
    {
      icon: <Anchor className="h-8 w-8 text-secondary" />,
      title: t('services.salvage.title'),
      description: t('services.salvage.desc'),
      href: "/servicos/salvatagem"
    }
  ];

  return (
    <section className="py-20 bg-gradient-accent">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold text-primary mb-4">
            {t('services.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('services.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {services.map((service, index) => (
            <Card 
              key={service.title} 
              className="shadow-soft hover:shadow-medium transition-all duration-300 animate-slide-up border-0"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-accent rounded-full w-fit">
                  {service.icon}
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">
                  {service.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-muted-foreground leading-relaxed mb-6">
                  {service.description}
                </CardDescription>
                <Button 
                  variant="outline" 
                  asChild
                  className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <a href="/contato">
                    {t('services.learnMore')}
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center animate-fade-in">
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-3"
            asChild
          >
            <a href="/servicos">
              {t('services.viewAll')}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ServicesOverview;