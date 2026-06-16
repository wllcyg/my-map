export type PeriodId = "han" | "tang" | "mongol";

export type PlaceType = "capital" | "oasis" | "port" | "gate" | "ruin" | "other";

export type Importance = "high" | "medium" | "low";

export type Certainty = "confirmed" | "approximate" | "disputed";

export interface PeriodNote {
  period_id: PeriodId;
  note: string;
}

export interface Place {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  type: PlaceType;
  importance: Importance;
  coordinates: [number, number]; // [longitude, latitude]
  periods: PeriodId[];
  period_notes?: PeriodNote[];
  certainty: Certainty;
  related_place_ids?: string[];
  source_ids?: string[];
}

export type RouteType = "land" | "sea";

export interface Route {
  id: string;
  name: string;
  type: RouteType;
  coordinates: [number, number][]; // 简化的 LineString 坐标数组
  periods: PeriodId[];
  description?: string;
  source_ids?: string[];
}

export interface Period {
  id: PeriodId;
  name: string;
  range: string;
  description: string;
}

export interface Source {
  id: string;
  title: string;
  author?: string;
  url?: string;
  description?: string;
}

export interface MapData {
  places: Place[];
  routes: Route[];
  periods: Period[];
  sources: Source[];
}
