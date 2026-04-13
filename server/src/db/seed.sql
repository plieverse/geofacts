-- GeoFacts Seed Data

INSERT INTO topics (name) VALUES
  ('Geopolitiek'),
  ('Economie'),
  ('Defensie & Veiligheid'),
  ('Energie & Grondstoffen'),
  ('Technologie'),
  ('Midden-Oosten'),
  ('Rusland / Oekraïne'),
  ('China'),
  ('Verenigde Staten'),
  ('Europa')
ON CONFLICT (name) DO NOTHING;
