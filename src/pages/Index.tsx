import SEO from '@/components/SEO';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroStatic from '@/components/sections/HeroStatic';
import ServicesOverview from '@/components/sections/ServicesOverview';
import StatsSection from '@/components/sections/StatsSection';
import OperationsGallery from '@/components/sections/OperationsGallery';
import TeamInAction from '@/components/sections/TeamInAction';
import IndustrySection from '@/components/sections/IndustrySection';
import TestimonialsSection from '@/components/sections/TestimonialsSection';
import CTASection from '@/components/sections/CTASection';
import WhatsAppButton from '@/components/sections/WhatsAppButton';

const Index = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Sirius Ambiental",
    "description": "Especialistas em contenção, PEI, PAE, emergências ambientais marítimas e terrestres, monitoramento e consultoria para indústrias e portos.",
    "url": "https://99cf4b81-294f-4dd1-9155-3a6e22e78c92.lovableproject.com",
    "logo": "https://99cf4b81-294f-4dd1-9155-3a6e22e78c92.lovableproject.com/logo-sirius.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+55-81-99822-1113",
      "contactType": "emergency",
      "availableLanguage": ["Portuguese", "English"]
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "PE-024, Rota dos Coqueiros, 4165, Torre 6 Apt. 702",
      "addressLocality": "Cabo de Santo Agostinho",
      "addressRegion": "PE",
      "addressCountry": "BR"
    },
    "services": [
      "Environmental Emergency Response",
      "Oil Spill Containment",
      "Maritime Emergency Response",
      "Environmental Consulting",
      "Emergency Response Planning",
      "Environmental Monitoring"
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO structuredData={structuredData} />
      <Header />
      <main className="pt-20">
        <HeroStatic />
        <ServicesOverview />
        <StatsSection />
        <OperationsGallery />
        <TeamInAction />
        <IndustrySection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
