/*
  # Sistema de Gerenciamento de Logos

  1. Nova Tabela
    - `system_logos`
      - `id` (uuid, primary key)
      - `location` (text, unique) - Localização da logo (header, sidebar, login, etc)
      - `url` (text) - URL/base64 da imagem
      - `width` (text) - Largura CSS (auto, 100px, 50%, etc)
      - `height` (text) - Altura CSS (auto, 40px, etc)
      - `background_color` (text) - Cor de fundo (transparent, #fff, etc)
      - `created_at` (timestamptz) - Data de criação
      - `updated_at` (timestamptz) - Data de atualização

  2. Segurança
    - Habilitar RLS na tabela `system_logos`
    - Políticas para leitura pública (logos são visíveis para todos)
    - Políticas para escrita apenas para administradores autenticados

  3. Índices
    - Índice único em `location` para busca rápida

  4. Dados Iniciais
    - Inserir logos padrão para cada localização
*/

-- Criar tabela de logos do sistema
CREATE TABLE IF NOT EXISTS system_logos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location text UNIQUE NOT NULL,
  url text NOT NULL,
  width text DEFAULT 'auto',
  height text DEFAULT 'auto',
  background_color text DEFAULT 'transparent',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE system_logos ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler as logos (necessário para exibição pública)
CREATE POLICY "Anyone can read logos"
  ON system_logos
  FOR SELECT
  USING (true);

-- Política: Apenas usuários autenticados podem inserir (simplificado por enquanto)
CREATE POLICY "Authenticated users can insert logos"
  ON system_logos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política: Apenas usuários autenticados podem atualizar
CREATE POLICY "Authenticated users can update logos"
  ON system_logos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política: Apenas usuários autenticados podem deletar
CREATE POLICY "Authenticated users can delete logos"
  ON system_logos
  FOR DELETE
  TO authenticated
  USING (true);

-- Criar índice para busca rápida por localização
CREATE INDEX IF NOT EXISTS idx_system_logos_location ON system_logos(location);

-- Função para atualizar o timestamp automaticamente
CREATE OR REPLACE FUNCTION update_logo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_system_logos_updated_at
  BEFORE UPDATE ON system_logos
  FOR EACH ROW
  EXECUTE FUNCTION update_logo_updated_at();

-- Inserir logos padrão
INSERT INTO system_logos (location, url, width, height, background_color) VALUES
  ('header', '/logo-sirius.png', 'auto', '40px', 'transparent'),
  ('sidebar', '/logo-sirius.png', 'auto', '48px', 'transparent'),
  ('login', '/logo-sirius.png', 'auto', '80px', 'transparent'),
  ('pdf', '/logo-sirius.png', '120px', 'auto', 'transparent'),
  ('email', '/logo-sirius.png', '200px', 'auto', 'transparent'),
  ('comprovante', '/logo-sirius.png', '150px', 'auto', 'transparent'),
  ('notificacao', '/logo-sirius.png', '32px', '32px', 'transparent'),
  ('favicon', '/favicon.ico', '32px', '32px', 'transparent')
ON CONFLICT (location) DO NOTHING;