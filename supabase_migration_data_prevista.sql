-- Add data_prevista_recebimento column to cortes table
ALTER TABLE cortes 
ADD COLUMN data_prevista_recebimento DATE;

-- Add index for better query performance
CREATE INDEX idx_cortes_data_prevista ON cortes(data_prevista_recebimento);

-- Update existing records to have a expected delivery date (7 days from send date)
UPDATE cortes 
SET data_prevista_recebimento = data_envio + INTERVAL '7 days'
WHERE data_prevista_recebimento IS NULL AND data_envio IS NOT NULL;
