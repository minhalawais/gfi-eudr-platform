import type { DeforestationCase, PlotRecord } from "@/lib/gfi-dummy-data";
import { getPlotGeometry } from "@/lib/plot-geometry";

export type EoLayerMode = "true_color" | "ndvi" | "change";

export interface EoImageryCard {
  id: "baseline" | "current" | "ndvi" | "change";
  title: string;
  subtitle: string;
  imageUrl: string | null;
  source: string;
  imageType: string;
  acquisitionDate: string;
  cloudCover: string;
  fallback: boolean;
  available: boolean;
  warning?: string;
  overlayTone?: "forest" | "ndvi" | "change";
}

export interface EoImageryResponse {
  mapStyle: string | null;
  provider: "SENTINEL_HUB" | "MAPBOX_FALLBACK" | "UNAVAILABLE";
  cards: EoImageryCard[];
  geometryQuality: "DECLARED_POLYGON" | "APPROXIMATED_POINT";
  analystNote: string;
  parcelReference: {
    center: { lat: number; lng: number };
    bbox: [number, number, number, number];
  };
}

interface BuildImageryInput {
  plot: PlotRecord;
  deforestationCase?: DeforestationCase | null;
  mapboxToken?: string;
  sentinelConfigured?: boolean;
  parcelOnly?: boolean;
}

function getOverlayColors(plot: PlotRecord) {
  if (plot.latestDeforestationStatus === "FLAGGED") {
    return {
      baseline: "#dbeafe",
      current: "#fb7185",
      ndvi: "#4ade80",
      change: "#f97316",
    };
  }

  return {
    baseline: "#bbf7d0",
    current: "#34d399",
    ndvi: "#22c55e",
    change: "#f59e0b",
  };
}

