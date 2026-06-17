"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMapStore } from "@/store/useMapStore";
import { useEffect, useState } from "react";
import { getPlacePeriodNote } from "@/lib/periodFilter";
import { Star, ScrollText, MapPin, Compass, ShieldCheck, Calendar, ChevronRight, X, Route as RouteIcon } from "lucide-react";
import type { Place } from "@/types/map";

const getTypeLabel = (type: string) => {
  switch (type) {
    case "capital": return "都城";
    case "metropolis": return "都市";
    case "hub": return "枢纽";
    case "port": return "港口";
    case "fortress": return "要塞";
    case "oasis": return "绿洲";
    default: return "地点";
  }
};

const getCertaintyLabel = (certainty: string) => {
  switch (certainty) {
    case "confirmed": return "确考";
    case "probable": return "大概率";
    case "disputed": return "存疑";
    default: return "未知";
  }
};

const getRegionFromCoords = (coords: [number, number]) => {
  if (!coords) return "位置未知";
  const lng = coords[0];
  if (lng > 100) return "东亚 · 中国及其周边";
  if (lng > 70) return "中亚 · 西域及周边";
  if (lng > 40) return "西亚 · 波斯及中东";
  if (lng > 10) return "欧洲 · 地中海沿岸";
  return "欧亚大陆";
};

