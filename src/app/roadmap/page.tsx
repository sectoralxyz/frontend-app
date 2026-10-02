import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Arrow } from "@/components/sx";

export const metadata: Metadata = {
  title: "Sectoral Roadmap: What Comes Next",
  description:
    "The direction Sectoral is taking, starting with the confidential transfers and agent accounts already live and moving toward shielded state, routing across chains, and complete privacy.",
};

type PhaseStatus = "live" | "next" | "planned";

const PHASES: {
  tag: string;
  status: PhaseStatus;
  title: string;
  description: string;
  items: string[];
}[] = [
  {
    tag: "Beta · Available today",
    status: "live",
    title: "Private foundations",
    description:
      "The base layer already runs on mainnet, moving confidential money for people and agents right now.",
    items: [
      "Transfers with encrypted amounts, backed by ZK range proofs",
      "Accounts for agents, governed by spend policies on-chain",
      "Built-in x402 payments plus MPP routing",
      "REST API, Agent SDK and webhooks",
      "Virtual debit cards on Visa and Mastercard",
    ],
  },
  {
    tag: "v1.0 · Coming next",
    status: "next",
    title: "Banking for all",
    description:
      "Connecting legacy rails to new ones, so funds can come in and go out with privacy kept from start to finish.",
    items: [
      "Fiat ramps in both directions",
      "An app for mobile",
      "Layer 3 shielded state, with balances committed to a Merkle tree and stealth addresses",
    ],
  },
  {
    tag: "v1.5 · On the roadmap",
    status: "planned",
    title: "Enterprises and interoperability",
    description:
      "Private finance stretches past one chain and into larger organizations.",
    items: [
      "An enterprise tier that deploys agents in bulk",
      "A compliance API for disclosure through view keys, at scale",
      "Routing across chains, covering Ethereum, Arbitrum One and Base",
    ],
  },
  {
    tag: "v2.0 · On the roadmap",
    status: "planned",
    title: "Complete privacy",
    description:
      "Where confidentiality ends up: whole account states shielded, while compliance can still be proven whenever it is asked for.",
    items: [
      "Layer 4, complete privacy for verified enterprise accounts",
      "Shielded pools that use association sets",
      "DeFi yield on USDG balances that sit idle",
    ],
  },
];

const STATUS_TAG: Record<PhaseStatus, { label: string; className: string }> = {
  live: { label: "Live", className: "sx-tag sx-tag-ok" },
  next: { label: "Next", className: "sx-tag sx-tag-accent" },
  planned: { label: "Planned", className: "sx-tag" },
};

function Node({ status }: { status: PhaseStatus }) {
  const live = status === "live";
  const next = status === "next";
  return (
    <span
      aria-hidden="true"
      style={{
        display: "block",
        width: 13,
        height: 13,
        borderRadius: "50%",
        background: live ? "var(--sx-ok)" : "var(--sx-bg)",
        border: `1px solid ${live ? "var(--sx-ok)" : next ? "var(--sx-accent)" : "var(--sx-text-4)"}`,
        boxShadow: live
          ? "0 0 0 5px var(--sx-ok-bg), 0 0 18px rgba(70,192,138,0.5)"
          : next
            ? "0 0 0 5px var(--sx-bg), inset 0 0 0 3px var(--sx-bg), inset 0 0 0 6px var(--sx-accent)"
            : "0 0 0 5px var(--sx-bg)",
      }}
    />
  );
}

