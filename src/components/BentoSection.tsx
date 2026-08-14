import Link from "next/link";
import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { Reveal } from "@/components/Reveal";
import { SectionHeader, Arrow } from "@/components/sx";

/* ── Micro-visuals: small instrument readouts, CSS/SVG only ─────────────── */

const label: CSSProperties = {
  fontFamily: "var(--sx-display)",
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--sx-text-3)",
};

function MaskedTransferVisual() {
  const rows = [
    { who: "What the public sees", value: "▮▮▮▮▮▮", dim: true },
    { who: "What you see", value: "$1,240.50", dim: false },
    { who: "Auditor holding a view key", value: "$1,240.50", dim: false },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((r, i) => (
        <div
          key={r.who}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "11px 14px",
            borderRadius: "var(--sx-r-md)",
            border: `1px solid ${i === 1 ? "var(--sx-accent-line)" : "var(--sx-line)"}`,
            background: i === 1 ? "var(--sx-accent-surface)" : "rgba(255,255,255,0.02)",
          }}
        >
          <span style={{ ...label, color: i === 1 ? "var(--sx-text-2)" : "var(--sx-text-3)" }}>{r.who}</span>
          <span
            className="sx-num"
            style={{
              fontSize: 15,
              letterSpacing: r.dim ? "2px" : "0.02em",
              color: r.dim ? "var(--sx-text-5)" : "var(--sx-text)",
              whiteSpace: "nowrap",
            }}
          >
            {r.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function SpendPolicyVisual() {
  const bars = [
    { label: "Per-day cap", used: 12.4, max: 50 },
    { label: "Each request", used: 0.25, max: 5 },
    { label: "Approved domains", used: 2, max: 2, text: "2 of 2" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {bars.map((b) => {
        const pct = Math.min(100, (b.used / b.max) * 100);
        return (
          <div key={b.label}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
              <span style={label}>{b.label}</span>
              <span className="sx-num" style={{ fontSize: 12, color: "var(--sx-text-2)", whiteSpace: "nowrap" }}>
                {b.text ?? `$${b.used.toFixed(2)} / $${b.max.toFixed(2)}`}
              </span>
            </div>
            <div className="sx-meter">
              <span style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
      <div className="flex items-center" style={{ ...label, gap: 8, marginTop: 2, color: "var(--sx-text-4)" }}>
        <span className="sx-dot sx-dot-live" style={{ width: 5, height: 5 }} />
        Checked on-chain / the protocol reverts any overspend
      </div>
    </div>
  );
}

function CardVisual() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", padding: "8px 0" }}>
      <Image
        src="/images/card.png"
        alt="Sectoral virtual debit card ending in 7346"
        width={1290}
        height={813}
        sizes="(min-width: 1024px) 300px, 80vw"
        style={{
          width: "100%",
          maxWidth: 300,
          height: "auto",
          borderRadius: "var(--sx-r-lg)",
          transform: "rotate(-4deg)",
          boxShadow: "0 24px 50px rgba(0,0,0,0.55), 0 0 0 1px var(--sx-line)",
        }}
      />
    </div>
  );
}

function X402Visual() {
  const lines = [
    { t: "GET api.marketfeed.io/v1/market-data", c: "var(--sx-text-2)" },
    { t: "← 402 Payment Required · 0.25 USDG", c: "var(--sx-text-3)" },
    { t: "policy ok · confidential transfer · 1 block", c: "var(--sx-text-3)" },
    { t: "→ retry with X-Payment · 200 OK", c: "var(--sx-accent)" },
  ];
  return (
    <div
      style={{
        borderRadius: "var(--sx-r-md)",
        border: "1px solid var(--sx-line)",
        background: "rgba(0,0,0,0.4)",
        overflow: "hidden",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ padding: "9px 14px", borderBottom: "1px solid var(--sx-line)" }}
      >
        <span style={label}>agent / request log</span>
        <span className="flex items-center" style={{ ...label, gap: 6 }}>
          <span className="sx-dot sx-dot-live" style={{ width: 5, height: 5 }} />
          Live
        </span>
      </div>
      <div style={{ padding: "12px 14px", fontFamily: "var(--sx-mono)", fontSize: 11.5, lineHeight: "22px" }}>
        {lines.map((l, i) => (
          <div key={i} style={{ color: l.c, display: "flex", gap: 12 }}>
            <span style={{ color: "var(--sx-text-5)", flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
            <span style={{ minWidth: 0 }}>{l.t}</span>
          </div>
        ))}
        <div style={{ color: "var(--sx-text-5)" }}>
          05{" "}
          <span
            className="sx-blink"
            style={{ display: "inline-block", width: 7, height: 13, marginLeft: 8, verticalAlign: "-2px", background: "var(--sx-accent)" }}
          />
        </div>
      </div>
    </div>
  );
}

function ViewKeyVisual() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "var(--sx-r-md)",
            border: "1px solid var(--sx-accent-line)",
            background: "var(--sx-accent-surface)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            color: "var(--sx-accent)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="8" cy="12" r="4" />
            <path d="M12 12h9M18 12v3M15 12v2" />
          </svg>
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="sx-mono" style={{ fontSize: 13, color: "var(--sx-text)" }}>auditor.sectoral</div>
          <div style={{ ...label, marginTop: 6 }}>View key / scoped</div>
        </div>
      </div>
      <div className="flex flex-wrap" style={{ gap: 6 }}>
        <span className="sx-tag">Read-only</span>
        <span className="sx-tag">Q1 transfers</span>
        <span className="sx-tag sx-tag-accent">Can be revoked</span>
      </div>
    </div>
  );
}

function SettlementVisual() {
  const blocks = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="flex items-end justify-between" style={{ gap: 16 }}>
        <div>
          <div style={label}>Block time</div>
          <div className="sx-telemetry-value" style={{ marginTop: 8 }}>100ms</div>
        </div>
        <span className="sx-tag sx-tag-ok">
          <span className="sx-dot sx-dot-live" style={{ width: 5, height: 5 }} />
          Final
        </span>
      </div>
      <div style={{ display: "flex", gap: 4 }} aria-hidden="true">
        {blocks.map((i) => (
          <span
            key={i}
            style={{
              flex: 1,
              height: 18,
              borderRadius: 3,
              background: i === blocks.length - 1 ? "var(--sx-accent)" : `rgba(242,245,248,${0.04 + i * 0.012})`,
              boxShadow: i === blocks.length - 1 ? "0 0 12px rgba(255, 236, 216,0.6)" : "none",
            }}
          />
        ))}
      </div>
      <div style={{ ...label, color: "var(--sx-text-4)" }}>Blocks / Ethereum-backed security</div>
    </div>
  );
}

/* ── Tiles ──────────────────────────────────────────────────────────────── */

type Tile = {
  overline: string;
  title: string;
  body: string;
  href: string;
  visual: ReactNode;
  /** Column span on the 12-column desktop grid */
  span: string;
};

const TILES: Tile[] = [
  {
    overline: "Privacy",
    title: "Encrypted transfers",
    body: "ElGamal encryption hides each amount, and ZK range proofs show it is valid. The chain checks every transfer while never finding out the figure.",
    href: "#privacy",
    visual: <MaskedTransferVisual />,
    span: "lg:col-span-7",
  },
  {
    overline: "Agents",
    title: "Agent accounts bound by on-chain spend policies",
    body: "Each agent gets a separate account and separate limits it cannot break. The policy is checked before any transaction is signed.",
    href: "#agents",
    visual: <SpendPolicyVisual />,
    span: "lg:col-span-5",
  },
  {
    overline: "Cards",
    title: "Virtual debit cards",
    body: "Use your private balance wherever cards are accepted. Freeze or rotate a card, and show its details only when it matters.",
    href: "#accounts",
    visual: <CardVisual />,
    span: "lg:col-span-5",
  },
  {
    overline: "Payments",
    title: "x402 payments, built in",
    body: "Agents settle API calls one request at a time, without waiting on a person, and each payment is recorded.",
    href: "#agents",
    visual: <X402Visual />,
    span: "lg:col-span-7",
  },
  {
    overline: "Audit",
    title: "View keys for auditors",
    body: "Show an auditor precisely what they need and not a byte beyond it. Scoped, read-only, and revocable whenever you choose.",
    href: "#transparency",
    visual: <ViewKeyVisual />,
    span: "lg:col-span-6",
  },
  {
    overline: "Settlement",
    title: "Settlement on Robinhood Chain",
    body: "Final in the next block for a fraction of a cent, with Ethereum as the anchor.",
    href: "#protocol",
    visual: <SettlementVisual />,
    span: "lg:col-span-6",
  },
];

export function BentoSection() {
  return (
    <section id="features" className="sx-section relative" style={{ background: "var(--sx-bg)", borderTop: "1px solid var(--sx-line)" }}>
      <div className="sx-container">
        <Reveal>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between" style={{ gap: 28, marginBottom: "clamp(48px, 6vw, 72px)" }}>
            <SectionHeader
              index="02"
              overline="What you get"
              title={
                <>
                  All the tools of a private bank.
                  <br />
                  <span style={{ color: "var(--sx-text-4)" }}>None of the prying.</span>
                </>
              }
            />
            <p className="sx-body" style={{ maxWidth: 420, margin: 0 }}>
              People and their agents share a single protocol. The chain itself enforces each feature listed here,
              rather than a promise written in a policy.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12" style={{ gap: 16 }}>
          {TILES.map((tile, i) => (
            <Reveal key={tile.title} className={`${tile.span} flex`} delay={(i % 2) * 90}>
              <Link
                href={tile.href}
                className="sx-card sx-card-interactive sx-hud group flex flex-col"
                style={{ textDecoration: "none", width: "100%", padding: "clamp(20px, 2.2vw, 28px)", gap: 24 }}
              >
                {/* Tile header: index, system name, arrow */}
                <div className="flex items-center justify-between">
                  <div className="sx-overline flex items-center" style={{ gap: 10 }}>
                    <span className="sx-accent sx-num">{String(i + 1).padStart(2, "0")}</span>
                    <span aria-hidden="true" style={{ width: 18, height: 1, background: "var(--sx-line-strong)" }} />
                    <span>{tile.overline}</span>
                  </div>
                  <span
                    aria-hidden="true"
                    className="transition-colors group-hover:text-[var(--sx-accent)]"
                    style={{ color: "var(--sx-text-4)", display: "inline-flex" }}
                  >
                    <Arrow />
                  </span>
                </div>

                {/* Instrument panel */}
                <div
                  style={{
                    flex: 1,
                    minHeight: 168,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    padding: "clamp(16px, 2vw, 22px)",
                    borderRadius: "var(--sx-r-lg)",
                    border: "1px solid var(--sx-line)",
                    background:
                      "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px) 0 0 / 24px 24px, var(--sx-raised)",
                  }}
                >
                  {tile.visual}
                </div>

                <div>
                  <h3 className="sx-h3" style={{ margin: 0 }}>{tile.title}</h3>
                  <p className="sx-small" style={{ margin: "10px 0 0", maxWidth: 520, fontSize: 14 }}>{tile.body}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
