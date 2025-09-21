import { ArrowRight, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

const CTASection = () => {
  const { t } = useLanguage();
  
  return (
    <section className="py-20 gradient-hero relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M20 0L0 20L20 40L40 20L20 0Z'/%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('cta.title')}
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            {t('cta.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Emergency Contact */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white animate-scale-in">
            <CardContent className="p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="p-3 bg-red-500 rounded-full">
                  <Phone className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('cta.emergency.title')}</h3>
              <p className="text-white/80 mb-4 text-sm">{t('cta.emergency.desc')}</p>
              <Button variant="cta-emergency" className="w-full" asChild>
                <a href="tel:+5581998221113">
                  (81) 99822-1113
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* General Contact */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white animate-scale-in" style={{
            animationDelay: '150ms'
          }}>
            <CardContent className="p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="p-3 bg-secondary rounded-full">
                  <Mail className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('cta.contact.title')}</h3>
              <p className="text-white/80 mb-4 text-sm">
                {t('cta.contact.desc')}
              </p>
              <Button variant="outline-light" className="w-full" asChild>
                <a href="/contato">
                  {t('cta.contact.title')}
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Quote Request */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white animate-scale-in" style={{
            animationDelay: '300ms'
          }}>
            <CardContent className="p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="p-3 bg-primary rounded-full">
                  <ArrowRight className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('cta.quote.title')}</h3>
              <p className="text-white/80 mb-4 text-sm">
                {t('cta.quote.desc')}
              </p>
              <Button variant="cta-primary" className="w-full" asChild>
                <a href="/contato">
                  {t('cta.quote.button')}
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12 animate-fade-in" style={{
          animationDelay: '450ms'
        }}>
          <p className="text-white/80 text-sm">
            {t('cta.footer')}
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;