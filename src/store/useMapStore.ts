import { create } from "zustand";
import { MapData, PeriodId, Place, Route } from "@/types/map";

interface MapState {
  data: MapData | null;
  isLoading: boolean;
  error: string | null;
  activePeriod: PeriodId | "all";
  selectedPlace: Place | null;
  selectedRoute: Route | null;
  theme: "light" | "dark";

  // Actions
  fetchMapData: () => Promise<void>;
  setActivePeriod: (period: PeriodId | "all") => void;
  setSelectedPlace: (place: Place | null) => void;
  setSelectedRoute: (route: Route | null) => void;
  setTheme: (theme: "light" | "dark") => void;
}

export const useMapStore = create<MapState>((set) => ({
  data: null,
  isLoading: true,
  error: null,
  activePeriod: "tang", // Day 3 需求：默认选中唐代
  selectedPlace: null,
  selectedRoute: null,
  theme: "light",

  fetchMapData: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch("/api/map-data");
      if (!response.ok) {
        throw new Error("网络请求失败：" + response.statusText);
      }
      const data = await response.json();
      set({ data, isLoading: false, error: null });
    } catch (error: any) {
      console.error("Failed to fetch map data from API:", error);
      set({ isLoading: false, error: error.message || "未知错误" });
    }
  },

  setActivePeriod: (period) => set({ activePeriod: period }),
  setSelectedPlace: (place) => set({ selectedPlace: place, selectedRoute: null }),
  setSelectedRoute: (route) => set({ selectedRoute: route, selectedPlace: null }),
  setTheme: (theme) => set({ theme }),
}));
