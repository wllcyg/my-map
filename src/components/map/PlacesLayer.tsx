import { useEffect, useState } from "react";
import { Map as MaplibreMap } from "maplibre-gl";
import { useMapStore } from "@/store/useMapStore";

interface PlacesLayerProps {
  map: MaplibreMap;
}

export default function PlacesLayer({ map }: PlacesLayerProps) {
  const { activePeriod, selectedPlace } = useMapStore();
  const [styleLoadedTime, setStyleLoadedTime] = useState(0);

  useEffect(() => {
    const addLayers = () => {
      if (!map.getStyle()) return;

      if (!map.getSource("silk-road-places-mvt")) {
        map.addSource("silk-road-places-mvt", {
          type: "vector",
          tiles: [`${window.location.origin}/api/tiles/places/{z}/{x}/{y}`],
          minzoom: 2,
          maxzoom: 14,
        });
      }

      const lodFilter: any = [
        "all",
        [
          "step",
          ["zoom"],
          [">=", ["to-number", ["get", "importance"]], 4],
          5, [">=", ["to-number", ["get", "importance"]], 3],
          8, [">=", ["to-number", ["get", "importance"]], 1]
        ],
        [
          "any",
          [">=", ["zoom"], 5],
          ["!=", ["get", "type"], "ruin"]
        ]
      ];

      if (!map.getLayer("places-circle-halo")) {
        map.addLayer({
          id: "places-circle-halo",
          type: "circle",
          source: "silk-road-places-mvt",
          "source-layer": "places",
          filter: lodFilter,
          paint: {
            "circle-radius": [
              "match",
              ["to-number", ["get", "importance"]],
              5, 16,
              4, 12,
              3, 10,
              2, 8,
              1, 6,
              10,
            ],
            "circle-color": "#fcd34d",
            "circle-opacity": 0,
            "circle-blur": 0.5,
          },
        });
      }

      if (!map.getLayer("places-circle")) {
        map.addLayer({
          id: "places-circle",
          type: "circle",
          source: "silk-road-places-mvt",
          "source-layer": "places",
          filter: lodFilter,
          paint: {
            "circle-radius": [
              "match",
              ["to-number", ["get", "importance"]],
              5, 8,
              4, 6,
              3, 4,
              2, 3,
              1, 2,
              4,
            ],
            "circle-color": [
              "match",
              ["get", "type"],
              "metropolis", "#fbbf24",
              "capital", "#fbbf24",
              "oasis", "#10b981",
              "port", "#0ea5e9",
              "checkpoint", "#64748b",
              "ruin", "#a8a29e",
              "#94a3b8"
            ],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 1,
            "circle-stroke-opacity": 1,
          },
        });
      }

      if (!map.getLayer("places-label")) {
        map.addLayer({
          id: "places-label",
          type: "symbol",
          source: "silk-road-places-mvt",
          "source-layer": "places",
          filter: lodFilter,
          layout: {
            "text-field": ["get", "name"],
            "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
            "text-offset": [0, 1.2],
            "text-anchor": "top",
            "text-size": 12,
          },
          paint: {
            "text-color": "#334155",
            "text-halo-color": "#ffffff",
            "text-halo-width": 2,
            "text-opacity": 1,
          },
        });
      }
      
      setStyleLoadedTime(Date.now());
    };

    addLayers();
    map.on("styledata", addLayers);

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
        const selected = useMapStore.getState().data?.places.find(p => p.id === placeId);
        if (selected) {
          useMapStore.getState().setSelectedPlace(selected);
        } else {
          useMapStore.getState().setSelectedPlace({
            id: placeId,
            name: feature.properties.name,
            type: feature.properties.type,
            importance: feature.properties.importance,
            longitude: feature.geometry.coordinates[0],
            latitude: feature.geometry.coordinates[1],
            certainty: "high",
            periods: feature.properties.periods_str ? feature.properties.periods_str.split(',') : [],
            aliases: [],
          } as any);
        }
      }
    };

    map.on("mouseenter", "places-circle", handleMouseEnter);
    map.on("mouseleave", "places-circle", handleMouseLeave);
    map.on("click", "places-circle", handleClick);
    
    map.on("mouseenter", "places-label", handleMouseEnter);
    map.on("mouseleave", "places-label", handleMouseLeave);
    map.on("click", "places-label", handleClick);

    return () => {
      map.off("styledata", addLayers);
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
        if (map.getSource("silk-road-places-mvt")) map.removeSource("silk-road-places-mvt");
      }
    };
  }, [map]);

  useEffect(() => {
    if (!map.getLayer("places-circle")) return;

    const selectedPlaceId = selectedPlace?.id || "";
    const activePeriodOrNull = activePeriod === "all" ? null : activePeriod;

    const isActiveExpr = activePeriodOrNull === null 
      ? true 
      : [
          "any",
          ["!", ["has", "periods_str"]],
          ["==", ["get", "periods_str"], null],
          ["in", activePeriodOrNull, ["get", "periods_str"]]
        ];

    const circleOpacity = ["case", ["==", isActiveExpr, true], 1, 0.3];
    
    if (map.getStyle()) {
      map.setPaintProperty("places-circle", "circle-opacity", circleOpacity);
      map.setPaintProperty("places-circle", "circle-stroke-opacity", circleOpacity);
      map.setPaintProperty("places-label", "text-opacity", circleOpacity);

      map.setPaintProperty("places-circle-halo", "circle-opacity", [
        "case",
        ["==", ["get", "id"], selectedPlaceId],
        0.6,
        0
      ]);
      
      map.setPaintProperty("places-circle", "circle-radius", [
        "+",
        [
          "match",
          ["to-number", ["get", "importance"]],
          5, 8,
          4, 6,
          3, 4,
          2, 3,
          1, 2,
          4,
        ],
        ["case", ["==", ["get", "id"], selectedPlaceId], 2, 0]
      ]);
      map.setPaintProperty("places-circle", "circle-stroke-width", [
        "case",
        ["==", ["get", "id"], selectedPlaceId],
        3,
        2
      ]);
      map.setPaintProperty("places-circle", "circle-stroke-color", [
        "case",
        ["==", ["get", "id"], selectedPlaceId],
        "#fcd34d",
        "#ffffff"
      ]);
    }
  }, [map, activePeriod, selectedPlace, styleLoadedTime]);

  return null;
}
