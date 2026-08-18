import { Reveal } from "@/components/Reveal";
import { SectionHeader } from "@/components/sx";

const STEPS = [
  {
    n: "01",
    t: "T-2",
    label: "Duration",
    title: "Create your account",
    body: "All it takes is an email and a passkey. We verify your identity a single time, your keys are made on your device, and your balances never leave it unencrypted.",
    meta: "Done in less than two minutes",
  },
  {
    n: "02",
    t: "T-1",
    label: "Credit",
    title: "Add USDG",
    body: "Move in Global Dollar on Robinhood Chain, or top up straight from a wallet. A small ETH reserve pays gas on its own, so fees never need your attention.",
    meta: "Credited in the next block",
  },
  {
    n: "03",
    t: "T-0",
    label: "Settlement",
    title: "Pay in private. Hand work to agents.",
    body: "Send an encrypted amount to any @handle, or create an agent account with a spend policy and let it cover its own costs over x402.",
    meta: "Settles in 100ms",
  },
];

/* Flight sequence: three stages strung along a hairline rail. The rail runs
   horizontally on wide screens and vertically on small ones; each stage's node
   sits at its top left corner so one position works for both. */
export function HowItWorksSection() {
  return (
    <section className="sx-section" style={{ background: "var(--sx-bg)", borderTop: "1px solid var(--sx-line)" }}>
      <div className="sx-container">
        <Reveal>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between" style={{ gap: 32 }}>
            <SectionHeader
              index="03"
              overline="Getting started"
              title="Three steps take you from a new account to your first confidential payment."
              maxWidth={860}
            />
            <div className="sx-overline flex items-center" style={{ gap: 10, whiteSpace: "nowrap", paddingBottom: 6 }}>
              <span className="sx-dot sx-dot-accent" />
              <span>Sequence</span>
              <span aria-hidden="true" style={{ color: "var(--sx-text-5)" }}>/</span>
              <span style={{ color: "var(--sx-text-2)" }}>3 stages</span>
            </div>
          </div>
        </Reveal>

        <ol className="relative grid grid-cols-1 md:grid-cols-3" style={{ marginTop: "clamp(56px, 7vw, 96px)", listStyle: "none", padding: 0 }}>
          {/* Rail: horizontal on md+, vertical below */}
          <span
            aria-hidden="true"
            className="hidden md:block absolute"
            style={{
              left: 0,
              right: 0,
              top: 5,
              height: 1,
              background: "linear-gradient(90deg, var(--sx-line-strong), var(--sx-line-strong) 66%, var(--sx-accent-line))",
            }}
          />

          {STEPS.map((s, i) => {
            const last = i === STEPS.length - 1;
            return (
              <li key={s.n} className="relative pl-9 md:pl-0 md:pr-12 pb-14 md:pb-0 last:pb-0">
                {/* Rail segment to the next stage, small screens only */}
                {!last && (
                  <span
                    aria-hidden="true"
                    className="md:hidden absolute"
                    style={{ left: 5, top: 11, bottom: 0, width: 1, background: i === STEPS.length - 2 ? "linear-gradient(180deg, var(--sx-line-strong), var(--sx-accent-line))" : "var(--sx-line-strong)" }}
                  />
                )}
                {/* Node */}
                <span
                  aria-hidden="true"
                  className="absolute"
                  style={{
                    left: 0,
                    top: 0,
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: last ? "var(--sx-accent)" : "var(--sx-bg)",
                    border: `1px solid ${last ? "var(--sx-accent)" : "var(--sx-text-3)"}`,
                    boxShadow: last ? "0 0 0 4px var(--sx-accent-bg), 0 0 18px rgba(255, 236, 216,0.55)" : "0 0 0 4px var(--sx-bg)",
                  }}
                />

                <Reveal delay={i * 110} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <div className="sx-overline flex items-center md:pt-10" style={{ gap: 10, marginTop: -2 }}>
                    <span className="sx-accent">Stage {s.n}</span>
                    <span aria-hidden="true" style={{ width: 18, height: 1, background: "var(--sx-line-strong)" }} />
                    <span className="sx-num" style={{ color: last ? "var(--sx-text)" : "var(--sx-text-3)" }}>{s.t}</span>
                  </div>

                  <h3 className="sx-h3" style={{ marginTop: 20, textTransform: "uppercase", letterSpacing: "0.02em", maxWidth: 320 }}>
                    {s.title}
                  </h3>
                  <p className="sx-body" style={{ marginTop: 14, marginBottom: 28, maxWidth: 360 }}>
                    {s.body}
                  </p>

                  <div
                    className="flex items-center justify-between"
                    style={{
                      marginTop: "auto",
                      paddingTop: 14,
                      borderTop: "1px solid var(--sx-line)",
                      gap: 12,
                      maxWidth: 360,
                    }}
                  >
                    <span className="sx-overline" style={{ color: "var(--sx-text-4)" }}>{s.label}</span>
                    <span className="sx-overline" style={{ color: last ? "var(--sx-accent)" : "var(--sx-text-2)", letterSpacing: "0.14em", textAlign: "right" }}>
                      {s.meta}
                    </span>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
