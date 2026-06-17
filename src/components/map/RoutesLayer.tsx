import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MaplibreMap } from "maplibre-gl";
import { useMapStore } from "@/store/useMapStore";

interface RoutesLayerProps {
  map: MaplibreMap;
}

export default function RoutesLayer({ map }: RoutesLayerProps) {
  const { activePeriod, setSelectedRoute, selectedRoute, data } = useMapStore();
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [styleLoadedTime, setStyleLoadedTime] = useState(0);
  const hoveredStateId = useRef<string | null>(null);
  const prevSelectedRouteId = useRef<string | null>(null);

  useEffect(() => {
    const addLayers = () => {
      if (!map.getStyle()) return;

      if (!map.getSource("silk-road-routes-mvt")) {
        map.addSource("silk-road-routes-mvt", {
          type: "vector",
          tiles: [`${window.location.origin}/api/tiles/routes/{z}/{x}/{y}`],
          minzoom: 2,
          maxzoom: 14,
          promoteId: "id",
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
      const routeId = feature.id as string;
      
      if (routeId) {
        if (hoveredStateId.current && hoveredStateId.current !== routeId) {
          map.setFeatureState(
            { source: 'silk-road-routes-mvt', sourceLayer: 'routes', id: hoveredStateId.current },
            { hover: false }
          );
        }
        hoveredStateId.current = routeId;
        map.setFeatureState(
          { source: 'silk-road-routes-mvt', sourceLayer: 'routes', id: hoveredStateId.current },
          { hover: true }
        );

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
      if (hoveredStateId.current) {
        map.setFeatureState(
          { source: 'silk-road-routes-mvt', sourceLayer: 'routes', id: hoveredStateId.current },
          { hover: false }
        );
        hoveredStateId.current = null;
      }
      if (popupRef.current) {
        popupRef.current.remove();
      }
    };

    const handleClick = (e: any) => {
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      const routeId = feature.id as string;
      
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

  // Synchronize selectedRoute to feature state
  useEffect(() => {
    if (!map.getSource("silk-road-routes-mvt") || !styleLoadedTime) return;
    
    if (prevSelectedRouteId.current) {
      map.setFeatureState(
        { source: 'silk-road-routes-mvt', sourceLayer: 'routes', id: prevSelectedRouteId.current },
        { selected: false }
      );
    }
    
    const currentId = selectedRoute?.id || null;
    if (currentId) {
      map.setFeatureState(
        { source: 'silk-road-routes-mvt', sourceLayer: 'routes', id: currentId },
        { selected: true }
      );
    }
    prevSelectedRouteId.current = currentId;
  }, [selectedRoute, map, styleLoadedTime]);

  // Update paint properties based on active period and feature states
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

    if (map.getStyle()) {
      map.setPaintProperty("routes-line", "line-width", [
        "case",
        ["boolean", ["feature-state", "selected"], false], 4,
        ["==", isActiveExpr, true], 4,
        2
      ]);

      map.setPaintProperty("routes-line", "line-opacity", [
        "case",
        ["boolean", ["feature-state", "hover"], false], 1.0,
        ["boolean", ["feature-state", "selected"], false], 1.0,
        ["==", isActiveExpr, true], 0.8,
        0.1
      ]);
    }
  }, [map, activePeriod, styleLoadedTime]);

  return null;
}
