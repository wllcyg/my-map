"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMapStore } from "@/store/useMapStore";
import { useEffect, useState } from "react";
import { getPlacePeriodNote } from "@/lib/periodFilter";
import { Star, ScrollText, MapPin, Compass, ShieldCheck, Calendar, ChevronRight, X } from "lucide-react";

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
  const { selectedPlace, setSelectedPlace, activePeriod, data } = useMapStore();
  const [displayPlace, setDisplayPlace] = useState(selectedPlace);

  useEffect(() => {
    if (selectedPlace) {
      setDisplayPlace(selectedPlace);
    }
  }, [selectedPlace]);

  const isOpen = !!selectedPlace;

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedPlace(null);
    }
  };

  if (!displayPlace) return null;

  const periodNote = activePeriod !== "all" ? getPlacePeriodNote(displayPlace, activePeriod) : null;
  
  const relatedPlaces = displayPlace.related_place_ids
    ? data?.places.filter(p => displayPlace.related_place_ids?.includes(p.id))
    : [];

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-none sm:w-[540px] p-0 bg-transparent border-none shadow-none [&>button]:hidden"
      >
        {/* 悬浮面板实体 */}
        <div className="h-[96vh] my-[2vh] mr-[2vh] rounded-[2.5rem] overflow-hidden relative bg-[#FAF7F2] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/50 flex flex-col">
          
          {/* 顶部插画/真实图片占位与渐变背景 */}
          <div className="absolute top-0 left-0 w-full h-80 pointer-events-none z-0">
            {displayPlace.cover_image_url ? (
              <>
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-multiply transition-opacity duration-700" 
                  style={{ backgroundImage: `url(${displayPlace.cover_image_url})` }} 
                />
                {/* 叠加渐变，让图片平滑过渡到底部背景色 */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#E7AC71]/20 via-[#F3D7B5]/80 to-[#FAF7F2]" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-[#E7AC71]/60 via-[#F3D7B5]/30 to-[#FAF7F2]">
                <div className="absolute top-10 right-10 w-40 h-40 opacity-20 bg-[url('https://api.dicebear.com/7.x/shapes/svg?seed=ancient')] bg-contain bg-no-repeat pointer-events-none mix-blend-multiply" />
              </div>
            )}
          </div>

          {/* 自定义关闭按钮 */}
          <div className="absolute top-6 right-6 z-20">
            <button 
              onClick={() => handleClose(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-8 pt-16 relative z-10 flex-1 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-5xl font-serif font-medium text-slate-900 tracking-tight">
                  {displayPlace.name}
                </h1>
                <Badge 
                  variant="secondary" 
                  className="bg-amber-100/80 text-amber-800 hover:bg-amber-200 border border-amber-200/50 shadow-sm px-2.5 py-0.5 text-xs rounded-full flex items-center gap-1 mt-2"
                >
                  <Star className="w-3 h-3 fill-amber-700/50" />
                  {getTypeLabel(displayPlace.type)}
                </Badge>
              </div>
              {displayPlace.aliases && displayPlace.aliases.length > 0 && (
                <p className="text-[15px] text-slate-500 font-medium tracking-wide">
                  {displayPlace.aliases.join(" · ")}
                </p>
              )}
            </header>

            <div className="flex flex-col gap-8">
              {/* 正文描述 */}
              <section>
                <p className="text-slate-700 leading-relaxed text-[15px]">
                  {displayPlace.description}
                </p>
              </section>

              {/* 史料记载 */}
              {periodNote && (
                <section className="relative bg-[#F4EBE1] p-6 rounded-2xl border border-[#E8DCCB] shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <ScrollText className="w-4 h-4 text-amber-800" />
                    <h4 className="text-[13px] font-bold tracking-widest text-amber-900 uppercase">
                      史料记载
                    </h4>
                  </div>
                  <p className="text-[16px] text-amber-950/90 leading-loose font-serif italic">
                    “{periodNote}”
                  </p>
                  <p className="text-xs text-amber-800/60 mt-3 font-medium text-right">
                    — {activePeriod} 时期记载
                  </p>
                </section>
              )}

              {/* 2x2 元信息网格 */}
              <section className="grid grid-cols-2 gap-3">
                {/* Location */}
                <div className="bg-white/50 p-4 rounded-2xl border border-slate-200/60">
                  <div className="flex items-center gap-2 mb-2 text-slate-500">
                    <MapPin className="w-4 h-4" />
                    <span className="text-[11px] font-semibold tracking-wider uppercase">地理位置</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800">{getRegionFromCoords(displayPlace.coordinates)}</p>
                </div>

                {/* Coordinates */}
                <div className="bg-white/50 p-4 rounded-2xl border border-slate-200/60">
                  <div className="flex items-center gap-2 mb-2 text-slate-500">
                    <Compass className="w-4 h-4" />
                    <span className="text-[11px] font-semibold tracking-wider uppercase">经纬坐标</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800">
                    {displayPlace.coordinates ? `${displayPlace.coordinates[1].toFixed(4)}° N, ${displayPlace.coordinates[0].toFixed(4)}° E` : '未知'}
                  </p>
                </div>

                {/* Certainty */}
                <div className="bg-white/50 p-4 rounded-2xl border border-slate-200/60">
                  <div className="flex items-center gap-2 mb-2 text-slate-500">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[11px] font-semibold tracking-wider uppercase">考证状态</span>
                  </div>
                  <Badge 
                    className={`font-medium shadow-sm rounded-full px-3 py-0.5 text-xs ${
                      displayPlace.certainty === "confirmed" 
                        ? "bg-emerald-100/80 text-emerald-700 hover:bg-emerald-200" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                    variant="secondary"
                  >
                    {getCertaintyLabel(displayPlace.certainty)}
                  </Badge>
                </div>

                {/* Active Periods */}
                <div className="bg-white/50 p-4 rounded-2xl border border-slate-200/60">
                  <div className="flex items-center gap-2 mb-2 text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <span className="text-[11px] font-semibold tracking-wider uppercase">活跃时期</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(displayPlace.periods || []).slice(0, 2).map((p: string) => (
                      <span key={p} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-100/50 text-orange-800 border border-orange-200/50">
                        {p}
                      </span>
                    ))}
                    {(displayPlace.periods || []).length > 2 && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/50">
                        +{(displayPlace.periods || []).length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </section>

              {/* 关联地点 */}
              {relatedPlaces && relatedPlaces.length > 0 && (
                <section className="space-y-4">
                  <h4 className="text-[13px] font-bold text-slate-800">关联地点</h4>
                  <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-2 px-2" style={{ scrollbarWidth: 'none' }}>
                    {relatedPlaces.map(rp => (
                      <button
                        key={rp.id}
                        onClick={() => setSelectedPlace(rp)}
                        className="group flex-shrink-0 flex items-center gap-2 p-1.5 pr-4 bg-slate-200/40 hover:bg-[#E8DCCB] border border-slate-200/60 hover:border-amber-300/50 rounded-full text-slate-700 transition-all shadow-sm"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#e0d6c8] relative flex items-center justify-center">
                           <span className="text-xs text-slate-500 font-serif">{rp.name.charAt(0)}</span>
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
              <section className="pt-4 border-t border-slate-200/50">
                <h4 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-3">参考文献 / 数据来源</h4>
                {displayPlace.source_ids && displayPlace.source_ids.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {displayPlace.source_ids.map((sourceId: string) => (
                      <span key={sourceId} className="text-[12px] text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200/60">
                        {sourceId}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-slate-400 italic">暂无明确文献出处</p>
                )}
              </section>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
