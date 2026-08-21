const PARTNERS = [
  "Robinhood Chain",
  "Chainlink",
  "USDG",
  "Safe",
  "Uniswap",
  "Morpho",
  "Foundry",
  "x402",
];

export function LogosBar() {
  return (
    <section
      aria-label="Integrations"
      style={{
        background: "var(--sx-bg)",
        borderTop: "1px solid var(--sx-line)",
        borderBottom: "1px solid var(--sx-line)",
      }}
    >
      <div className="sx-container flex flex-col md:flex-row md:items-stretch">
        {/* Label block */}
        <div
          className="flex flex-col justify-center md:border-r pt-7 md:pb-7"
          style={{
            gap: 10,
            borderColor: "var(--sx-line)",
            flexShrink: 0,
          }}
        >
          <div className="sx-overline flex items-center" style={{ gap: 10 }}>
            <span className="sx-dot sx-dot-accent" />
            <span>Built on / works with</span>
          </div>
          <p className="sx-small" style={{ margin: 0, maxWidth: 260, paddingRight: 32 }}>
            Wired into the infrastructure agents already use
          </p>
        </div>

        {/* Seamless marquee: the track renders the partner list twice and
            scrolls by exactly half its width per loop. */}
        <div
          className="relative flex items-center"
          style={{
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            padding: "28px 0",
            maskImage: "linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)",
            WebkitMaskImage: "linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)",
          }}
        >
          <div className="sx-marquee" style={{ animationDuration: "60s" }}>
            {[...PARTNERS, ...PARTNERS].map((name, i) => (
              <span
                key={`${name}-${i}`}
                aria-hidden={i >= PARTNERS.length ? true : undefined}
                className="flex items-center"
                style={{ flexShrink: 0 }}
              >
                <span
                  style={{
                    fontFamily: "var(--sx-display)",
                    fontSize: "clamp(15px, 1.4vw, 19px)",
                    fontWeight: 500,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "var(--sx-text-3)",
                    whiteSpace: "nowrap",
                    padding: "0 clamp(24px, 3vw, 44px)",
                  }}
                >
                  {name}
                </span>
                <span aria-hidden="true" style={{ width: 1, height: 14, background: "var(--sx-line-strong)" }} />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
