CREATE TABLE IF NOT EXISTS municipios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo_ibge INT NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  capital BOOLEAN NOT NULL DEFAULT FALSE,
  codigo_uf INT NOT NULL,
  location POINT NOT NULL,
  INDEX idx_codigo_ibge (codigo_ibge),
  INDEX idx_nome (nome),
  INDEX idx_codigo_uf (codigo_uf),
  SPATIAL INDEX idx_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;