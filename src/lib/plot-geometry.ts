import type { PlotRecord } from "@/lib/gfi-dummy-data";

export type PlotGeometryQuality = "DECLARED_POLYGON" | "APPROXIMATED_POINT";

export interface PlotGeometryFeature {
  type: "Feature";
  properties: Record<string, string | number>;
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

export interface PlotGeometrySummary {
  center: { lat: number; lng: number };
  bbox: [number, number, number, number];
  feature: PlotGeometryFeature;
  zoom: number;
  quality: PlotGeometryQuality;
}

const COUNTRY_CENTERS: Record<string, { lat: number; lng: number }> = {
  "Ivory Coast": { lat: 6.8276, lng: -5.2893 },
  Ghana: { lat: 7.9465, lng: -1.0232 },
  Malaysia: { lat: 5.3924, lng: 109.8479 },
  Indonesia: { lat: -0.7893, lng: 113.9213 },
  Brazil: { lat: -14.235, lng: -51.9253 },
  Germany: { lat: 51.1657, lng: 10.4515 },
};

function hashSeed(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function parseCoordinateSummary(summary: string) {
  const matches = summary.match(/-?\d+(?:\.\d+)?/g) ?? [];
  if (matches.length < 2) return null;
  const first = Number(matches[0]);
  const second = Number(matches[1]);
  if (Number.isNaN(first) || Number.isNaN(second)) return null;
  if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
    return { lat: first, lng: second };
  }
  return null;
}

function getBaseCenter(plot: PlotRecord) {
  const parsed = parseCoordinateSummary(plot.coordinatesSummary);
  if (parsed) return parsed;

  const defaultCenter = COUNTRY_CENTERS[plot.sourceCountry] ?? { lat: 0.5, lng: 20.5 };
  const seed = hashSeed(`${plot.id}:${plot.label}:${plot.sourceCountry}`);
  const latOffset = (((seed % 1000) / 1000) - 0.5) * 1.2;
  const lngOffset = ((((seed / 1000) % 1000) / 1000) - 0.5) * 1.2;
  return {
    lat: Number((defaultCenter.lat + latOffset).toFixed(5)),
    lng: Number((defaultCenter.lng + lngOffset).toFixed(5)),
  };
}

function createParcelPolygon(center: { lat: number; lng: number }, plot: PlotRecord) {
  const seed = hashSeed(`${plot.id}:${plot.areaHa}:${plot.geoType}`);
  const latRadius = Math.max(0.0025, Math.sqrt(plot.areaHa) * 0.0032);
  const lngRadius = latRadius * 1.18;
  const skewLat = (((seed % 360) / 360) - 0.5) * latRadius * 0.7;
  const skewLng = ((((seed / 360) % 360) / 360) - 0.5) * lngRadius * 0.7;

  const ring: number[][] = [
    [center.lng - lngRadius, center.lat - latRadius * 0.72],
    [center.lng - lngRadius * 0.42, center.lat + latRadius + skewLat],
    [center.lng + lngRadius * 0.58, center.lat + latRadius * 0.9],
    [center.lng + lngRadius + skewLng, center.lat - latRadius * 0.16],
    [center.lng + lngRadius * 0.18, center.lat - latRadius - skewLat],
    [center.lng - lngRadius * 0.82, center.lat - latRadius * 0.92],
    [center.lng - lngRadius, center.lat - latRadius * 0.72],
  ].map(([lng, lat]) => [Number(lng.toFixed(6)), Number(lat.toFixed(6))]);

  return ring;
}

function getBounds(coordinates: number[][]) {
  const longitudes = coordinates.map(([lng]) => lng);
  const latitudes = coordinates.map(([, lat]) => lat);
  return [
    Math.min(...longitudes),
    Math.min(...latitudes),
    Math.max(...longitudes),
    Math.max(...latitudes),
  ] as [number, number, number, number];
}

function getZoom(areaHa: number, parcelOnly: boolean) {
  const baseZoom = areaHa >= 20 ? 13.1 : areaHa >= 10 ? 14.1 : areaHa >= 5 ? 14.7 : 15.3;
  return Number((parcelOnly ? baseZoom + 0.45 : baseZoom).toFixed(2));
}

export function getPlotGeometry(plot: PlotRecord, options?: { parcelOnly?: boolean }): PlotGeometrySummary {
  const center = getBaseCenter(plot);
  const polygon = createParcelPolygon(center, plot);
  const bbox = getBounds(polygon);

  return {
    center,
    bbox,
    zoom: getZoom(plot.areaHa, options?.parcelOnly ?? false),
    quality: plot.geoType === "POLYGON" ? "DECLARED_POLYGON" : "APPROXIMATED_POINT",
    feature: {
      type: "Feature",
      properties: {
        plotId: plot.id,
        label: plot.label,
        stroke: "#f7f9fa",
        "stroke-width": 3,
        "stroke-opacity": 0.9,
        fill: plot.latestDeforestationStatus === "FLAGGED" ? "#ef4444" : plot.latestDeforestationStatus === "CLEAR" ? "#16a34a" : "#f59e0b",
        "fill-opacity": plot.latestDeforestationStatus === "FLAGGED" ? 0.22 : 0.15,
      },
      geometry: {
        type: "Polygon",
        coordinates: [polygon],
      },
    },
  };
}
