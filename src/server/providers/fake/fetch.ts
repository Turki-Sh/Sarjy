import "server-only";

// Recorded Open-Meteo answers for a few cities, in the real response shapes, so the weather tool
// runs offline. "Atlantis" is never found; "Failtown" makes the service fail (for AT-34).

import type { Fetch } from "../types";

const CITIES: Record<
  string,
  { name: string; admin1: string; latitude: number; longitude: number; base: number }
> = {
  riyadh: { name: "Riyadh", admin1: "Riyadh Region", latitude: 24.69, longitude: 46.72, base: 41 },
  الرياض: { name: "الرياض", admin1: "منطقة الرياض", latitude: 24.69, longitude: 46.72, base: 41 },
  jeddah: { name: "Jeddah", admin1: "Makkah Region", latitude: 21.54, longitude: 39.17, base: 36 },
  جدة: { name: "جدة", admin1: "منطقة مكة المكرمة", latitude: 21.54, longitude: 39.17, base: 36 },
  dammam: { name: "Dammam", admin1: "Eastern Province", latitude: 26.43, longitude: 50.1, base: 39 },
  الدمام: { name: "الدمام", admin1: "المنطقة الشرقية", latitude: 26.43, longitude: 50.1, base: 39 },
  failtown: { name: "Failtown", admin1: "", latitude: -1, longitude: -1, base: 0 },
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export const fakeFetch: Fetch = async (url) => {
  const u = new URL(url);
  if (u.hostname === "geocoding-api.open-meteo.com") {
    const city = CITIES[(u.searchParams.get("name") ?? "").trim().toLowerCase()];
    if (!city) return json({ generationtime_ms: 0.4 });
    return json({
      results: [{ ...city, country: "Saudi Arabia", country_code: "SA", timezone: "Asia/Riyadh" }],
    });
  }
  if (u.hostname === "api.open-meteo.com") {
    const lat = Number(u.searchParams.get("latitude"));
    if (lat === -1) return json({ error: true, reason: "Service unavailable" }, 503);
    const city = Object.values(CITIES).find((c) => c.latitude === lat)!;
    const fahrenheit = u.searchParams.get("temperature_unit") === "fahrenheit";
    const t = (c: number) => (fahrenheit ? c * 1.8 + 32 : c);
    const days = [...Array(7).keys()];
    return json({
      current: { temperature_2m: t(city.base - 3.4) },
      daily: {
        time: days.map((d) => new Date(Date.UTC(2026, 8, 29 + d)).toISOString().slice(0, 10)),
        weather_code: days.map((d) => [0, 0, 1, 2, 0, 3, 0][d]!),
        temperature_2m_max: days.map((d) => t(city.base + 0.3 - d * 0.4)),
        temperature_2m_min: days.map((d) => t(city.base - 12.6 - d * 0.2)),
        precipitation_probability_max: days.map(() => 0),
        wind_speed_10m_max: days.map((d) => 14.6 + d),
      },
    });
  }
  return json({ error: "unexpected host in fake fetch" }, 500);
};
