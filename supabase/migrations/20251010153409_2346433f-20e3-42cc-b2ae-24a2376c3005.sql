-- Criar tabela de logos do sistema
CREATE TABLE IF NOT EXISTS public.system_logos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  width TEXT NOT NULL DEFAULT 'auto',
  height TEXT NOT NULL DEFAULT 'auto',
  background_color TEXT NOT NULL DEFAULT 'transparent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.system_logos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Todos podem visualizar logos"
  ON public.system_logos
  FOR SELECT
  USING (true);

CREATE POLICY "Apenas admins podem gerenciar logos"
  ON public.system_logos
  FOR ALL
  USING (get_current_user_role() = 'admin')
  WITH CHECK (get_current_user_role() = 'admin');

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_system_logos_updated_at
  BEFORE UPDATE ON public.system_logos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir logos padrão para cada localização
INSERT INTO public.system_logos (location, url, width, height, background_color) VALUES
  ('header', '/logo-sirius.png', 'auto', '40px', 'transparent'),
  ('sidebar', '/logo-sirius.png', 'auto', '48px', 'transparent'),
  ('login', '/logo-sirius.png', 'auto', '80px', 'transparent'),
  ('pdf', '/logo-sirius.png', '120px', 'auto', 'transparent'),
  ('email', '/logo-sirius.png', '200px', 'auto', 'transparent'),
  ('comprovante', '/logo-sirius.png', '150px', 'auto', 'transparent'),
  ('notificacao', '/logo-sirius.png', '32px', '32px', 'transparent'),
  ('favicon', '/favicon.ico', '32px', '32px', 'transparent')
ON CONFLICT (location) DO NOTHING;

-- Criar índice
CREATE INDEX idx_system_logos_location ON public.system_logos(location);

-- Comentários
COMMENT ON TABLE public.system_logos IS 'Gerenciamento de logos do sistema para diferentes localizações';
COMMENT ON COLUMN public.system_logos.location IS 'Localização onde a logo será exibida';
COMMENT ON COLUMN public.system_logos.url IS 'URL ou base64 da logo';
COMMENT ON COLUMN public.system_logos.width IS 'Largura CSS da logo';
COMMENT ON COLUMN public.system_logos.height IS 'Altura CSS da logo';
COMMENT ON COLUMN public.system_logos.background_color IS 'Cor de fundo da logo';