export default function RoadmapPage() {
  const liveCount = PHASES.filter((p) => p.status === "live").length;
  const itemCount = PHASES.reduce((n, p) => n + p.items.length, 0);

  return (
    <main style={{ background: "var(--sx-bg)", minHeight: "100vh" }}>
      <Navbar />

      {/* Header */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 sx-stars" />
        <div aria-hidden="true" className="absolute inset-0 sx-grid" style={{ opacity: 0.7 }} />
        <div aria-hidden="true" className="absolute inset-0 sx-noise" />
        <div
          className="sx-container relative"
          style={{ paddingTop: "clamp(140px, 18vw, 200px)", paddingBottom: "clamp(56px, 7vw, 88px)" }}
        >
          <div className="sx-overline sx-rise flex items-center" style={{ gap: 12 }}>
            <span className="sx-accent">Mission timeline</span>
            <span aria-hidden="true" style={{ width: 28, height: 1, background: "var(--sx-line-strong)" }} />
            <span>Where we&apos;re going</span>
          </div>
          <h1 className="sx-display sx-rise sx-d1" style={{ marginTop: 26, maxWidth: 940 }}>
            Building the money layer for the <span className="sx-gleam">age of agents</span>.
          </h1>
          <p className="sx-lede sx-rise sx-d2" style={{ marginTop: 28, maxWidth: 620 }}>
            We started with privacy. Each step after that opens it up to more people,
            from the crypto-native builders using it now to any person or agent that
            needs to move money. This is what Sectoral is working toward.
          </p>

          {/* Telemetry strip */}
          <dl className="sx-rise sx-d3 grid grid-cols-3" style={{ marginTop: "clamp(48px, 6vw, 72px)", maxWidth: 720 }}>
            {[
              { label: "Stages", value: PHASES.length },
              { label: "Live now", value: liveCount },
              { label: "Milestones", value: itemCount },
            ].map((t) => (
              <div key={t.label} style={{ borderTop: "1px solid var(--sx-line-strong)", paddingTop: 18, marginRight: 16 }}>
                <dt className="sx-overline">{t.label}</dt>
                <dd className="sx-telemetry-value" style={{ marginTop: 12 }}>
                  {String(t.value).padStart(2, "0")}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Timeline */}
      <section className="sx-container" style={{ paddingBottom: "clamp(88px, 11vw, 140px)" }}>
        <ol className="relative" style={{ listStyle: "none", padding: 0, margin: 0, borderTop: "1px solid var(--sx-line)" }}>
          {/* Rail: lit through the live stage, then fading out */}
          <span
            aria-hidden="true"
            className="absolute left-[6px] md:left-[246px]"
            style={{
              top: 0,
              bottom: 40,
              width: 1,
              background:
                "linear-gradient(180deg, var(--sx-ok) 0%, var(--sx-accent-line) 26%, var(--sx-line-strong) 50%, transparent 100%)",
            }}
          />

          {PHASES.map((phase, i) => {
            const tag = STATUS_TAG[phase.status];
            const [version, ...rest] = phase.tag.split(" · ");
            const planned = phase.status === "planned";
            return (
              <li
                key={phase.tag}
                className="relative grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)] pl-9 md:pl-0"
                style={{ paddingTop: "clamp(40px, 5vw, 64px)", paddingBottom: "clamp(40px, 5vw, 64px)", borderBottom: "1px solid var(--sx-line)" }}
              >
                <span className="absolute left-0 md:left-[240px]" style={{ top: "calc(clamp(40px, 5vw, 64px) + 6px)" }}>
                  <Node status={phase.status} />
                </span>

                {/* Stage meta */}
                <div className="flex md:flex-col items-baseline md:items-start" style={{ gap: 14, paddingRight: 24 }}>
                  <span className="sx-overline">
                    <span className="sx-accent">Stage 0{i + 1}</span>
                  </span>
                  <span
                    className="sx-num"
                    style={{
                      fontSize: "clamp(28px, 3vw, 40px)",
                      lineHeight: 1,
                      fontWeight: 400,
                      textTransform: "uppercase",
                      color: planned ? "var(--sx-text-3)" : "var(--sx-text)",
                    }}
                  >
                    {version}
                  </span>
                  {rest.length > 0 && (
                    <span className="sx-overline hidden md:inline" style={{ color: "var(--sx-text-4)" }}>
                      {rest.join(" · ")}
                    </span>
                  )}
                </div>

                {/* Stage body */}
                <div className="md:pl-14" style={{ marginTop: 0 }}>
                  <div className="flex flex-wrap items-center mt-5 md:mt-0" style={{ gap: 10 }}>
                    <span className={tag.className}>
                      {phase.status === "live" && <span className="sx-dot sx-dot-live" />}
                      {tag.label}
                    </span>
                    {rest.length > 0 && (
                      <span className="sx-overline md:hidden" style={{ color: "var(--sx-text-4)" }}>
                        {rest.join(" · ")}
                      </span>
                    )}
                  </div>
                  <h2
                    className="sx-h3"
                    style={{
                      marginTop: 18,
                      fontSize: "clamp(24px, 2.4vw, 32px)",
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                      color: planned ? "var(--sx-text-2)" : "var(--sx-text)",
                    }}
                  >
                    {phase.title}
                  </h2>
                  <p className="sx-body" style={{ marginTop: 12, maxWidth: 600 }}>
                    {phase.description}
                  </p>
                  <ul
                    className="grid grid-cols-1 lg:grid-cols-2"
                    style={{ marginTop: 28, listStyle: "none", padding: 0, columnGap: 32, maxWidth: 880 }}
                  >
                    {phase.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start"
                        style={{ gap: 12, padding: "14px 0", borderTop: "1px solid var(--sx-line)" }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            marginTop: 8,
                            width: 8,
                            height: 1,
                            flexShrink: 0,
                            background: phase.status === "live" ? "var(--sx-ok)" : phase.status === "next" ? "var(--sx-accent)" : "var(--sx-text-4)",
                          }}
                        />
                        <span style={{ fontSize: 14, lineHeight: 1.55, color: planned ? "var(--sx-text-3)" : "var(--sx-text-2)" }}>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          })}
        </ol>

        <div
          className="flex flex-col md:flex-row md:items-center md:justify-between"
          style={{ gap: 28, marginTop: "clamp(48px, 6vw, 72px)" }}
        >
          <p className="sx-caption" style={{ maxWidth: 520 }}>
            This plan shows our present direction. Each item ships once it is ready, with no fixed date attached.
          </p>
          <div>
            <Link href="/signup" className="sx-btn sx-btn-primary sx-btn-lg">
              Get into the beta <Arrow />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
