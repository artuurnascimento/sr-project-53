import { useState } from 'react';
import { Menu, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import logoSirius from '@/assets/logo-sirius-oficial.png';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'pt' ? 'en' : 'pt');
  };

  const menuItems = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.about'), href: '/sobre' },
    { name: t('nav.services'), href: '/servicos' },
    { name: t('nav.contact'), href: '/contato' },
  ];

  return (
    <header className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-sm border-b shadow-soft">
      <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <a href="/" className="flex items-center">
              <img 
                src={logoSirius} 
                alt="Sirius Ambiental" 
                className="h-12 sm:h-14 md:h-16 lg:h-18 w-auto transition-transform hover:scale-105"
              />
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-8">
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-foreground hover:text-primary transition-colors duration-200 font-medium text-sm lg:text-base"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Mobile Actions - Language & Contact */}
          <div className="flex md:hidden items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center space-x-1 px-2"
            >
              <Globe className="h-4 w-4" />
              <span className="text-xs font-medium">{language.toUpperCase()}</span>
            </Button>
            <Button className="bg-primary hover:bg-primary-hover text-primary-foreground text-xs px-2 py-1" asChild>
              <a href="/contato">
                {t('nav.contactUs')}
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="ml-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {/* Desktop Language Switcher & CTA */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center space-x-1"
            >
              <Globe className="h-4 w-4" />
              <span className="text-sm font-medium">{language.toUpperCase()}</span>
            </Button>
            <Button className="bg-primary hover:bg-primary-hover text-primary-foreground text-sm lg:text-base px-3 lg:px-4" asChild>
              <a href="/contato">
                {t('nav.contactUs')}
              </a>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t animate-fade-in">
            <nav className="flex flex-col space-y-4 mt-4">
              {menuItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-foreground hover:text-primary transition-colors duration-200 font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;