import DynamicMap from "@/components/map/DynamicMap";
import DetailPanel from "@/components/panel/DetailPanel";
import SearchBar from "@/components/panel/SearchBar";
import TimelineBar from "@/components/panel/TimelineBar";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "探索地图 | 丝绸之路全景地图",
  description: "沉浸式拖拽和缩放探索长安、敦煌、撒马尔罕等历史重镇。支持时间轴筛选和多模态地标搜索。",
};

export default function SilkRoadMapPage() {
  return (
    <main className="flex-1 relative w-full h-full min-h-[calc(100vh-4rem)] overflow-hidden">
      <DynamicMap />
      <SearchBar />
      <TimelineBar />
      <DetailPanel />
    </main>
  );
}
