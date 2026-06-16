import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { MapData } from "@/types/map";

export async function GET() {
  try {
    // 并行拉取四张表的数据
    const [placesRes, routesRes, periodsRes, sourcesRes] = await Promise.all([
      supabase.from("places").select("*"),
      supabase.from("routes").select("*"),
      supabase.from("periods").select("*"),
      supabase.from("sources").select("*")
    ]);

    // 检查是否有报错
    if (placesRes.error) throw new Error(placesRes.error.message);
    if (routesRes.error) throw new Error(routesRes.error.message);
    if (periodsRes.error) throw new Error(periodsRes.error.message);
    if (sourcesRes.error) throw new Error(sourcesRes.error.message);

    // 在服务端做一次数据格式转换，将数据库存的 flat coordinates 转换回 [lon, lat]
    // 注意 Supabase 存储 places 的经纬度是分离的 (longitude, latitude) 字段
    const formattedPlaces = placesRes.data.map(p => ({
      ...p,
      coordinates: [p.longitude, p.latitude]
    }));

    const mapData: MapData = {
      places: formattedPlaces,
      routes: routesRes.data,
      periods: periodsRes.data,
      sources: sourcesRes.data
    };

    return NextResponse.json(mapData);
  } catch (error: any) {
    console.error("[API Error] /api/map-data:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch map data", details: error.message },
      { status: 500 }
    );
  }
}
