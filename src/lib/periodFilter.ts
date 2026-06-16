import { PeriodId, Place, Route } from "@/types/map";

export function isPlaceInPeriod(place: Place, activePeriod: PeriodId | null): boolean {
  if (!activePeriod) return true; // 如果没有选中任何时期，展示全部
  if (!place.periods) return true; // 如果数据没有时期划分，默认也显示
  return place.periods.includes(activePeriod);
}

export function isRouteInPeriod(route: Route, activePeriod: PeriodId | null): boolean {
  if (!activePeriod) return true;
  if (!route.periods) return true;
  return route.periods.includes(activePeriod);
}

/**
 * 获取某个节点在特定时期的专属说明
 */
export function getPlacePeriodNote(place: Place, activePeriod: PeriodId | null): string | null {
  if (!activePeriod || !place.period_notes) return null;
  const noteObj = place.period_notes.find((n) => n.period_id === activePeriod);
  return noteObj ? noteObj.note : null;
}