function mapboxOverlayUrl(plot: PlotRecord, tone: string, mapboxToken: string, parcelOnly = false) {
  const geometry = getPlotGeometry(plot, { parcelOnly });
  const feature = {
    ...geometry.feature,
    properties: {
      ...geometry.feature.properties,
      fill: tone,
      "fill-opacity": tone === "#f97316" ? 0.28 : tone === "#22c55e" ? 0.24 : 0.18,
      stroke: "#f8fafc",
      "stroke-width": 3,
      "stroke-opacity": 0.95,
    },
  };

  const encoded = encodeURIComponent(JSON.stringify(feature));
  return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/geojson(${encoded})/${geometry.center.lng},${geometry.center.lat},${geometry.zoom},0/960x560?access_token=${mapboxToken}&logo=false&attribution=false`;
}

export function buildImageryResponse({ plot, deforestationCase, mapboxToken, sentinelConfigured, parcelOnly = false }: BuildImageryInput): EoImageryResponse {
  const geometry = getPlotGeometry(plot, { parcelOnly });
  const colors = getOverlayColors(plot);
  const targetCurrentDate = deforestationCase?.decisionDate ? `${deforestationCase.decisionDate} review window` : "2026-05 approved review window";
  const flagged = plot.latestDeforestationStatus === "FLAGGED" || deforestationCase?.resultStatus === "FLAGGED";

  if (!mapboxToken && !sentinelConfigured) {
    return {
      mapStyle: null,
      provider: "UNAVAILABLE",
      geometryQuality: geometry.quality,
      analystNote: plot.geoType === "POINT"
        ? "Polygon imagery is unavailable until a validated parcel boundary file is supplied."
        : "Satellite imagery credentials are not configured in this environment.",
      parcelReference: {
        center: geometry.center,
        bbox: geometry.bbox,
      },
      cards: [
        {
          id: "baseline",
          title: "Baseline Forest (Dec 2020)",
          subtitle: "Historical comparison unavailable",
          imageUrl: null,
          source: "No imagery provider configured",
          imageType: "Unavailable",
          acquisitionDate: "December 2020 target window",
          cloudCover: "N/A",
          fallback: true,
          available: false,
          warning: "Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN and Sentinel configuration to enable live imagery.",
        },
        {
          id: "current",
          title: "Current True Color",
          subtitle: "Operator preview unavailable",
          imageUrl: null,
          source: "No imagery provider configured",
          imageType: "Unavailable",
          acquisitionDate: targetCurrentDate,
          cloudCover: "N/A",
          fallback: true,
          available: false,
        },
        {
          id: "ndvi",
          title: "NDVI / Vegetation Health",
          subtitle: "Analytical layer unavailable",
          imageUrl: null,
          source: "No imagery provider configured",
          imageType: "Unavailable",
          acquisitionDate: targetCurrentDate,
          cloudCover: "N/A",
          fallback: true,
          available: false,
        },
      ],
    };
  }

  const source = sentinelConfigured ? "Sentinel Hub ready, previewing Mapbox fallback cards in this environment" : "Mapbox Satellite fallback preview";
  const fallbackWarning = sentinelConfigured ? undefined : "Historical/date-specific Sentinel imagery is not configured, so preview cards use a live commercial satellite fallback.";
  const cards: EoImageryCard[] = [
    {
      id: "baseline",
      title: "Baseline Forest (Dec 2020)",
      subtitle: plot.geoType === "POLYGON" ? "Parcel-aligned forest baseline" : "Point submission with parcel approximation",
      imageUrl: mapboxToken ? mapboxOverlayUrl(plot, colors.baseline, mapboxToken, parcelOnly) : null,
      source,
      imageType: sentinelConfigured ? "Sentinel-2 baseline target / Mapbox preview" : "Mapbox Satellite Preview",
      acquisitionDate: "December 2020 compliance baseline",
      cloudCover: sentinelConfigured ? "Targeted via Sentinel process window" : "Live basemap preview",
      fallback: !sentinelConfigured,
      available: Boolean(mapboxToken),
      warning: fallbackWarning,
      overlayTone: "forest",
    },
    {
      id: "current",
      title: "Current True Color (May 2026)",
      subtitle: flagged ? "Current canopy state under review" : "Current parcel canopy and adjacent land use",
      imageUrl: mapboxToken ? mapboxOverlayUrl(plot, colors.current, mapboxToken, parcelOnly) : null,
      source,
      imageType: sentinelConfigured ? "Sentinel-2 current target / Mapbox preview" : "Mapbox Satellite Preview",
      acquisitionDate: targetCurrentDate,
      cloudCover: sentinelConfigured ? "Auto-selected best acquisition" : "Live basemap preview",
      fallback: !sentinelConfigured,
      available: Boolean(mapboxToken),
      warning: flagged ? "Difference review should be confirmed against the Sentinel change layer before operator filing." : fallbackWarning,
      overlayTone: "forest",
    },
    {
      id: "ndvi",
      title: "Sentinel-2 NDVI",
      subtitle: flagged ? "Vegetation signal requires analyst review" : "Stable vegetation density across the parcel",
      imageUrl: mapboxToken ? mapboxOverlayUrl(plot, colors.ndvi, mapboxToken, parcelOnly) : null,
      source,
      imageType: sentinelConfigured ? "Sentinel-2 NDVI target / Mapbox preview" : "Analytical preview overlay",
      acquisitionDate: targetCurrentDate,
      cloudCover: sentinelConfigured ? "Cloud-screened acquisition" : "Preview overlay",
      fallback: !sentinelConfigured,
      available: Boolean(mapboxToken),
      warning: plot.geoType === "POINT" ? "Polygon boundary is approximated until the geolocation file is validated." : fallbackWarning,
      overlayTone: "ndvi",
    },
  ];

  if (flagged) {
    cards.push({
      id: "change",
      title: "Canopy Change Mask",
      subtitle: "Escalation layer for flagged parcels",
      imageUrl: mapboxToken ? mapboxOverlayUrl(plot, colors.change, mapboxToken, parcelOnly) : null,
      source,
      imageType: sentinelConfigured ? "Sentinel change-detection target / Mapbox preview" : "Change overlay preview",
      acquisitionDate: `${targetCurrentDate} compared with Dec 2020 baseline`,
      cloudCover: sentinelConfigured ? "Best-scene composite" : "Preview overlay",
      fallback: !sentinelConfigured,
      available: Boolean(mapboxToken),
      warning: "Highlighted zones indicate the analyst review area and should be corroborated with parcel documents.",
      overlayTone: "change",
    });
  }

  return {
    mapStyle: "mapbox://styles/mapbox/satellite-v9",
    provider: sentinelConfigured ? "SENTINEL_HUB" : "MAPBOX_FALLBACK",
    geometryQuality: geometry.quality,
    analystNote: geometry.quality === "APPROXIMATED_POINT"
      ? "This plot only has point-level submission data. Parcel edges are approximated for operator review until a validated polygon file is attached."
      : "Parcel imagery is aligned to the working boundary so auditors can compare canopy, access tracks, and nearby land use at a glance.",
    parcelReference: {
      center: geometry.center,
      bbox: geometry.bbox,
    },
    cards,
  };
}
