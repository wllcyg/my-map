import { useEffect } from "react";
import { Map as MaplibreMap, GeoJSONSource } from "maplibre-gl";
import { useMapStore } from "@/store/useMapStore";
import { isPlaceInPeriod } from "@/lib/periodFilter";

interface PlacesLayerProps {
  map: MaplibreMap;
}

export default function PlacesLayer({ map }: PlacesLayerProps) {
  const { data, activePeriod, selectedPlace } = useMapStore();

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
            isSelected: place.id === selectedPlace?.id,
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

      // 节点圆圈外发光图层（用于选中状态）
      map.addLayer({
        id: "places-circle-halo",
        type: "circle",
        source: "silk-road-places",
        paint: {
          "circle-radius": [
            "match",
            ["get", "importance"],
            "high", 14,
            "medium", 12,
            "low", 10,
            12,
          ],
          "circle-color": "#fcd34d", // amber-300
          "circle-opacity": ["case", ["==", ["get", "isSelected"], true], 0.6, 0],
          "circle-blur": 0.5,
        },
      });

      // 节点圆圈图层
      map.addLayer({
        id: "places-circle",
        type: "circle",
        source: "silk-road-places",
        paint: {
          // 根据重要性设置圆圈大小，选中的再微放大
          "circle-radius": [
            "+",
            [
              "match",
              ["get", "importance"],
              "high", 7,
              "medium", 5,
              "low", 3,
              5,
            ],
            ["case", ["==", ["get", "isSelected"], true], 2, 0]
          ],
          // 根据类型赋予节点色彩
          "circle-color": [
            "match",
            ["get", "type"],
            "city", "#ea580c",     // orange-600
            "region", "#059669",   // emerald-600
            "landmark", "#7c3aed", // violet-600
            "#64748b"              // slate-500
          ],
          "circle-stroke-width": ["case", ["==", ["get", "isSelected"], true], 3, 2],
          "circle-stroke-color": ["case", ["==", ["get", "isSelected"], true], "#fcd34d", "#ffffff"],
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
  }, [map, data, activePeriod, selectedPlace]);

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
        if (map.getLayer("places-circle-halo")) map.removeLayer("places-circle-halo");
        if (map.getSource("silk-road-places")) map.removeSource("silk-road-places");
      }
    };
  }, [map, data]);

  return null;
}
