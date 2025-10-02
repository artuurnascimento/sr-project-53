import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'service';
  structuredData?: any;
}

const SEO = ({ 
  title, 
  description, 
  keywords, 
  image = 'https://lovable.dev/opengraph-image-p98pqg.png',
  url,
  type = 'website',
  structuredData 
}: SEOProps) => {
  const { language } = useLanguage();
  
  const defaultTitle = language === 'en' 
    ? 'Sirius Ambiental - Environmental Emergency Solutions & Consulting'
    : 'Sirius Ambiental - Soluções em Emergências e Consultoria Ambiental';
    
  const defaultDescription = language === 'en'
    ? 'Specialists in containment, IEP, EAP, maritime and terrestrial environmental emergencies, monitoring and consulting for industries and ports.'
    : 'Especialistas em contenção, PEI, PAE, emergências ambientais marítimas e terrestres, monitoramento e consultoria para indústrias e portos.';
    
  const defaultKeywords = language === 'en'
    ? 'environmental emergency, spill containment, IEP, EAP, environmental consulting, maritime, ports, industry, oil spill response, emergency response'
    : 'emergência ambiental, contenção vazamentos, PEI, PAE, consultoria ambiental, marítimo, portos, indústria, resposta derramamento óleo, resposta emergência';

  const finalTitle = title ? `${title} | Sirius Ambiental` : defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalKeywords = keywords || defaultKeywords;
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="author" content="Sirius Ambiental" />
      <meta name="robots" content="index, follow" />
      <meta name="language" content={language === 'en' ? 'English' : 'Portuguese'} />
      <link rel="canonical" href={currentUrl} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content="Sirius Ambiental" />
      <meta property="og:locale" content={language === 'en' ? 'en_US' : 'pt_BR'} />
      
      {/* Twitter Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@siriusambiental" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={image} />
      
      {/* Additional SEO Tags */}
      <meta name="theme-color" content="#1e40af" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;