export default function DetailPanel() {
  const { selectedPlace, setSelectedPlace, selectedRoute, setSelectedRoute, activePeriod, data, theme } = useMapStore();
  const [displayPlace, setDisplayPlace] = useState(selectedPlace);
  const [displayRoute, setDisplayRoute] = useState(selectedRoute);

  useEffect(() => {
    if (selectedPlace) setDisplayPlace(selectedPlace);
    if (selectedRoute) setDisplayRoute(selectedRoute);
  }, [selectedPlace, selectedRoute]);

  const isOpen = !!selectedPlace || !!selectedRoute;
  const isRoute = !!selectedRoute || (!selectedPlace && !!displayRoute);
  const entity = isRoute ? displayRoute : displayPlace;

  const [routeLength, setRouteLength] = useState(0);
  const [placesAlongRoute, setPlacesAlongRoute] = useState<Place[]>([]);

  useEffect(() => {
    if (isRoute && displayRoute && data?.places) {
      setRouteLength(0);
      setPlacesAlongRoute([]);

      let isMounted = true;
      let timer: ReturnType<typeof setTimeout>;
      
      // Defer calculation to prevent UI freezing right after opening the panel
      timer = setTimeout(() => {
        import('@turf/turf').then(turf => {
          if (!isMounted) return;
          
          const line = turf.lineString(displayRoute.coordinates);
          setRouteLength(Math.round(turf.length(line, { units: 'kilometers' })));
          
          // Downsample the line for distance calculation
          let checkLine = line;
          if (displayRoute.coordinates.length > 100) {
            const step = Math.ceil(displayRoute.coordinates.length / 100);
            const sampled = displayRoute.coordinates.filter((_: any, idx: number) => idx % step === 0);
            if (sampled[sampled.length - 1] !== displayRoute.coordinates[displayRoute.coordinates.length - 1]) {
              sampled.push(displayRoute.coordinates[displayRoute.coordinates.length - 1]);
            }
            checkLine = turf.lineString(sampled);
          }

          // Pre-calculate bounding box for fast rejection (50km is roughly 0.45-0.5 degrees)
          const [minX, minY, maxX, maxY] = turf.bbox(checkLine);
          const pad = 0.5;

          const places = data.places.filter(place => {
            if (!place.coordinates || !['capital', 'metropolis', 'hub', 'oasis', 'gate'].includes(place.type)) return false;
            
            const [lng, lat] = place.coordinates;
            // Fast bounding box rejection to skip heavy pointToLineDistance calculation
            if (lng < minX - pad || lng > maxX + pad || lat < minY - pad || lat > maxY + pad) {
              return false;
            }

            const pt = turf.point(place.coordinates);
            const distance = turf.pointToLineDistance(pt, checkLine, { units: 'kilometers' });
            return distance < 50; // Within 50km
          }).slice(0, 10); // Show up to 10 major places
          
          if (isMounted) {
            setPlacesAlongRoute(places);
          }
        });
      }, 50);

      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    } else {
      setRouteLength(0);
      setPlacesAlongRoute([]);
    }
  }, [isRoute, displayRoute, data]);

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedPlace(null);
      setSelectedRoute(null);
    }
  };

  if (!isOpen && !displayPlace && !displayRoute) return null;
  if (!entity) return null;

  const periodNote = (!isRoute && displayPlace && activePeriod !== "all") ? getPlacePeriodNote(displayPlace, activePeriod) : null;
  
  const relatedPlaces = (!isRoute && displayPlace && displayPlace.related_place_ids)
    ? data?.places.filter(p => displayPlace.related_place_ids?.includes(p.id))
    : [];

  const isDark = theme === "dark";

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent 
        side="right" 
        className="w-[33vw] min-w-[300px] !max-w-[600px] p-0 bg-transparent border-none shadow-none [&>button]:hidden"
      >
        {/* 悬浮面板实体 */}
        <div className={`h-[96vh] my-[2vh] mr-[2vh] rounded-[2.5rem] overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-[#FAF7F2] border-white/50'} border`}>
          
          {/* 顶部插画/真实图片占位与渐变背景 */}
          <div className="absolute top-0 left-0 w-full h-80 pointer-events-none z-0">
            {!isRoute && displayPlace?.cover_image_url ? (
              <>
                <div 
                  className={`absolute inset-0 bg-cover bg-center opacity-40 mix-blend-multiply transition-opacity duration-700 ${isDark ? 'opacity-30 mix-blend-screen' : ''}`} 
                  style={{ backgroundImage: `url(${displayPlace.cover_image_url})` }} 
                />
                {/* 叠加渐变，让图片平滑过渡到底部背景色 */}
                <div className={`absolute inset-0 bg-gradient-to-b ${isDark ? 'from-slate-800/20 via-slate-800/80 to-slate-800' : 'from-[#E7AC71]/20 via-[#F3D7B5]/80 to-[#FAF7F2]'}`} />
              </>
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-b ${isDark ? 'from-slate-700/60 via-slate-800/30 to-slate-800' : 'from-[#E7AC71]/60 via-[#F3D7B5]/30 to-[#FAF7F2]'}`}>
                <div className={`absolute top-10 right-10 w-40 h-40 opacity-20 ${isRoute ? "bg-[url('https://api.dicebear.com/7.x/shapes/svg?seed=route')]" : "bg-[url('https://api.dicebear.com/7.x/shapes/svg?seed=ancient')]"} bg-contain bg-no-repeat pointer-events-none ${isDark ? '' : 'mix-blend-multiply'}`} />
              </div>
            )}
          </div>

          {/* 自定义关闭按钮 */}
          <div className="absolute top-6 right-6 z-20">
            <button 
              onClick={() => handleClose(false)}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20 text-slate-300' : 'bg-black/5 hover:bg-black/10 text-slate-700'}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-8 pt-16 relative z-10 flex-1 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-4 mb-2">
                <h1 className={`text-5xl font-serif font-medium tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {entity.name}
                </h1>
                <Badge 
                  variant="secondary" 
                  className="bg-amber-100/80 text-amber-800 hover:bg-amber-200 border border-amber-200/50 shadow-sm px-2.5 py-0.5 text-xs rounded-full flex items-center gap-1 mt-2"
                >
                  {isRoute ? <RouteIcon className="w-3 h-3 fill-amber-700/50" /> : <Star className="w-3 h-3 fill-amber-700/50" />}
                  {isRoute ? (entity.type === "land" ? "陆上路线" : "海上路线") : getTypeLabel(entity.type)}
                </Badge>
              </div>
              {!isRoute && displayPlace?.aliases && displayPlace.aliases.length > 0 && (
                <p className={`text-[15px] font-medium tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {displayPlace.aliases.join(" · ")}
                </p>
              )}
            </header>

            <div className="flex flex-col gap-8">
              <section>
                <p className={`leading-relaxed text-[15px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {entity.description || (isRoute ? "暂无该路线的详细简介信息。" : "暂无该地点的详细简介信息。")}
                </p>
              </section>

              {/* 史料记载 */}
              {periodNote && (
                <section className={`relative p-6 rounded-2xl border shadow-sm ${isDark ? 'bg-amber-900/20 border-amber-900/50' : 'bg-[#F4EBE1] border-[#E8DCCB]'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <ScrollText className={`w-4 h-4 ${isDark ? 'text-amber-500' : 'text-amber-800'}`} />
                    <h4 className={`text-[13px] font-bold tracking-widest uppercase ${isDark ? 'text-amber-500/90' : 'text-amber-900'}`}>
                      史料记载
                    </h4>
                  </div>
                  <p className={`text-[16px] leading-loose font-serif italic ${isDark ? 'text-amber-100/90' : 'text-amber-950/90'}`}>
                    “{periodNote}”
                  </p>
                  <p className={`text-xs mt-3 font-medium text-right ${isDark ? 'text-amber-500/60' : 'text-amber-800/60'}`}>
                    — {activePeriod} 时期记载
                  </p>
                </section>
              )}

              {/* 2x2 元信息网格 */}
              <section className="grid grid-cols-2 gap-3">
                {/* Location / Length */}
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-700/50 border-slate-600/50' : 'bg-white/50 border-slate-200/60'}`}>
                  <div className={`flex items-center gap-2 mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <MapPin className="w-4 h-4" />
                    <span className="text-[11px] font-semibold tracking-wider uppercase">{isRoute ? "全长估算" : "地理位置"}</span>
                  </div>
                  <p className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {isRoute ? (routeLength ? `约 ${routeLength.toLocaleString()} 公里` : '计算中...') : getRegionFromCoords(displayPlace?.coordinates as [number, number])}
                  </p>
                </div>

                {/* Coordinates */}
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-700/50 border-slate-600/50' : 'bg-white/50 border-slate-200/60'}`}>
                  <div className={`flex items-center gap-2 mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <Compass className="w-4 h-4" />
                    <span className="text-[11px] font-semibold tracking-wider uppercase">{isRoute ? "路线复杂度" : "经纬坐标"}</span>
                  </div>
                  <p className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {isRoute 
                      ? `${displayRoute?.coordinates?.length || 0} 个坐标节点`
                      : displayPlace?.coordinates ? `${displayPlace.coordinates[1].toFixed(4)}° N, ${displayPlace.coordinates[0].toFixed(4)}° E` : '未知'}
                  </p>
                </div>

                {/* Certainty */}
                {!isRoute && (
                  <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-700/50 border-slate-600/50' : 'bg-white/50 border-slate-200/60'}`}>
                    <div className={`flex items-center gap-2 mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-[11px] font-semibold tracking-wider uppercase">考证状态</span>
                    </div>
                    <Badge 
                      className={`font-medium shadow-sm rounded-full px-3 py-0.5 text-xs ${
                        displayPlace?.certainty === "confirmed" 
                          ? (isDark ? "bg-emerald-900/50 text-emerald-400 hover:bg-emerald-800/50" : "bg-emerald-100/80 text-emerald-700 hover:bg-emerald-200")
                          : (isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                      }`}
                      variant="secondary"
                    >
                      {getCertaintyLabel(displayPlace?.certainty || "unknown")}
                    </Badge>
                  </div>
                )}

                {/* Active Periods */}
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-700/50 border-slate-600/50' : 'bg-white/50 border-slate-200/60'} ${isRoute ? 'col-span-2' : ''}`}>
                  <div className={`flex items-center gap-2 mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <Calendar className="w-4 h-4" />
                    <span className="text-[11px] font-semibold tracking-wider uppercase">活跃时期</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(entity.periods || []).slice(0, 4).map((p: string) => (
                      <span key={p} className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${isDark ? 'bg-amber-900/40 text-amber-400 border-amber-800/50' : 'bg-orange-100/50 text-orange-800 border-orange-200/50'}`}>
                        {p}
                      </span>
                    ))}
                    {(entity.periods || []).length > 4 && (
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${isDark ? 'bg-slate-800 text-slate-300 border-slate-700/50' : 'bg-slate-100 text-slate-600 border-slate-200/50'}`}>
                        +{(entity.periods || []).length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </section>

              {/* 关联地点 / 沿途绿洲 */}
              {((!isRoute && relatedPlaces && relatedPlaces.length > 0) || (isRoute && placesAlongRoute && placesAlongRoute.length > 0)) && (
                <section className="space-y-4">
                  <h4 className={`text-[13px] font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {isRoute ? "途经主要绿洲及关隘" : "关联地点"}
                  </h4>
                  <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-2 px-2" style={{ scrollbarWidth: 'none' }}>
                    {(isRoute ? placesAlongRoute : (relatedPlaces || [])).map(rp => (
                      <button
                        key={rp.id}
                        onClick={() => setSelectedPlace(rp)}
                        className={`group flex-shrink-0 flex items-center gap-2 p-1.5 pr-4 border rounded-full transition-all shadow-sm ${
                          isDark 
                            ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-amber-700/50 text-slate-300' 
                            : 'bg-slate-200/40 hover:bg-[#E8DCCB] border-slate-200/60 hover:border-amber-300/50 text-slate-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full overflow-hidden relative flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-[#e0d6c8]'}`}>
                           <span className={`text-xs font-serif ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{rp.name.charAt(0)}</span>
                        </div>
                        <span className="text-xs font-semibold">{rp.name}</span>
                      </button>
                    ))}
                    <button className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#c08643] text-white shadow-md hover:bg-[#a67134] transition-colors ml-1">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </section>
              )}

              {/* 数据来源 */}
              <section className={`pt-4 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-200/50'}`}>
                <h4 className={`text-[11px] font-bold tracking-wider uppercase mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>参考文献 / 数据来源</h4>
                {entity.source_ids && entity.source_ids.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {entity.source_ids.map((sourceId: string) => (
                      <span key={sourceId} className={`text-[12px] px-2 py-1 rounded-md border ${isDark ? 'text-slate-400 bg-slate-800 border-slate-700/60' : 'text-slate-500 bg-slate-100 border-slate-200/60'}`}>
                        {sourceId}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className={`text-[12px] italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>暂无明确文献出处</p>
                )}
              </section>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
