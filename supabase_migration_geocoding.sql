-- Migração para suporte a Geolocalização Exata (Google Maps / Geocoding API)
-- Adiciona latitude (lat) e longitude (lng) na tabela `clientes`

ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS lat NUMERIC(10,8),
ADD COLUMN IF NOT EXISTS lng NUMERIC(11,8);

COMMENT ON COLUMN public.clientes.lat IS 'Latitude exata retornada pela Google Geocoding API';
COMMENT ON COLUMN public.clientes.lng IS 'Longitude exata retornada pela Google Geocoding API';
