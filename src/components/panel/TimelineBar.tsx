"use client";

import { useMapStore } from "@/store/useMapStore";
import { PeriodId } from "@/types/map";

export default function TimelineBar() {
  const { activePeriod, setActivePeriod } = useMapStore();
  
  const periods: { id: PeriodId | "all"; label: string }[] = [
    { id: "all", label: "全部时期" },
    { id: "han", label: "两汉时期" },
    { id: "tang", label: "隋唐时期" },
    { id: "mongol", label: "蒙元时期" },
  ];

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center bg-white/70 backdrop-blur-xl p-1.5 rounded-full shadow-lg border border-slate-200/60 transition-all hover:bg-white/80 hover:shadow-xl">
      {periods.map((p) => {
        const isActive = activePeriod === p.id;
        return (
          <button
            key={p.id}
            onClick={() => setActivePeriod(p.id)}
            className={`relative px-6 py-2.5 text-[14px] font-medium tracking-wide rounded-full transition-all duration-300 ease-out ${
              isActive 
                ? "text-amber-900 shadow-sm" 
                : "text-slate-600 hover:text-amber-700 hover:bg-slate-100/50"
            }`}
          >
            {isActive && (
              <span className="absolute inset-0 bg-amber-100/80 rounded-full border border-amber-200/50 -z-10 animate-in fade-in zoom-in duration-300" />
            )}
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
