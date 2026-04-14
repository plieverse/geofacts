-- GeoFacts Seed Data — alleen uitvoeren als de tabel nog leeg is
INSERT INTO topics (name)
SELECT v.name FROM (VALUES
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
) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM topics LIMIT 1)
ON CONFLICT (name) DO NOTHING;
