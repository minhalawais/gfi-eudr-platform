import { NextRequest, NextResponse } from "next/server";
import type { DeforestationCase, PlotRecord } from "@/lib/gfi-dummy-data";
import { buildImageryResponse } from "@/lib/eo-imagery";

interface ImageryRequestPayload {
  plot?: PlotRecord;
  deforestationCase?: DeforestationCase | null;
  parcelOnly?: boolean;
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as ImageryRequestPayload;

  if (!payload.plot) {
    return NextResponse.json({ error: "Plot payload is required." }, { status: 400 });
  }

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const sentinelConfigured = Boolean(
    process.env.SENTINEL_HUB_CLIENT_ID ||
    process.env.SENTINEL_HUB_INSTANCE_ID ||
    process.env.SENTINEL_HUB_COLLECTION_ID,
  );

  const response = buildImageryResponse({
    plot: payload.plot,
    deforestationCase: payload.deforestationCase ?? null,
    mapboxToken,
    sentinelConfigured,
    parcelOnly: payload.parcelOnly,
  });

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
