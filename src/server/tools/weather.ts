import "server-only";

// The weather tool (architecture, section 9): Open-Meteo geocoding, then the forecast.
// It returns only what Sarjy may say, already rounded, so the model cannot quote "41.3 °C".
// When no place is given it uses the remembered home city; if there is none, it says so and
// the model asks. Failures come back as plain error codes, never as made-up numbers.

import { tool } from "ai";
import { z } from "zod";
import type { Fetch, Lang } from "../providers/types";

export type Units = "celsius" | "fahrenheit";

export type WeatherResult =
  | {
      place: string;
      region: string | null;
      country: string | null;
      date: string;
      day: string;
      condition: string;
      high: number;
      low: number;
      nowTemp: number | null;
      rainChance: number | null;
      windMaxKmh: number | null;
      units: Units;
      source: "open-meteo";
    }
  | { error: "no_location" | "place_not_found" | "service_unavailable"; query?: string };

const TIMEOUT_MS = 4000;

// WMO weather interpretation codes, as Open-Meteo reports them, in the words Sarjy would use.
const CONDITIONS: Record<number, [en: string, ar: string]> = {
  0: ["clear skies", "صحو"],
  1: ["mostly clear", "صحو غالبًا"],
  2: ["partly cloudy", "غائم جزئيًا"],
  3: ["overcast", "غائم"],
  45: ["fog", "ضباب"],
  48: ["freezing fog", "ضباب متجمد"],
  51: ["light drizzle", "رذاذ خفيف"],
  53: ["drizzle", "رذاذ"],
  55: ["heavy drizzle", "رذاذ كثيف"],
  61: ["light rain", "مطر خفيف"],
  63: ["rain", "مطر"],
  65: ["heavy rain", "مطر غزير"],
  71: ["light snow", "ثلج خفيف"],
  73: ["snow", "ثلج"],
  75: ["heavy snow", "ثلج كثيف"],
  80: ["light showers", "زخات خفيفة"],
  81: ["showers", "زخات"],
  82: ["heavy showers", "زخات غزيرة"],
  95: ["thunderstorms", "عواصف رعدية"],
  96: ["thunderstorms with hail", "عواصف رعدية مع برد"],
  99: ["severe thunderstorms with hail", "عواصف رعدية شديدة مع برد"],
};

export const condition = (code: number, lang: Lang) =>
  CONDITIONS[code]?.[lang === "ar" ? 1 : 0] ?? (lang === "ar" ? "متقلب" : "mixed");

const DAY_NAMES: Record<Lang, string[]> = {
  en: ["today", "tomorrow"],
  ar: ["اليوم", "بكرة"],
};

async function getJson(fetchImpl: Fetch, url: string): Promise<unknown> {
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

type Geo = { name: string; latitude: number; longitude: number; country?: string; admin1?: string };
type Forecast = {
  current?: { temperature_2m?: number };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max?: (number | null)[];
    wind_speed_10m_max?: (number | null)[];
  };
};

export async function forecast(
  fetchImpl: Fetch,
  input: { location: string; dayOffset: number; units: Units; lang: Lang },
): Promise<WeatherResult> {
  const offset = Math.min(6, Math.max(0, Math.round(input.dayOffset)));
  let geo: Geo | undefined;
  try {
    const q = new URLSearchParams({ name: input.location, count: "1", language: input.lang, format: "json" });
    const data = (await getJson(fetchImpl, `https://geocoding-api.open-meteo.com/v1/search?${q}`)) as {
      results?: Geo[];
    };
    geo = data.results?.[0];
  } catch {
    return { error: "service_unavailable" };
  }
  if (!geo) return { error: "place_not_found", query: input.location };

  let data: Forecast;
  try {
    const q = new URLSearchParams({
      latitude: String(geo.latitude),
      longitude: String(geo.longitude),
      current: "temperature_2m",
      daily:
        "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
      timezone: "auto",
      forecast_days: "7",
      temperature_unit: input.units,
    });
    data = (await getJson(fetchImpl, `https://api.open-meteo.com/v1/forecast?${q}`)) as Forecast;
  } catch {
    return { error: "service_unavailable" };
  }

  const d = data.daily;
  const code = d.weather_code[offset];
  const high = d.temperature_2m_max[offset];
  const low = d.temperature_2m_min[offset];
  if (code === undefined || high === undefined || low === undefined) return { error: "service_unavailable" };
  const rain = d.precipitation_probability_max?.[offset];
  const wind = d.wind_speed_10m_max?.[offset];
  const date = d.time[offset] ?? "";

  return {
    place: geo.name,
    region: geo.admin1 ?? null,
    country: geo.country ?? null,
    date,
    day: DAY_NAMES[input.lang][offset] ?? weekday(date, input.lang),
    condition: condition(code, input.lang),
    high: Math.round(high),
    low: Math.round(low),
    nowTemp:
      offset === 0 && data.current?.temperature_2m !== undefined
        ? Math.round(data.current.temperature_2m)
        : null,
    rainChance: rain == null ? null : Math.round(rain / 10) * 10,
    windMaxKmh: wind == null ? null : Math.round(wind),
    units: input.units,
    source: "open-meteo",
  };
}

function weekday(isoDate: string, lang: Lang): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en", { weekday: "long", timeZone: "UTC" }).format(
    date,
  );
}

/** The chip label: weather.forecast("Riyadh", "tomorrow"). Machine output, so always Latin. */
export function weatherLabel(location: string, dayOffset: number): string {
  const day = ["today", "tomorrow"][dayOffset] ?? `+${dayOffset}d`;
  return `weather.forecast("${location}", "${day}")`;
}

/** The model-facing tool. `homeCity` and `units` come from memory. */
export function weatherTool(ctx: {
  fetch: Fetch;
  lang: Lang;
  homeCity: string | null;
  units: Units;
  onStart: (label: string) => string;
  onEnd: (id: string, ok: boolean) => void;
}) {
  return tool({
    description:
      "Get the weather for a place, today or up to 6 days ahead. Leave `location` empty to use the user's saved home city. " +
      "Only quote numbers this tool returns.",
    inputSchema: z.object({
      location: z.string().optional().describe("City name in any language. Omit to use the saved home city."),
      day_offset: z.number().int().min(0).max(6).default(0).describe("0 today, 1 tomorrow, up to 6."),
    }),
    execute: async ({ location, day_offset }): Promise<WeatherResult> => {
      const place = location?.trim() || ctx.homeCity;
      const id = ctx.onStart(weatherLabel(place ?? "?", day_offset));
      if (!place) {
        ctx.onEnd(id, false);
        return { error: "no_location" };
      }
      const result = await forecast(ctx.fetch, {
        location: place,
        dayOffset: day_offset,
        units: ctx.units,
        lang: ctx.lang,
      });
      ctx.onEnd(id, !("error" in result));
      return result;
    },
  });
}
