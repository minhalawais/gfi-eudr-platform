"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IngredientTraceabilityStudio } from "@/components/traceability/IngredientTraceabilityStudio";
import { OnSiteTraceabilityStudio } from "@/components/traceability/OnSiteTraceabilityStudio";
import { useSession } from "@/components/ui/PermissionGuard";
import { buildIngredientTraceabilityViewModel } from "@/lib/ingredient-traceability";
import {
  SectionHeader,
} from "@/components/ui";

type TraceabilitySubview = "UPSTREAM" | "ONSITE";

function TraceabilityPageContent() {
  const {
    scenarioId,
    suppliers,
    products,
    consignments,
    documents,
    supplyChainNodes,
    eudrFormRequests,
    intermediaryDeclarationSubmissions,
    farmerDeclarationSubmissions,
    eudrEvidenceAttachments,
  } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeSubview, setActiveSubview] = useState<TraceabilitySubview>("UPSTREAM");
  const [selectedId, setSelectedId] = useState("");

  const ingredientViewModel = useMemo(
    () =>
      buildIngredientTraceabilityViewModel({
        products,
        consignments,
        supplyChainNodes,
        eudrFormRequests,
        intermediaryDeclarationSubmissions,
        farmerDeclarationSubmissions,
        eudrEvidenceAttachments,
      }),
    [
      consignments,
      eudrEvidenceAttachments,
      eudrFormRequests,
      farmerDeclarationSubmissions,
      intermediaryDeclarationSubmissions,
      products,
      supplyChainNodes,
    ],
  );

  useEffect(() => {
    const queryMode = searchParams.get("mode");
    if (queryMode === "onsite") {
      setActiveSubview("ONSITE");
      return;
    }
    setActiveSubview("UPSTREAM");
  }, [searchParams]);

  useEffect(() => {
    if (activeSubview === "UPSTREAM") {
      if (selectedId && ingredientViewModel.rootById[selectedId]) {
        return;
      }

      const productId = searchParams.get("productId");
      const ingredientId = searchParams.get("ingredientId");
      const supplierId = searchParams.get("supplierId");
      const requestedRoot = ingredientViewModel.roots.find(
        (root) => root.productId === productId && root.ingredientId === ingredientId && root.supplierId === supplierId,
      );

      if (requestedRoot) {
        setSelectedId(requestedRoot.rootId);
        return;
      }

      if (ingredientViewModel.roots[0]) {
        setSelectedId(ingredientViewModel.roots[0].rootId);
      }
      return;
    }

    if (activeSubview === "ONSITE") {
      setSelectedId("");
    }
  }, [activeSubview, ingredientViewModel, searchParams, selectedId]);

  useEffect(() => {
    if (activeSubview === "UPSTREAM") {
      const selectedRoot = ingredientViewModel.rootById[selectedId] ?? ingredientViewModel.roots[0];
      if (!selectedRoot) {
        return;
      }
      const params = new URLSearchParams({
        mode: "ingredient",
        productId: selectedRoot.productId,
        ingredientId: selectedRoot.ingredientId,
        supplierId: selectedRoot.supplierId,
      });
      router.replace(`${pathname}?${params.toString()}` as any, { scroll: false });
      return;
    }

    router.replace(`${pathname}?mode=onsite` as any, { scroll: false });
  }, [activeSubview, ingredientViewModel.rootById, ingredientViewModel.roots, pathname, router, selectedId]);

  return (
    <div className="flex w-full flex-col gap-6">
      <SectionHeader
        title="Supply Chain Tracebility"
        description="Track upstream provenance and compliance posture of raw materials and ingredients throughout the supply chain."
      />

      {activeSubview === "UPSTREAM" ? (
        <IngredientTraceabilityStudio
          viewModel={ingredientViewModel}
          selectedRootId={selectedId || ingredientViewModel.roots[0]?.rootId || ""}
          onSelectRoot={setSelectedId}
        />
      ) : (
        <OnSiteTraceabilityStudio
          products={products}
          suppliers={suppliers}
          consignments={consignments}
          documents={documents}
        />
      )}
    </div>
  );
}

export default function TraceabilityPage() {
  return (
    <Suspense fallback={<div className="rounded-lg border border-border-soft bg-bg-surface p-4">Loading traceability workspace...</div>}>
      <TraceabilityPageContent />
    </Suspense>
  );
}
