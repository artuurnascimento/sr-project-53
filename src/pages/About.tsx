import SEO from '@/components/SEO';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/sections/WhatsAppButton';
import { Shield, Users, Award, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

const About = () => {
  const { t } = useLanguage();
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "mainEntity": {
      "@type": "Organization",
      "name": "Sirius Ambiental",
      "foundingDate": "2008",
      "description": "Empresa especializada em resposta a emergências ambientais, oferecendo soluções completas em contenção, monitoramento e consultoria ambiental.",
      "expertise": [
        "Contenção de Vazamentos",
        "Emergências Marítimas",
        "Planos de Emergência (PEI/PAE)",
        "Monitoramento Ambiental",
        "Consultoria Especializada",
        "Operações de Salvatagem"
      ]
    }
  };
  
  const values = [
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: t('about.values.safety'),
      description: t('about.values.safety.desc')
    },
    {
      icon: <Users className="h-8 w-8 text-secondary" />,
      title: t('about.values.expertise'),
      description: t('about.values.expertise.desc')
    },
    {
      icon: <Award className="h-8 w-8 text-primary" />,
      title: t('about.values.quality'),
      description: t('about.values.quality.desc')
    },
    {
      icon: <Clock className="h-8 w-8 text-secondary" />,
      title: t('about.values.agility'),
      description: t('about.values.agility.desc')
    }
  ];

  return <div className="min-h-screen bg-background">
      <SEO 
        title={t('about.title')}
        description={t('about.subtitle')}
        keywords="sobre sirius ambiental, história empresa, missão visão valores, equipe especializada, experiência emergências ambientais"
        type="website"
        structuredData={structuredData}
      />
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 gradient-hero text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-6 animate-fade-in">
              {t('about.title')}
            </h1>
            <p className="text-xl max-w-3xl mx-auto animate-slide-up">
              {t('about.subtitle')}
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="animate-fade-in">
                <h2 className="text-3xl font-bold text-primary mb-6">{t('about.mission.title')}</h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  {t('about.mission.text')}
                </p>
                
                <h2 className="text-3xl font-bold text-primary mb-6">{t('about.vision.title')}</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {t('about.vision.text')}
                </p>
              </div>

              <div className="animate-slide-up">
                <div className="bg-gradient-accent p-8 rounded-lg shadow-soft">
                  <h3 className="text-2xl font-semibold text-primary mb-6">{t('about.differentials.title')}</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-secondary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-muted-foreground">{t('about.differentials.1')}</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-secondary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-muted-foreground">{t('about.differentials.2')}</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-secondary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-muted-foreground">{t('about.differentials.3')}</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-secondary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-muted-foreground">{t('about.differentials.4')}</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-secondary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-muted-foreground">{t('about.differentials.5')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-gradient-accent">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-4xl font-bold text-primary mb-4">{t('about.values.title')}</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t('about.values.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => <Card key={value.title} className="shadow-soft hover:shadow-medium transition-all duration-300 animate-slide-up border-0 text-center" style={{
              animationDelay: `${index * 100}ms`
            }}>
                  <CardHeader className="pb-4">
                    <div className="mx-auto mb-4 p-3 bg-accent rounded-full w-fit">
                      {value.icon}
                    </div>
                    <CardTitle className="text-xl font-semibold text-foreground">
                      {value.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>)}
            </div>
          </div>
        </section>

        {/* Team Preview */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-primary mb-6 animate-fade-in">
              {t('about.team.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12 animate-slide-up">{t('about.team.subtitle')}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center animate-scale-in">
                <div className="w-24 h-24 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{t('about.team.environmental')}</h3>
                <p className="text-muted-foreground">{t('about.team.environmental.desc')}</p>
              </div>

              <div className="text-center animate-scale-in" style={{
              animationDelay: '150ms'
            }}>
                <div className="w-24 h-24 bg-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Shield className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{t('about.team.technical')}</h3>
                <p className="text-muted-foreground">{t('about.team.technical.desc')}</p>
              </div>

              <div className="text-center animate-scale-in" style={{
              animationDelay: '300ms'
            }}>
                <div className="w-24 h-24 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Award className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{t('about.team.consultants')}</h3>
                <p className="text-muted-foreground">{t('about.team.consultants.desc')}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>;
};
export default About;