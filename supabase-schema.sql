-- Create cities table
CREATE TABLE cities (
  id TEXT PRIMARY KEY, name TEXT, province TEXT, region TEXT,
  lat DOUBLE PRECISION, lng DOUBLE PRECISION,
  cost_level INTEGER, food_score DOUBLE PRECISION,
  best_months INTEGER[], attractions TEXT[], cuisines TEXT[],
  tags TEXT[], avg_hotel_price INTEGER, transport_hubs JSONB
);
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON cities FOR SELECT USING (true);

-- Insert using: Supabase Dashboard > Table Editor > Import from JSON
-- File: public/data/cities.json in the app folder
