-- 1. 创建 Periods (活跃时期) 表
CREATE TABLE IF NOT EXISTS periods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  range TEXT NOT NULL,
  description TEXT
);

-- 2. 创建 Sources (文献来源) 表
CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  url TEXT,
  description TEXT
);

-- 3. 创建 Places (地点) 表
CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  aliases TEXT[],
  description TEXT,
  type TEXT NOT NULL,
  importance TEXT NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  periods TEXT[],
  period_notes JSONB,
  certainty TEXT NOT NULL,
  related_place_ids TEXT[],
  source_ids TEXT[]
);

-- 4. 创建 Routes (路线) 表
CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  periods TEXT[],
  description TEXT,
  coordinates JSONB NOT NULL,
  source_ids TEXT[]
);

-- 配置 RLS (Row Level Security)
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

-- 允许公共读取
DROP POLICY IF EXISTS "Allow public read access on periods" ON periods;
CREATE POLICY "Allow public read access on periods" ON periods FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on sources" ON sources;
CREATE POLICY "Allow public read access on sources" ON sources FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on places" ON places;
CREATE POLICY "Allow public read access on places" ON places FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access on routes" ON routes;
CREATE POLICY "Allow public read access on routes" ON routes FOR SELECT USING (true);

-- 【临时放开写入权限】允许插入和更新
DROP POLICY IF EXISTS "Allow public insert on periods" ON periods;
CREATE POLICY "Allow public insert on periods" ON periods FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on periods" ON periods;
CREATE POLICY "Allow public update on periods" ON periods FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public insert on sources" ON sources;
CREATE POLICY "Allow public insert on sources" ON sources FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on sources" ON sources;
CREATE POLICY "Allow public update on sources" ON sources FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public insert on places" ON places;
CREATE POLICY "Allow public insert on places" ON places FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on places" ON places;
CREATE POLICY "Allow public update on places" ON places FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public insert on routes" ON routes;
CREATE POLICY "Allow public insert on routes" ON routes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on routes" ON routes;
CREATE POLICY "Allow public update on routes" ON routes FOR UPDATE USING (true);

-- 5. 空间地理扩展 (PostGIS)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 扩充 places 表
ALTER TABLE public.places 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326);

CREATE INDEX IF NOT EXISTS places_geom_idx ON public.places USING gist(geom);

-- 扩充 routes 表
ALTER TABLE public.routes
ADD COLUMN IF NOT EXISTS geometry geometry(LineString, 4326);

CREATE INDEX IF NOT EXISTS routes_geom_idx ON public.routes USING gist(geometry);
