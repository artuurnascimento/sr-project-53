import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import heroStatic from '@/assets/hero-static.jpg';
import heroStaticMobile from '@/assets/hero-static-mobile.jpg';

const HeroStatic = () => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  return (
    <section className="relative h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={isMobile ? heroStaticMobile : heroStatic}
          alt="Sirius Ambiental - Operações de Contenção Ambiental"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-2xl text-white animate-fade-in">
          <p className="text-secondary-foreground text-lg mb-4 font-medium">
            {t('hero.title')}
          </p>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            {t('hero.main.title')}
            <span className="block text-secondary-foreground">{t('hero.main.subtitle')}</span>
          </h1>
          <p className="text-xl mb-8 opacity-90 leading-relaxed">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="cta-primary"
              size="lg" 
              className="px-8 py-3"
              asChild
            >
              <a href="/contato">
                <ArrowRight className="mr-2 h-5 w-5" />
                {t('hero.cta')}
              </a>
            </Button>
            <Button 
              variant="outline-light" 
              size="lg" 
              className="font-semibold px-8 py-3"
            >
              <Play className="mr-2 h-5 w-5" />
              {t('hero.video')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroStatic;