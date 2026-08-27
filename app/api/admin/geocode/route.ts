import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/dal";

const cache = new Map<string, string>();

async function fetchAddress(lat: number, lon: number): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=id`,
      {
        headers: { "User-Agent": "SPLIK-Admin-Dashboard/1.0 (admin@splik.id)" },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address;
      if (addr) {
        const parts = [];
        if (addr.road) parts.push(addr.road);
        if (addr.suburb) parts.push(addr.suburb);
        if (addr.city || addr.town || addr.municipality) parts.push(addr.city || addr.town || addr.municipality);
        if (parts.length > 0) return parts.join(", ");
      }
      return data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    }
  } catch {}
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get("lat");
    const lonStr = searchParams.get("lon");
    if (!latStr || !lonStr) {
      return NextResponse.json({ error: "Missing lat or lon parameter." }, { status: 400 });
    }
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json({ error: "Invalid lat or lon parameter." }, { status: 400 });
    }

    const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    if (cache.has(cacheKey)) {
      return NextResponse.json({ address: cache.get(cacheKey) });
    }

    const address = await fetchAddress(lat, lon);
    cache.set(cacheKey, address);
    return NextResponse.json({ address });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
