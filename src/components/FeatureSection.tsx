import type { ReactNode } from "react";
import { Reveal } from "@/components/Reveal";
import { Arrow } from "@/components/sx";

interface SubItem {
  number: string;
  label: string;
  href: string;
}

export interface FeatureSectionProps {
  /** Two-digit module index, e.g. "01". */
  sectionNumber: string;
  sectionLabel: string;
  sectionHref: string;
  heading: string;
  description: string;
  /** Rows of the spec list under the lede. */
  subItems: SubItem[];
  mockup: ReactNode;
  /** Which side the text column sits on at desktop widths. */
  side?: "left" | "right";
  className?: string;
}

const MODULE_COUNT = 5;

/** One "mission module" of the homepage: index, overline, uppercase title,
    lede and a spec list on one side, the product mockup in a framed HUD
    panel on the other. Sides alternate through the `side` prop. */
export function FeatureSection({
  sectionNumber,
  sectionLabel,
  sectionHref,
  heading,
  description,
  subItems,
  mockup,
  side = "left",
  className,
}: FeatureSectionProps) {
  const headingLines = heading.split("\n");
  const textRight = side === "right";
  const current = parseInt(sectionNumber, 10);

  return (
    <section
      id={sectionLabel.toLowerCase().replace(/\s*\(.*\)/, "").trim()}
      className={`sx-section-tight ${className ?? ""}`}
      style={{ background: "var(--sx-bg)", scrollMarginTop: 72, overflowX: "clip" }}
    >
      <div className="sx-container">
        {/* Module strip: index on the left, stage tracker on the right */}
        <div
          className="flex items-center justify-between"
          style={{ gap: 16, paddingTop: 16, borderTop: "1px solid var(--sx-line)" }}
        >
          <div className="sx-overline flex items-center" style={{ gap: 10, color: "var(--sx-text-4)" }}>
            <span>Module</span>
            <span className="sx-num" style={{ color: "var(--sx-text-2)" }}>
              {sectionNumber}
            </span>
            <span aria-hidden="true">/</span>
            <span className="sx-num">{String(MODULE_COUNT).padStart(2, "0")}</span>
          </div>
          <div aria-hidden="true" className="flex items-center" style={{ gap: 4 }}>
            {Array.from({ length: MODULE_COUNT }).map((_, i) => (
              <span
                key={i}
                style={{
                  width: i + 1 === current ? 32 : 16,
                  height: 2,
                  borderRadius: 1,
                  background:
                    i + 1 === current ? "var(--sx-accent)" : i + 1 < current ? "var(--sx-text-4)" : "var(--sx-text-5)",
                }}
              />
            ))}
          </div>
        </div>

        <div
          className="grid grid-cols-1 lg:grid-cols-12 lg:items-center"
          style={{ marginTop: "clamp(40px, 6vw, 72px)", columnGap: "clamp(40px, 5vw, 80px)", rowGap: 48 }}
        >
          {/* Text column */}
          <Reveal className={`lg:col-span-5 ${textRight ? "lg:order-2" : ""}`}>
            <div className="flex items-end" style={{ gap: 16 }}>
              <span
                className="sx-num"
                aria-hidden="true"
                style={{
                  fontSize: "clamp(56px, 6vw, 88px)",
                  fontWeight: 300,
                  lineHeight: 0.8,
                  color: "transparent",
                  WebkitTextStroke: "1px var(--sx-text-4)",
                }}
              >
                {sectionNumber}
              </span>
              <span className="sx-overline sx-overline-accent" style={{ paddingBottom: 2 }}>
                {sectionLabel}
              </span>
            </div>

            <h2 className="sx-h2" style={{ marginTop: 28, fontSize: "clamp(30px, 3.1vw, 44px)", lineHeight: 1.04 }}>
              {headingLines.map((line, i) => (
                <span key={i} className="md:block" style={{ textWrap: "balance" }}>
                  {line}
                  {i < headingLines.length - 1 && " "}
                </span>
              ))}
            </h2>

            <p className="sx-lede" style={{ marginTop: 22, maxWidth: 480 }}>
              {description}
            </p>

            {subItems.length > 0 && (
              <div style={{ marginTop: 36, maxWidth: 480 }}>
                <div
                  className="flex items-center justify-between"
                  style={{ paddingBottom: 12, borderBottom: "1px solid var(--sx-line-strong)" }}
                >
                  <span className="sx-overline" style={{ fontSize: 10 }}>Specification</span>
                  <span className="sx-overline sx-num" style={{ fontSize: 10, color: "var(--sx-text-4)" }}>
                    {String(subItems.length).padStart(2, "0")} items
                  </span>
                </div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {subItems.map((item) => {
                    const row = (
                      <>
                        <span className="sx-num" style={{ fontSize: 13, color: "var(--sx-text-4)", width: 36, flexShrink: 0 }}>
                          {item.number}
                        </span>
                        <span style={{ flex: 1, fontSize: 15, color: "var(--sx-text)" }}>{item.label}</span>
                        <span aria-hidden="true" style={{ width: 6, height: 6, border: "1px solid var(--sx-text-4)", borderRadius: 1, flexShrink: 0 }} />
                      </>
                    );
                    const rowStyle = {
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 0",
                      borderBottom: "1px solid var(--sx-line)",
                    } as const;
                    return (
                      <li key={item.number}>
                        {item.href && item.href !== "#" ? (
                          <a href={item.href} style={{ ...rowStyle, textDecoration: "none" }}>
                            {row}
                          </a>
                        ) : (
                          <div style={rowStyle}>{row}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <a href={sectionHref} className="sx-btn sx-btn-secondary sx-btn-sm" style={{ marginTop: 32 }}>
              More on {sectionLabel.toLowerCase()} <Arrow size={12} />
            </a>
          </Reveal>

          {/* Mockup in a framed HUD panel */}
          <Reveal delay={120} className={`lg:col-span-7 ${textRight ? "lg:order-1" : ""}`}>
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute pointer-events-none"
                style={{
                  inset: "-12% -8%",
                  background: "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(255, 236, 216,0.09), transparent 70%)",
                }}
              />
              <div
                className="relative sx-hud"
                style={{
                  padding: "clamp(8px, 1.2vw, 14px)",
                  border: "1px solid var(--sx-line)",
                  borderRadius: "var(--sx-r-xs)",
                  background: "rgba(255,255,255,0.012)",
                }}
              >
                <div
                  className="flex items-center justify-between"
                  style={{ gap: 12, padding: "2px 4px 12px" }}
                >
                  <span className="sx-overline" style={{ fontSize: 10, color: "var(--sx-text-4)" }}>
                    Fig. <span className="sx-num">{sectionNumber}</span>
                  </span>
                  <span className="sx-overline" style={{ fontSize: 10, color: "var(--sx-text-4)" }}>
                    {sectionLabel}
                  </span>
                </div>
                <div className="lg:min-h-[580px] flex flex-col">{mockup}</div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── Pre-configured section exports ────────────────────────────────────────

export const INTAKE_SECTION: Omit<FeatureSectionProps, "mockup"> = {
  sectionNumber: "01",
  sectionLabel: "Accounts",
  sectionHref: "/signup",
  heading: "A single account.\nPeople and agents alike.",
  description:
    "Accounts for people and accounts for AI agents sit next to each other on the same protocol. They are non-custodial, shielded with ZK, and governed by spending policies on-chain rather than rules on a server. Your funds take orders from you, not from a database.",
  subItems: [
    { number: "1.1", label: "Accounts for people", href: "#" },
    { number: "1.2", label: "Accounts for agents", href: "#" },
    { number: "1.3", label: "Multi-signature vaults", href: "#" },
    { number: "1.4", label: "Handles ending in .sectoral", href: "#" },
  ],
};

export const PLAN_SECTION: Omit<FeatureSectionProps, "mockup"> = {
  sectionNumber: "02",
  sectionLabel: "Privacy",
  sectionHref: "/signup",
  side: "right",
  heading: "Private from the start.\nOpen to audit on your terms.",
  description:
    "ElGamal encryption covers every amount, and ZK range proofs show it is correct. No observer can read it, yet anyone can verify it. Whenever you decide to share, a view key exposes only what you pick and nothing beyond that.",
  subItems: [
    { number: "2.1", label: "Encrypted amounts", href: "#" },
    { number: "2.2", label: "State kept shielded", href: "#" },
    { number: "2.3", label: "Range proofs in ZK", href: "#" },
    { number: "2.4", label: "Read access via view keys", href: "#" },
  ],
};

export const BUILD_SECTION: Omit<FeatureSectionProps, "mockup"> = {
  sectionNumber: "03",
  sectionLabel: "Agents",
  sectionHref: "/signup",
  heading: "Agents that cover\ntheir own costs.",
  description:
    "An agent account handles x402 payment requests by itself, without anyone stepping in. Because spending policies live on-chain, no agent can exceed its mandate, and MPP routing breaks each payment apart to keep it private.",
  subItems: [
    { number: "3.1", label: "The x402 protocol", href: "#" },
    { number: "3.2", label: "Spend policies", href: "#" },
    { number: "3.3", label: "SDK for agents", href: "#" },
    { number: "3.4", label: "Routing with MPP", href: "#" },
    { number: "3.5", label: "Nested agent hierarchies", href: "#" },
  ],
};

export const DIFFS_SECTION: Omit<FeatureSectionProps, "mockup"> = {
  sectionNumber: "04",
  sectionLabel: "Protocol",
  sectionHref: "/signup",
  side: "right",
  heading: "Each payment takes\na private path.",
  description:
    "Multi-Path Payments break a transfer into pieces sent along parallel routes, so nobody watching can see all of it. Settlement is still atomic. Stealth addresses keep receipts from being linked together. Anyone trying to surveil it comes away with nothing.",
  subItems: [],
};

export const MONITOR_SECTION: Omit<FeatureSectionProps, "mockup"> = {
  sectionNumber: "05",
  sectionLabel: "Transparency",
  sectionHref: "/signup",
  heading: "Share what you choose.\nProve everything.",
  description:
    "The chain proves that each transaction happened, while the amounts remain encrypted. A view key gives an auditor read-only access, the public sees nothing, and custody stays with you the whole time.",
  subItems: [
    { number: "5.1", label: "Receipts recorded on-chain", href: "#" },
    { number: "5.2", label: "Disclosure you control", href: "#" },
    { number: "5.3", label: "Exports for audits", href: "#" },
  ],
};
