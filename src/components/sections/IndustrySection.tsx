import { Factory, Ship, Zap, Droplets, Truck, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

interface Industry {
  icon: React.ReactNode;
  titleKey: string;
  descriptionKey: string;
  serviceKeys: string[];
}

const IndustrySection = () => {
  const { t } = useLanguage();

  const industries: Industry[] = [
    {
      icon: <Ship className="h-8 w-8 text-primary" />,
      titleKey: "industry.ports.title",
      descriptionKey: "industry.ports.desc",
      serviceKeys: ["industry.ports.service1", "industry.ports.service2", "industry.ports.service3"]
    },
    {
      icon: <Factory className="h-8 w-8 text-secondary" />,
      titleKey: "industry.chemical.title",
      descriptionKey: "industry.chemical.desc",
      serviceKeys: ["industry.chemical.service1", "industry.chemical.service2", "industry.chemical.service3"]
    },
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      titleKey: "industry.energy.title",
      descriptionKey: "industry.energy.desc",
      serviceKeys: ["industry.energy.service1", "industry.energy.service2", "industry.energy.service3"]
    },
    {
      icon: <Droplets className="h-8 w-8 text-secondary" />,
      titleKey: "industry.oil.title",
      descriptionKey: "industry.oil.desc",
      serviceKeys: ["industry.oil.service1", "industry.oil.service2", "industry.oil.service3"]
    },
    {
      icon: <Truck className="h-8 w-8 text-primary" />,
      titleKey: "industry.transport.title",
      descriptionKey: "industry.transport.desc",
      serviceKeys: ["industry.transport.service1", "industry.transport.service2", "industry.transport.service3"]
    },
    {
      icon: <Building className="h-8 w-8 text-secondary" />,
      titleKey: "industry.manufacturing.title",
      descriptionKey: "industry.manufacturing.desc",
      serviceKeys: ["industry.manufacturing.service1", "industry.manufacturing.service2", "industry.manufacturing.service3"]
    }
  ];
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold text-primary mb-4">
            {t('industry.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('industry.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {industries.map((industry, index) => (
            <Card 
              key={industry.titleKey}
              className="shadow-soft hover:shadow-medium transition-all duration-300 animate-slide-up border-0 group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-4">
                <div className="mb-4 p-3 bg-accent rounded-full w-fit group-hover:scale-110 transition-transform duration-300">
                  {industry.icon}
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">
                  {t(industry.titleKey)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {t(industry.descriptionKey)}
                </p>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-primary uppercase tracking-wide">
                    {t('industry.services')}
                  </h4>
                  <ul className="space-y-1">
                    {industry.serviceKeys.map((serviceKey, serviceIndex) => (
                      <li 
                        key={serviceIndex}
                        className="text-sm text-muted-foreground flex items-center"
                      >
                        <div className="w-1.5 h-1.5 bg-secondary rounded-full mr-2 flex-shrink-0" />
                        {t(serviceKey)}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IndustrySection;