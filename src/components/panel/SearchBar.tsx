"use client";

import { useState, useRef, useEffect } from "react";
import { Search, MapPin, Info, BookOpen } from "lucide-react";
import Link from "next/link";
import { useMapStore } from "@/store/useMapStore";
import { searchPlaces } from "@/lib/searchPlaces";
import { Input } from "@/components/ui/input";
import { Place } from "@/types/map";

export default function SearchBar() {
  const { data, setSelectedPlace } = useMapStore();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const places = data?.places || [];
  const results = isFocused && query.trim() !== "" ? searchPlaces(places, query) : [];
  const showDropdown = isFocused && query.trim() !== "";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (place: Place) => {
    setSelectedPlace(place);
    setQuery("");
    setIsFocused(false);
  };

  return (
    <div ref={containerRef} className="absolute top-8 left-8 z-10 flex gap-2 items-start">
      <div className="relative w-80">
        <div className={`relative flex items-center bg-white/80 backdrop-blur-md rounded-2xl border transition-all duration-300 ${isFocused ? 'border-amber-400/50 shadow-lg shadow-amber-900/5' : 'border-slate-200/60 shadow-md'}`}>
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="搜索丝路重镇、驿站..."
            className="pl-10 h-12 bg-transparent border-0 ring-0 focus-visible:ring-0 shadow-none text-[15px] font-medium text-slate-800 placeholder:text-slate-400 rounded-2xl"
          />
        </div>

        {showDropdown && (
          <div className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* dropdown list code will be kept implicitly because we only replace the top half */}
          <div className="max-h-72 overflow-y-auto custom-scrollbar p-2">
            {results.length > 0 ? (
              <div className="flex flex-col gap-1">
                {results.map((place) => (
                  <button
                    key={place.id}
                    onClick={() => handleSelect(place)}
                    className="flex flex-col items-start px-3 py-2.5 rounded-xl hover:bg-amber-50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-600/70 group-hover:text-amber-600 transition-colors" />
                      <span className="text-[14px] font-medium text-slate-800 group-hover:text-amber-900">{place.name}</span>
                    </div>
                    {place.aliases && place.aliases.length > 0 && (
                      <span className="text-[12px] text-slate-500 pl-5 line-clamp-1 mt-0.5">
                        别名: {place.aliases.join(", ")}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center flex flex-col items-center gap-2">
                <Search className="w-6 h-6 text-slate-300" />
                <p className="text-sm text-slate-500 font-medium">未找到相关地点</p>
                <p className="text-xs text-slate-400">尝试输入其他关键字</p>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
      
      {/* 快捷导航 */}
      <div className="flex flex-row gap-2">
        <Link 
          href="/about"
          className="w-12 h-12 flex items-center justify-center bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-md text-slate-600 hover:text-amber-600 hover:border-amber-400/50 transition-all group"
          title="关于项目"
        >
          <Info className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </Link>
        <Link 
          href="/sources"
          className="w-12 h-12 flex items-center justify-center bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-md text-slate-600 hover:text-amber-600 hover:border-amber-400/50 transition-all group"
          title="数据来源"
        >
          <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
