import Link from "next/link";
import Image from "next/image";

import { organizationProfile, scenarioOptions } from "@/lib/gfi-dummy-data";

export default function HomeGatewayPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(217, 242, 79, 0.12), transparent 32%), linear-gradient(135deg, #00281D 0%, #003B2B 52%, #0B4D3A 100%)",
        color: "#FFFFFF",
        fontFamily: "var(--font-sans)",
        display: "flex",
        flexDirection: "column",
        padding: "var(--space-10) var(--space-8)",
      }}
    >
      <div style={{ maxWidth: "1180px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
        <header style={{ display: "grid", gridTemplateColumns: "1.4fr 0.9fr", gap: "var(--space-6)", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Image src="/jojo_logo.png" alt="JOJO logo" width={164} height={62} style={{ width: "164px", height: "auto" }} priority />
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.06)" }}>
                <Image src="/fos_square_logo.png" alt="Fruit of Sustainability logo" width={18} height={18} />
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.86)", fontWeight: 600 }}>Developed by Fruit of Sustainability</span>
              </div>
            </div>
            <span
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--fos-accent)",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              GFI EUDR operating model
            </span>
            <h1 style={{ fontSize: "3.25rem", fontWeight: 900, lineHeight: 1.05, maxWidth: "760px" }}>
              Dummy frontend for a real EUDR compliance workflow.
            </h1>
            <p style={{ maxWidth: "760px", color: "rgba(255,255,255,0.78)", fontSize: "var(--text-base)", lineHeight: 1.7 }}>
              This frontend is intentionally backend-free for now, but it is no longer a generic demo. It is shaped around the documented GFI operating reality:
              GFI acts as a non-EU supplier that hands complete compliance packages to EU operator agents, while cocoa provenance remains the critical fail-closed path.
            </p>
            <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
              <Link href="/dashboard" className="btn-primary">
                Open internal workspace
              </Link>
              <Link
                href="/agent"
                className="btn-secondary"
                style={{ background: "transparent", color: "white", borderColor: "rgba(255,255,255,0.22)" }}
              >
                Review EU agent portal
              </Link>
            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-6)",
              backdropFilter: "blur(10px)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
            }}
          >
            <div>
              <p style={{ fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.56)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Tenant context
              </p>
              <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 800, marginTop: "4px" }}>{organizationProfile.name}</h2>
            </div>
            <div style={{ display: "grid", gap: "var(--space-3)" }}>
              <div>
                <p style={{ fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.56)" }}>Legal role</p>
                <p style={{ fontWeight: 700 }}>{organizationProfile.legalRole}</p>
              </div>
              <div>
                <p style={{ fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.56)" }}>Default output mode</p>
                <p style={{ fontWeight: 700 }}>{organizationProfile.defaultOutputMode.replace(/_/g, " ")}</p>
              </div>
              <div>
                <p style={{ fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.56)" }}>Primary market flow</p>
                <p style={{ fontWeight: 700 }}>{organizationProfile.primaryMarketFlow}</p>
              </div>
            </div>
          </div>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: "var(--space-5)" }}>
          {[
            {
              label: "Internal compliance workspace",
              title: "Operators and reviewers",
              body: "Follow the chain from product and BOM through suppliers, plots, traceability, consignment gating, and package release.",
              href: "/dashboard",
            },
            {
              label: "Supplier response portal",
              title: "JB Cocoa and Indococoa tasks",
              body: "Review the dummy token-style workflow for processor declarations, plot uploads, document corrections, and final attestation.",
              href: "/supplier",
            },
            {
              label: "EU agent dossier portal",
              title: "Operator handoff experience",
              body: "Inspect compliance packages, missing evidence, scope memoranda, and readiness status before an EU operator acts.",
              href: "/agent",
            },
          ].map((card) => (
            <div
              key={card.title}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-6)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-4)",
                minHeight: "240px",
              }}
            >
              <span style={{ fontSize: "var(--text-xs)", color: "var(--fos-accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {card.label}
              </span>
              <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 800 }}>{card.title}</h2>
              <p style={{ color: "rgba(255,255,255,0.76)", lineHeight: 1.6 }}>{card.body}</p>
              <Link href={card.href as any} className="btn-secondary" style={{ marginTop: "auto", width: "fit-content", background: "transparent", color: "white", borderColor: "rgba(255,255,255,0.22)" }}>
                Open route
              </Link>
            </div>
          ))}
        </section>

        <section
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-6)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          <div>
            <p style={{ fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.56)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Scenario library
            </p>
            <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, marginTop: "4px" }}>
              Shared dummy truth for walkthroughs and sign-off
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-4)" }}>
            {scenarioOptions.map((scenario) => (
              <div key={scenario.id} style={{ padding: "16px", borderRadius: "var(--radius-md)", background: "rgba(0,0,0,0.12)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h3 style={{ fontSize: "var(--text-base)", fontWeight: 800 }}>{scenario.label}</h3>
                <p style={{ marginTop: "8px", fontSize: "var(--text-sm)", color: "rgba(255,255,255,0.78)", lineHeight: 1.55 }}>
                  {scenario.summary}
                </p>
                <p style={{ marginTop: "10px", fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.56)" }}>
                  {scenario.businessMeaning}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
