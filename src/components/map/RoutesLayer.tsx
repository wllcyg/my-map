import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MaplibreMap } from "maplibre-gl";
import { useMapStore } from "@/store/useMapStore";

interface RoutesLayerProps {
  map: MaplibreMap;
}

export default function RoutesLayer({ map }: RoutesLayerProps) {
  const { activePeriod, setSelectedRoute, data } = useMapStore();
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [styleLoadedTime, setStyleLoadedTime] = useState(0);

  useEffect(() => {
    const addLayers = () => {
      if (!map.getStyle()) return;

      if (!map.getSource("silk-road-routes-mvt")) {
        map.addSource("silk-road-routes-mvt", {
          type: "vector",
          tiles: [`${window.location.origin}/api/tiles/routes/{z}/{x}/{y}`],
          minzoom: 2,
          maxzoom: 14,
        });
      }

      if (!map.getLayer("routes-line")) {
        map.addLayer({
          id: "routes-line",
          type: "line",
          source: "silk-road-routes-mvt",
          "source-layer": "routes",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": [
              "match",
              ["get", "type"],
              "land", "#d97706",
              "sea", "#0284c7",
              "#94a3b8",
            ],
            "line-width": 2,
            "line-opacity": 0.8,
          },
        });
      }
      
      setStyleLoadedTime(Date.now());
    };

    addLayers();
    map.on("styledata", addLayers);

    popupRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: "route-tooltip"
    });

    const handleMouseMove = (e: any) => {
      if (!e.features || e.features.length === 0) return;
      map.getCanvas().style.cursor = "pointer";
      const feature = e.features[0];
      const routeId = feature.properties.id;
      
      if (routeId) {
        setHoveredRouteId(routeId);
        if (popupRef.current) {
          popupRef.current
            .setLngLat(e.lngLat)
            .setHTML(`<div class="px-2 py-1 text-sm font-medium text-slate-800">${feature.properties.name || "未知路线"}</div>`)
            .addTo(map);
        }
      }
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = "";
      setHoveredRouteId(null);
      if (popupRef.current) {
        popupRef.current.remove();
      }
    };

    const handleClick = (e: any) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      const routeId = feature.properties.id;
      
      if (routeId && data) {
        const route = data.routes.find(r => r.id === routeId);
        if (route) {
          setSelectedRoute(route);
        }
      }
    };

    map.on("mousemove", "routes-line", handleMouseMove);
    map.on("mouseleave", "routes-line", handleMouseLeave);
    map.on("click", "routes-line", handleClick);

    return () => {
      map.off("styledata", addLayers);
      map.off("mousemove", "routes-line", handleMouseMove);
      map.off("mouseleave", "routes-line", handleMouseLeave);
      map.off("click", "routes-line", handleClick);

      if (popupRef.current) {
        popupRef.current.remove();
      }

      if (map.getStyle()) {
        if (map.getLayer("routes-line")) map.removeLayer("routes-line");
        if (map.getSource("silk-road-routes-mvt")) map.removeSource("silk-road-routes-mvt");
      }
    };
  }, [map, data, setSelectedRoute]);

  useEffect(() => {
    if (!map.getLayer("routes-line")) return;

    const activePeriodOrNull = activePeriod === "all" ? null : activePeriod;
    const isActiveExpr = activePeriodOrNull === null
      ? true
      : [
          "any",
          ["!", ["has", "periods_str"]],
          ["==", ["get", "periods_str"], null],
          ["in", activePeriodOrNull, ["get", "periods_str"]]
        ];

    const isHoveredExpr = hoveredRouteId 
      ? ["==", ["get", "id"], hoveredRouteId]
      : false;

    // Use try-catch or style check to avoid errors during style switch
    if (map.getStyle()) {
      map.setPaintProperty("routes-line", "line-width", [
        "case",
        ["==", isActiveExpr, true],
        4, // active
        2  // inactive
      ]);

      map.setPaintProperty("routes-line", "line-opacity", [
        "case",
        ["==", isHoveredExpr, true],
        1.0, // hover
        ["==", isActiveExpr, true],
        0.8, // active
        0.1  // inactive
      ]);
    }
  }, [map, activePeriod, hoveredRouteId, styleLoadedTime]);

  return null;
}
