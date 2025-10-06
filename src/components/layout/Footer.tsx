import { Mail, Phone, MapPin, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import logoSiriusBranca from '@/assets/logo-sirius-branca.png';

const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center">
              <img src={logoSiriusBranca} alt="Sirius Ambiental" className="h-[75px] w-auto" />
            </div>
            <p className="text-sm opacity-90 leading-relaxed">
              {t('footer.description')}
            </p>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium">Nos siga:</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-3 h-auto hover:bg-white/10 hover:scale-110 transition-all duration-200 border border-white/20 rounded-lg"
                asChild
              >
                <a 
                  href="https://www.instagram.com/sirius.ambiental" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Siga-nos no Instagram"
                  className="flex items-center space-x-2"
                >
                  <Instagram className="h-5 w-5" />
                  <span className="text-sm font-medium">Instagram</span>
                </a>
              </Button>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('footer.services')}</h3>
            <ul className="space-y-2 text-sm opacity-90">
              <li>
                <Link to="/servicos" className="hover:opacity-100 transition-opacity">
                  {t('services.containment.title')}
                </Link>
              </li>
              <li>
                <Link to="/servicos" className="hover:opacity-100 transition-opacity">
                  {t('services.pei.title')}
                </Link>
              </li>
              <li>
                <Link to="/servicos" className="hover:opacity-100 transition-opacity">
                  {t('services.emergency.title')}
                </Link>
              </li>
              <li>
                <Link to="/servicos" className="hover:opacity-100 transition-opacity">
                  {t('services.monitoring.title')}
                </Link>
              </li>
              <li>
                <Link to="/servicos" className="hover:opacity-100 transition-opacity">
                  {t('services.consulting.title')}
                </Link>
              </li>
              <li>
                <Link to="/servicos" className="hover:opacity-100 transition-opacity">
                  {t('services.salvage.title')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2 text-sm opacity-90">
              <li>
                <Link to="/sobre" className="hover:opacity-100 transition-opacity">
                  {t('footer.aboutUs')}
                </Link>
              </li>
              <li>
                <Link to="/contato" className="hover:opacity-100 transition-opacity">
                  {t('footer.workWithUs')}
                </Link>
              </li>
              <li>
                <Link to="/contato" className="hover:opacity-100 transition-opacity">
                  {t('footer.faq')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('footer.contact')}</h3>
            <div className="space-y-3 text-sm opacity-90">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>+55 (81) 99822-1113</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>contato@siriusport.com.br</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>
                  PE-024, Rota dos Coqueiros, 4165<br />
                  Torre 6 Apt. 702 - Paiva<br />
                  Cabo de Santo Agostinho - PE
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm opacity-90">
          <div className="text-center md:text-left">
            <p>{t('footer.copyright')}</p>
            <p>{t('footer.rights')}</p>
          </div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/politica-privacidade" className="hover:opacity-100 transition-opacity">
              {t('footer.privacy')}
            </Link>
            <Link to="/termos-uso" className="hover:opacity-100 transition-opacity">
              {t('footer.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;