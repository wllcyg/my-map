import { NextResponse } from "next/server";
import { placesTileCache } from "@/lib/mvtCache";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  try {
    const { z, x, y } = await params;
    const cacheKey = `${z}/${x}/${y}`;

    // 1. Check memory cache first
    const cachedBuffer = placesTileCache.get(cacheKey);
    if (cachedBuffer) {
      if (cachedBuffer.length === 0) {
        return new NextResponse(null, { status: 204 });
      }
      return new NextResponse(cachedBuffer as any, {
        headers: {
          "Content-Type": "application/vnd.mapbox-vector-tile",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600, s-maxage=86400", // Enable browser and CDN caching
        },
      });
    }

    // 2. Fetch from Supabase
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_places_mvt`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/vnd.pgrst.object, application/octet-stream",
        "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      },
      body: JSON.stringify({
        z: parseInt(z),
        x: parseInt(x),
        y: parseInt(y),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[MVT Error] Places API responded with:", response.status, errorText);
      return NextResponse.json({ error: "Failed to fetch tiles" }, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "";
    let buffer: Buffer;

    if (contentType.includes("application/octet-stream")) {
      buffer = Buffer.from(await response.arrayBuffer());
    } else {
      const text = await response.text();
      let hexString = text;
      try {
        if (hexString.startsWith('"') && hexString.endsWith('"')) {
          hexString = JSON.parse(hexString);
        }
      } catch (e) {
        if (hexString.startsWith('"') && hexString.endsWith('"')) {
          hexString = hexString.slice(1, -1);
        }
      }
      if (hexString.startsWith('\\x')) {
        hexString = hexString.slice(2);
      }
      buffer = Buffer.from(hexString, 'hex');
    }

    if (buffer.length === 0) {
      placesTileCache.set(cacheKey, buffer);
      return new NextResponse(null, { status: 204 });
    }

    placesTileCache.set(cacheKey, buffer);

    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": "application/vnd.mapbox-vector-tile",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (error: any) {
    console.error("[MVT Error] Places Tile route:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
