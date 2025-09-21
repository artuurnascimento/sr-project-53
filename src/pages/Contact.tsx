import SEO from '@/components/SEO';
import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FAQ from '@/components/sections/FAQ';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
const Contact = () => {
  const { t } = useLanguage();
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "mainEntity": {
      "@type": "Organization",
      "name": "Sirius Ambiental",
      "telephone": "+55-81-99822-1113",
      "email": "contato@siriusport.com.br",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "PE-024, Rota dos Coqueiros, 4165, Torre 6 Apt. 702",
        "addressLocality": "Cabo de Santo Agostinho",
        "addressRegion": "PE",
        "postalCode": "54518-605",
        "addressCountry": "BR"
      },
      "openingHours": "Mo-Fr 08:00-18:00"
    }
  };
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    message: '',
    honeypot: '' // Campo honeypot oculto
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    toast
  } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('https://jptzhehjndxncjplkjdj.supabase.co/functions/v1/send-contact-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: t('contact.success'),
          description: t('contact.successDesc')
        });
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          service: '',
          message: '',
          honeypot: ''
        });
      } else {
        const errorMsg = result.details ? result.details.join(', ') : result.error;
        throw new Error(errorMsg || 'Erro ao enviar mensagem');
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      toast({
        title: t('contact.error'),
        description: t('contact.errorDesc'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  return <div className="min-h-screen bg-background">
      <SEO 
        title={t('contact.title')}
        description={t('contact.subtitle')}
        keywords="contato sirius ambiental, emergência 24h, telefone emergência, email contato, endereço empresa, formulário contato"
        type="website"
        structuredData={structuredData}
      />
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 gradient-hero">
        <div className="container mx-auto px-4">
          <div className="text-center text-white animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              {t('contact.title')}
            </h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto leading-relaxed">
              {t('contact.subtitle')}
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-accent">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-soft border-0">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {t('contact.formTitle')}
                  </CardTitle>
                  <CardDescription>
                    {t('contact.formSubtitle')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">{t('contact.name')} *</Label>
                        <Input id="name" value={formData.name} onChange={e => handleChange('name', e.target.value)} required className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="email">{t('contact.email')} *</Label>
                        <Input id="email" type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} required className="mt-1" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">{t('contact.phone')} *</Label>
                        <Input id="phone" value={formData.phone} onChange={e => handleChange('phone', e.target.value)} required className="mt-1" placeholder="(11) 99999-9999" />
                      </div>
                      <div>
                        <Label htmlFor="company">{t('contact.company')}</Label>
                        <Input id="company" value={formData.company} onChange={e => handleChange('company', e.target.value)} className="mt-1" />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="service">{t('contact.service')}</Label>
                      <Select value={formData.service} onValueChange={value => handleChange('service', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={t('contact.servicePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="barreiras">{t('contact.services.containment')}</SelectItem>
                          <SelectItem value="emergencias">{t('contact.services.maritime')}</SelectItem>
                          <SelectItem value="pei-pae">{t('contact.services.pei')}</SelectItem>
                          <SelectItem value="monitoramento">{t('contact.services.monitoring')}</SelectItem>
                          <SelectItem value="consultoria">{t('contact.services.consulting')}</SelectItem>
                          <SelectItem value="salvatagem">{t('contact.services.salvage')}</SelectItem>
                          <SelectItem value="outros">{t('contact.services.others')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="message">{t('contact.message')} *</Label>
                      <Textarea id="message" value={formData.message} onChange={e => handleChange('message', e.target.value)} required className="mt-1 min-h-32" placeholder={t('contact.messagePlaceholder')} />
                    </div>

                    {/* Campo honeypot - oculto dos usuários */}
                    <input
                      type="text"
                      name="honeypot"
                      value={formData.honeypot}
                      onChange={e => handleChange('honeypot', e.target.value)}
                      style={{ display: 'none' }}
                      tabIndex={-1}
                      autoComplete="off"
                    />

                    <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary-hover" disabled={isSubmitting}>
                      {isSubmitting ? t('contact.sending') : <>
                          <Send className="mr-2 h-4 w-4" />
                          {t('contact.send')}
                        </>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              
              {/* Emergency Contact */}
              <Card className="shadow-soft border-0 bg-red-50 border-red-200">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-red-500 rounded-full mr-4">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-800">{t('contact.emergency')}</h3>
                      <p className="text-red-600 text-sm">{t('contact.emergencyDesc')}</p>
                    </div>
                  </div>
                    <Button variant="outline" className="w-full border-red-300 text-red-700 hover:bg-red-100" asChild>
                      <a href="tel:+558199822-1113">(81) 99822-1113</a>
                    </Button>
                </CardContent>
              </Card>

              {/* General Contact */}
              <Card className="shadow-soft border-0">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-primary mr-3" />
                    <div>
                      <p className="font-medium">E-mail</p>
                      <a href="mailto:contato@siriusport.com.br" className="text-primary hover:underline">contato@siriusport.com.br</a>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-primary mr-3" />
                    <div>
                      <p className="font-medium">{t('contact.commercialPhone')}</p>
                      <a href="tel:+558199822-1113" className="text-primary hover:underline">
                        (81) 99822-1113
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-primary mr-3" />
                    <div>
                      <p className="font-medium">{t('contact.address')}</p>
                       <p className="text-muted-foreground text-sm">
                         PE-024, Rota dos Coqueiros, 4165<br />
                         Torre 6 Apt. 702 - Paiva<br />
                         Cabo de Santo Agostinho - PE
                       </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-primary mr-3" />
                    <div>
                      <p className="font-medium">{t('contact.businessHours')}</p>
                      <p className="text-muted-foreground text-sm">
                        {t('contact.businessHoursText').split('\n').map((line, index) => (
                          <span key={index}>
                            {line}
                            {index === 0 && <br />}
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Features */}
              <Card className="shadow-soft border-0 bg-secondary/5">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 text-secondary">{t('contact.whyChoose')}</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-secondary mr-2" />
                      {t('contact.response2h')}
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-secondary mr-2" />
                      {t('contact.northeastCoverage')}
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-secondary mr-2" />
                      {t('contact.isoCertifications')}
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-secondary mr-2" />
                      {t('contact.qualifiedTeam')}
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <FAQ />

      <Footer />
    </div>;
};
export default Contact;