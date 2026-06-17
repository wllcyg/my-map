-- 1. 更新已有的 places 数据，将 longitude 和 latitude 组合成 PostGIS 识别的 geom (Point)
UPDATE public.places 
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326) 
WHERE geom IS NULL OR ST_X(geom) != longitude OR ST_Y(geom) != latitude;

-- 2. 更新已有的 routes 数据，将 JSONB 格式的 coordinates 转换为 PostGIS 识别的 geometry (LineString)
UPDATE public.routes 
SET geometry = ST_SetSRID(ST_GeomFromGeoJSON(
    jsonb_build_object(
        'type', 'LineString',
        'coordinates', coordinates
    )::text
), 4326)
WHERE geometry IS NULL;

-- ==========================================
-- 为避免以后插入新数据时再次出现 NULL 的问题
-- 强烈建议创建以下触发器自动同步几何字段
-- ==========================================

-- 3. Places 触发器：自动根据 longitude/latitude 更新 geom
CREATE OR REPLACE FUNCTION public.sync_places_geom()
RETURNS trigger AS $$
BEGIN
  NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_places_geom ON public.places;
CREATE TRIGGER trg_sync_places_geom
BEFORE INSERT OR UPDATE OF longitude, latitude
ON public.places
FOR EACH ROW
EXECUTE FUNCTION public.sync_places_geom();

-- 4. Routes 触发器：自动根据 coordinates 更新 geometry
CREATE OR REPLACE FUNCTION public.sync_routes_geometry()
RETURNS trigger AS $$
BEGIN
  IF NEW.coordinates IS NOT NULL THEN
    NEW.geometry := ST_SetSRID(ST_GeomFromGeoJSON(
        jsonb_build_object(
            'type', 'LineString',
            'coordinates', NEW.coordinates
        )::text
    ), 4326);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_routes_geometry ON public.routes;
CREATE TRIGGER trg_sync_routes_geometry
BEFORE INSERT OR UPDATE OF coordinates
ON public.routes
FOR EACH ROW
EXECUTE FUNCTION public.sync_routes_geometry();
