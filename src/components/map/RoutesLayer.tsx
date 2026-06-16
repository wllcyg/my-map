import { useEffect } from "react";
import { Map as MaplibreMap, GeoJSONSource } from "maplibre-gl";
import { useMapStore } from "@/store/useMapStore";
import { isRouteInPeriod } from "@/lib/periodFilter";

interface RoutesLayerProps {
  map: MaplibreMap;
}

export default function RoutesLayer({ map }: RoutesLayerProps) {
  const { data, activePeriod } = useMapStore();

  useEffect(() => {
    if (!data) return;

    const activePeriodOrNull = activePeriod === "all" ? null : activePeriod;

    // 每次数据或时期变化时，重新构造 GeoJSON，用 periodFilter 计算是否激活
    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: data.routes.map((route) => {
        const isActive = isRouteInPeriod(route, activePeriodOrNull);
        return {
          type: "Feature",
          properties: {
            id: route.id,
            type: route.type,
            name: route.name,
            isActive,
          },
          geometry: {
            type: "LineString",
            coordinates: route.coordinates,
          },
        };
      }),
    };

    if (!map.getSource("silk-road-routes")) {
      map.addSource("silk-road-routes", {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: "routes-line",
        type: "line",
        source: "silk-road-routes",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          // 根据类型赋予不同颜色
          "line-color": [
            "match",
            ["get", "type"],
            "land",
            "#d97706", // 陆路 (amber-600)
            "sea",
            "#0284c7", // 海路 (sky-600)
            "#94a3b8", // 默认
          ],
          "line-width": 4,
          // 根据 isActive 切换透明度
          "line-opacity": ["case", ["==", ["get", "isActive"], true], 0.7, 0.15],
        },
      });
    } else {
      (map.getSource("silk-road-routes") as GeoJSONSource).setData(geojson);
    }
  }, [map, data, activePeriod]);

  // 组件卸载时清理图层（如果地图实例还没销毁的话）
  useEffect(() => {
    return () => {
      if (map.getStyle()) {
        if (map.getLayer("routes-line")) map.removeLayer("routes-line");
        if (map.getSource("silk-road-routes")) map.removeSource("silk-road-routes");
      }
    };
  }, [map]);

  return null;
}
