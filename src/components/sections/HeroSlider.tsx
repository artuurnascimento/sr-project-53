import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import heroEnvironmental from '@/assets/hero-environmental.jpg';
import heroMarine from '@/assets/hero-marine.jpg';
import heroIndustrial from '@/assets/hero-industrial.jpg';

interface Slide {
  id: number;
  image: string;
  titleKey: string;
  subtitleKey: string;
  descriptionKey: string;
  ctaKey: string;
  href: string;
}

const slideData: Slide[] = [
  {
    id: 1,
    image: heroEnvironmental,
    titleKey: "slider.slide1.title",
    subtitleKey: "slider.slide1.subtitle", 
    descriptionKey: "slider.slide1.desc",
    ctaKey: "slider.slide1.cta",
    href: "/servicos"
  },
  {
    id: 2,
    image: heroMarine,
    titleKey: "slider.slide2.title",
    subtitleKey: "slider.slide2.subtitle",
    descriptionKey: "slider.slide2.desc", 
    ctaKey: "slider.slide2.cta",
    href: "/cases"
  },
  {
    id: 3,
    image: heroIndustrial,
    titleKey: "slider.slide3.title",
    subtitleKey: "slider.slide3.subtitle",
    descriptionKey: "slider.slide3.desc",
    ctaKey: "slider.slide3.cta", 
    href: "/contato"
  }
];

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const { t } = useLanguage();

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoplay) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideData.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoplay]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slideData.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slideData.length) % slideData.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section 
      className="relative h-screen flex items-center overflow-hidden"
      onMouseEnter={() => setIsAutoplay(false)}
      onMouseLeave={() => setIsAutoplay(true)}
    >
      {/* Slides */}
      <div className="absolute inset-0">
        {slideData.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.image}
              alt={t(slide.titleKey)}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/60 to-transparent" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-2xl text-white animate-fade-in">
          <p className="text-secondary-foreground text-lg mb-4 font-medium">
            {t(slideData[currentSlide].subtitleKey)}
          </p>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            {t(slideData[currentSlide].titleKey)}
          </h1>
          <p className="text-xl mb-8 opacity-90 leading-relaxed">
            {t(slideData[currentSlide].descriptionKey)}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-gray-100 font-semibold px-8 py-3"
              asChild
            >
              <a href={slideData[currentSlide].href}>
                {t(slideData[currentSlide].ctaKey)}
              </a>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white hover:text-primary font-semibold px-8 py-3"
            >
              <Play className="mr-2 h-5 w-5" />
              {t('hero.video')}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20 p-3"
        onClick={prevSlide}
        aria-label={t('slider.prev')}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20 p-3"
        onClick={nextSlide}
        aria-label={t('slider.next')}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
        {slideData.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-white shadow-medium' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`${t('slider.goto')} ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;