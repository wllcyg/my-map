import { useEffect } from "react";
import { Map as MaplibreMap, GeoJSONSource } from "maplibre-gl";
import { useMapStore } from "@/store/useMapStore";
import { isPlaceInPeriod } from "@/lib/periodFilter";

interface PlacesLayerProps {
  map: MaplibreMap;
}

export default function PlacesLayer({ map }: PlacesLayerProps) {
  const { data, activePeriod } = useMapStore();

  useEffect(() => {
    if (!data) return;

    const activePeriodOrNull = activePeriod === "all" ? null : activePeriod;

    // 每次数据或时期变化时，重新构造 GeoJSON，用 periodFilter 计算是否激活
    const geojson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: data.places.map((place) => {
        const isActive = isPlaceInPeriod(place, activePeriodOrNull);
        return {
          type: "Feature",
          properties: {
            id: place.id,
            name: place.name,
            type: place.type,
            importance: place.importance,
            isActive,
          },
          geometry: {
            type: "Point",
            coordinates: place.coordinates,
          },
        };
      }),
    };

    if (!map.getSource("silk-road-places")) {
      map.addSource("silk-road-places", {
        type: "geojson",
        data: geojson,
      });

      // 节点圆圈图层
      map.addLayer({
        id: "places-circle",
        type: "circle",
        source: "silk-road-places",
        paint: {
          // 根据重要性设置圆圈大小
          "circle-radius": [
            "match",
            ["get", "importance"],
            "high", 8,
            "medium", 6,
            "low", 4,
            6, // 默认大小
          ],
          "circle-color": "#ef4444", // red-500
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          // 非当前时期节点半透明
          "circle-opacity": ["case", ["==", ["get", "isActive"], true], 1, 0.3],
          "circle-stroke-opacity": ["case", ["==", ["get", "isActive"], true], 1, 0.3],
        },
      });

      // 节点文本图层
      map.addLayer({
        id: "places-label",
        type: "symbol",
        source: "silk-road-places",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          "text-size": 12,
        },
        paint: {
          "text-color": "#334155", // slate-700
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
          // 文本同样设置透明度
          "text-opacity": ["case", ["==", ["get", "isActive"], true], 1, 0.3],
        },
      });
    } else {
      (map.getSource("silk-road-places") as GeoJSONSource).setData(geojson);
    }
  }, [map, data, activePeriod]);

  useEffect(() => {
    // 处理交互事件
    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    
    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    const handleClick = (e: any) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const placeId = feature.properties.id;
        const selected = data?.places.find(p => p.id === placeId);
        if (selected) {
          useMapStore.getState().setSelectedPlace(selected);
        }
      }
    };

    // 绑定事件
    map.on("mouseenter", "places-circle", handleMouseEnter);
    map.on("mouseleave", "places-circle", handleMouseLeave);
    map.on("click", "places-circle", handleClick);
    
    // 文本层也绑定，避免点到文字没反应
    map.on("mouseenter", "places-label", handleMouseEnter);
    map.on("mouseleave", "places-label", handleMouseLeave);
    map.on("click", "places-label", handleClick);

    return () => {
      map.off("mouseenter", "places-circle", handleMouseEnter);
      map.off("mouseleave", "places-circle", handleMouseLeave);
      map.off("click", "places-circle", handleClick);

      map.off("mouseenter", "places-label", handleMouseEnter);
      map.off("mouseleave", "places-label", handleMouseLeave);
      map.off("click", "places-label", handleClick);

      if (map.getStyle()) {
        if (map.getLayer("places-label")) map.removeLayer("places-label");
        if (map.getLayer("places-circle")) map.removeLayer("places-circle");
        if (map.getSource("silk-road-places")) map.removeSource("silk-road-places");
      }
    };
  }, [map, data]);

  return null;
}
