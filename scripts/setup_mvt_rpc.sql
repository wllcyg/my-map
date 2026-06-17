-- 执行此脚本以在 Supabase 中创建 MVT 切片生成函数

-- 1. 创建地点 (Places) MVT 函数
CREATE OR REPLACE FUNCTION public.get_places_mvt(z integer, x integer, y integer)
RETURNS bytea
AS $$
DECLARE
  mvt bytea;
BEGIN
  SELECT ST_AsMVT(tile, 'places', 4096, 'geom') INTO mvt
  FROM (
    SELECT
      id,
      name,
      type,
      importance,
      array_to_string(periods, ',') AS periods_str,
      ST_AsMVTGeom(
        ST_Transform(geom, 3857),
        ST_TileEnvelope(z, x, y),
        4096,
        256,
        true
      ) AS geom
    FROM public.places
    WHERE geom && ST_Transform(ST_TileEnvelope(z, x, y), 4326)
  ) AS tile;

  RETURN mvt;
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE;

-- 2. 创建路线 (Routes) MVT 函数
CREATE OR REPLACE FUNCTION public.get_routes_mvt(z integer, x integer, y integer)
RETURNS bytea
AS $$
DECLARE
  mvt bytea;
BEGIN
  SELECT ST_AsMVT(tile, 'routes', 4096, 'geom') INTO mvt
  FROM (
    SELECT
      id,
      name,
      type,
      array_to_string(periods, ',') AS periods_str,
      ST_AsMVTGeom(
        ST_Transform(geometry, 3857),
        ST_TileEnvelope(z, x, y),
        4096,
        256,
        true
      ) AS geom
    FROM public.routes
    WHERE geometry && ST_Transform(ST_TileEnvelope(z, x, y), 4326)
  ) AS tile;

  RETURN mvt;
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE;
