"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MaplibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { mapConfig } from "@/lib/mapConfig";
import { useMapStore } from "@/store/useMapStore";
import RoutesLayer from "./RoutesLayer";
import PlacesLayer from "./PlacesLayer";

export default function MapContainer() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const [mapInstance, setMapInstance] = useState<MaplibreMap | null>(null);
  
  const { fetchMapData, isLoading: dataLoading, error, selectedPlace } = useMapStore();

  useEffect(() => {
    console.log("[MapContainer] 开始加载地图 API 数据...");
    fetchMapData();
  }, [fetchMapData]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return; 
    // 如果存在严重错误，且我们不打算初始化地图，也可以提前返回。但通常我们可以先加载底图。

    console.log("[MapContainer] 开始初始化 MapLibre 实例...");
    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: mapConfig.styleUrl,
        center: mapConfig.initialCenter,
        zoom: mapConfig.initialZoom,
        minZoom: mapConfig.minZoom,
        maxZoom: mapConfig.maxZoom,
        maxBounds: mapConfig.maxBounds,
        attributionControl: false,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

      map.on("load", () => {
        console.log("[MapContainer] 地图引擎加载完成 (load 事件)");
        setMapInstance(map);
      });

      mapRef.current = map;

      return () => {
        console.log("[MapContainer] 卸载地图实例...");
        map.remove();
        mapRef.current = null;
        setMapInstance(null);
      };
    } catch (err) {
      console.error("[MapContainer] 地图初始化异常:", err);
    }
  }, []);

  useEffect(() => {
    if (mapInstance && selectedPlace) {
      mapInstance.flyTo({
        center: selectedPlace.coordinates,
        zoom: mapInstance.getZoom() < 5 ? 5 : mapInstance.getZoom(),
        speed: 1.2,
        curve: 1.4,
        essential: true
      });
    }
  }, [selectedPlace, mapInstance]);

  const isFullyLoaded = mapInstance !== null && !dataLoading && !error;

  return (
    <div className="absolute inset-0 bg-slate-50 w-full h-full">
      <div className="absolute inset-0 w-full h-full" ref={mapContainerRef} />
      
      {dataLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm z-10 w-full h-full transition-opacity">
          <div className="flex flex-col items-center gap-3 text-slate-600">
            <div className="w-8 h-8 border-4 border-slate-300 border-t-amber-600 rounded-full animate-spin shadow-sm" />
            <span className="text-sm font-medium tracking-wider">正在加载丝路风情...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/90 backdrop-blur-md z-20 w-full h-full">
          <div className="flex flex-col items-center gap-4 text-slate-700 bg-white p-8 rounded-2xl shadow-xl max-w-sm text-center border border-slate-100">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg">数据加载失败</h3>
            <p className="text-sm text-slate-500">{error}</p>
            <button 
              onClick={() => fetchMapData()}
              className="mt-2 px-6 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-sm font-medium rounded-full shadow-md transition-all active:scale-95"
            >
              重新加载
            </button>
          </div>
        </div>
      )}

      {isFullyLoaded && mapInstance && (
        <>
          <RoutesLayer map={mapInstance} />
          <PlacesLayer map={mapInstance} />
        </>
      )}
    </div>
  );
}
