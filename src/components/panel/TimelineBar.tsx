"use client";

import { useMemo } from "react";
import { useMapStore } from "@/store/useMapStore";
import { PeriodId } from "@/types/map";
import { Moon, Sun } from "lucide-react";

export default function TimelineBar() {
  const { activePeriod, setActivePeriod, data, theme, setTheme } = useMapStore();
  
  const dynamicPeriods = useMemo(() => {
    if (!data?.periods) return [];
    return [
      { id: "all" as const, label: "全部时期" },
      ...data.periods.map((p) => ({ id: p.id as PeriodId | "all", label: p.name })),
    ];
  }, [data?.periods]);

  if (!data?.periods) {
    return null;
  }

  return (
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center p-1.5 rounded-full shadow-lg border transition-all hover:shadow-xl ${theme === 'dark' ? 'bg-slate-800/80 backdrop-blur-xl border-slate-700' : 'bg-white/70 backdrop-blur-xl border-slate-200/60 hover:bg-white/80'}`}>

      {dynamicPeriods.map((p) => {
        const isActive = activePeriod === p.id;
        const activeTextStyle = theme === 'dark' ? "text-amber-400 shadow-sm" : "text-amber-900 shadow-sm";
        const inactiveTextStyle = theme === 'dark' ? "text-slate-300 hover:text-amber-400 hover:bg-slate-700/50" : "text-slate-600 hover:text-amber-700 hover:bg-slate-100/50";
        
        return (
          <button
            key={p.id}
            onClick={() => setActivePeriod(p.id)}
            className={`relative px-6 py-2.5 text-[14px] font-medium tracking-wide rounded-full transition-all duration-300 ease-out ${
              isActive ? activeTextStyle : inactiveTextStyle
            }`}
          >
            {isActive && (
              <span className={`absolute inset-0 rounded-full border -z-10 animate-in fade-in zoom-in duration-300 ${
                theme === 'dark' ? 'bg-amber-900/30 border-amber-700/50' : 'bg-amber-100/80 border-amber-200/50'
              }`} />
            )}
            {p.label}
          </button>
        );
      })}

      <div className="h-6 w-px bg-slate-300/50 mx-1"></div>

      {/* Theme Toggle */}
      <button
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        className={`w-10 h-10 flex items-center justify-center rounded-full ml-2 transition-colors ${
          theme === 'dark' 
            ? 'text-blue-300 hover:bg-slate-700' 
            : 'text-slate-600 hover:bg-slate-100/50'
        }`}
        title={theme === 'dark' ? "切换白昼模式" : "切换黑夜模式"}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  );
}
