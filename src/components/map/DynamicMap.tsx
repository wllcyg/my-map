"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// 在 Client Component 中使用 dynamic(..., { ssr: false }) 隔离浏览器依赖
const MapContainer = dynamic(() => import("./MapContainer"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
      <Skeleton className="w-full h-full" />
    </div>
  ),
});

export default function DynamicMap() {
  return <MapContainer />;
}
