import { supabase } from '@/integrations/supabase/client';

export interface LogoConfig {
  id?: string;
  location: string;
  url: string;
  width: string;
  height: string;
  backgroundColor: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LogoLocationInfo {
  label: string;
  icon: string;
  description: string;
  recommendedSize: string;
  recommendedFormat: string;
  aspectRatio: string;
}

export const logoLocations: Record<string, LogoLocationInfo> = {
  header: {
    label: 'Header/Navbar',
    icon: '📱',
    description: 'Logo exibida no topo de todas as páginas',
    recommendedSize: '40px altura',
    recommendedFormat: 'PNG ou SVG com fundo transparente',
    aspectRatio: 'Horizontal (3:1 ou 4:1)',
  },
  sidebar: {
    label: 'Sidebar',
    icon: '📊',
    description: 'Logo na barra lateral de navegação',
    recommendedSize: '48px altura',
    recommendedFormat: 'PNG ou SVG',
    aspectRatio: 'Quadrado ou horizontal (2:1)',
  },
  login: {
    label: 'Tela de Login',
    icon: '🔐',
    description: 'Logo principal na página de autenticação',
    recommendedSize: '80-100px altura',
    recommendedFormat: 'PNG ou SVG de alta qualidade',
    aspectRatio: 'Qualquer',
  },
  pdf: {
    label: 'Relatórios PDF',
    icon: '📄',
    description: 'Logo impressa em relatórios e documentos PDF',
    recommendedSize: '120px largura',
    recommendedFormat: 'PNG de alta resolução (300dpi)',
    aspectRatio: 'Horizontal',
  },
  email: {
    label: 'E-mails',
    icon: '📧',
    description: 'Logo enviada em e-mails automáticos',
    recommendedSize: '200px largura',
    recommendedFormat: 'PNG (evite SVG em e-mails)',
    aspectRatio: 'Horizontal',
  },
  comprovante: {
    label: 'Comprovantes de Ponto',
    icon: '📝',
    description: 'Logo em comprovantes de batida de ponto',
    recommendedSize: '150px largura',
    recommendedFormat: 'PNG',
    aspectRatio: 'Horizontal',
  },
  notificacao: {
    label: 'Notificações',
    icon: '🔔',
    description: 'Ícone em notificações do sistema',
    recommendedSize: '32x32px',
    recommendedFormat: 'PNG quadrado',
    aspectRatio: '1:1 (quadrado)',
  },
  favicon: {
    label: 'Favicon',
    icon: '🌐',
    description: 'Ícone da aba do navegador',
    recommendedSize: '32x32px ou 16x16px',
    recommendedFormat: 'ICO, PNG ou SVG',
    aspectRatio: '1:1 (quadrado)',
  },
};

export const loadLogos = async (): Promise<LogoConfig[]> => {
  try {
    const { data, error } = await supabase
      .from('system_logos')
      .select('*')
      .order('location');

    if (error) throw error;

    return data.map(item => ({
      id: item.id,
      location: item.location,
      url: item.url,
      width: item.width,
      height: item.height,
      backgroundColor: item.background_color,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('Erro ao carregar logos:', error);
    return [];
  }
};

export const loadLogo = async (location: string): Promise<LogoConfig | null> => {
  try {
    const { data, error } = await supabase
      .from('system_logos')
      .select('*')
      .eq('location', location)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      location: data.location,
      url: data.url,
      width: data.width,
      height: data.height,
      backgroundColor: data.background_color,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Erro ao carregar logo:', error);
    return null;
  }
};

export const saveLogo = async (location: string, logoData: Omit<LogoConfig, 'id' | 'location' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('system_logos')
      .upsert({
        location,
        url: logoData.url,
        width: logoData.width,
        height: logoData.height,
        background_color: logoData.backgroundColor,
      }, {
        onConflict: 'location',
      });

    if (error) throw error;

    if (location === 'favicon') {
      updateFavicon(logoData.url);
    }

    window.dispatchEvent(new CustomEvent('logos-updated', { detail: { location } }));

    return true;
  } catch (error) {
    console.error('Erro ao salvar logo:', error);
    return false;
  }
};

export const removeLogo = async (location: string): Promise<boolean> => {
  try {
    const defaultUrl = location === 'favicon' ? '/favicon.ico' : '/logo-sirius.png';

    const { error } = await supabase
      .from('system_logos')
      .update({
        url: defaultUrl,
        width: 'auto',
        height: location === 'header' ? '40px' : location === 'sidebar' ? '48px' : location === 'login' ? '80px' : 'auto',
        background_color: 'transparent',
      })
      .eq('location', location);

    if (error) throw error;

    if (location === 'favicon') {
      updateFavicon(defaultUrl);
    }

    window.dispatchEvent(new CustomEvent('logos-updated', { detail: { location } }));

    return true;
  } catch (error) {
    console.error('Erro ao remover logo:', error);
    return false;
  }
};

export const resetAllLogos = async (): Promise<boolean> => {
  try {
    const locations = Object.keys(logoLocations);

    for (const location of locations) {
      await removeLogo(location);
    }

    return true;
  } catch (error) {
    console.error('Erro ao resetar logos:', error);
    return false;
  }
};

const updateFavicon = (url: string) => {
  const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
  link.type = 'image/x-icon';
  link.rel = 'shortcut icon';
  link.href = url;
  document.getElementsByTagName('head')[0].appendChild(link);
};

export const validateLogoFile = (file: File, location: string): { valid: boolean; error?: string } => {
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
  const maxSize = 3 * 1024 * 1024;

  if (location === 'favicon') {
    validTypes.push('image/x-icon', 'image/vnd.microsoft.icon');
  }

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Formato inválido. Use ${location === 'favicon' ? 'ICO, PNG ou SVG' : 'PNG, JPG ou SVG'}.`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Arquivo muito grande. Máximo 3MB.',
    };
  }

  return { valid: true };
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
