import { Reveal } from "@/components/Reveal";

const SIGNALS = ["Non-custodial", "Confidential", "Checked on Robinhood Chain"];

export function NewSpeciesSection() {
  return (
    <section className="sx-section relative overflow-hidden" style={{ background: "var(--sx-bg)" }}>
      <div aria-hidden="true" className="absolute inset-0 sx-stars" style={{ opacity: 0.5 }} />

      <div className="sx-container relative">
        {/* Telemetry rail: overline, a ruled scale, and a marker */}
        <Reveal>
          <div className="flex items-center" style={{ gap: 20 }}>
            <div className="sx-overline flex items-center" style={{ gap: 12, flexShrink: 0 }}>
              <span className="sx-accent">01</span>
              <span>Agents with wallets</span>
            </div>
            <div
              aria-hidden="true"
              className="relative"
              style={{
                flex: 1,
                height: 9,
                borderBottom: "1px solid var(--sx-line-strong)",
                backgroundImage:
                  "repeating-linear-gradient(90deg, var(--sx-line-strong) 0 1px, transparent 1px 12px)",
                backgroundSize: "100% 5px",
                backgroundPosition: "0 100%",
                backgroundRepeat: "no-repeat",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  right: "18%",
                  bottom: -1,
                  width: 1,
                  height: 15,
                  background: "var(--sx-accent)",
                  boxShadow: "0 0 10px rgba(255, 236, 216,0.8)",
                }}
              />
            </div>
          </div>
        </Reveal>

        {/* The statement */}
        <Reveal delay={80}>
          <h2
            style={{
              marginTop: "clamp(48px, 7vw, 96px)",
              fontFamily: "var(--sx-display)",
              fontWeight: 500,
              fontSize: "clamp(34px, 9vw, 148px)",
              lineHeight: 0.9,
              letterSpacing: "0",
              textTransform: "uppercase",
              color: "var(--sx-text)",
              textWrap: "balance",
            }}
          >
            <span style={{ color: "var(--sx-text-4)" }}>Software now has</span>
            <br />
            its own bank accounts.
          </h2>
        </Reveal>

        <div
          className="grid grid-cols-1 lg:grid-cols-12"
          style={{ marginTop: "clamp(48px, 7vw, 104px)", gap: "clamp(32px, 4vw, 48px)" }}
        >
          <Reveal className="lg:col-span-4" delay={120}>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, borderTop: "1px solid var(--sx-line)" }}>
              {SIGNALS.map((s, i) => (
                <li
                  key={s}
                  className="sx-overline flex items-center"
                  style={{ gap: 14, padding: "14px 0", borderBottom: "1px solid var(--sx-line)" }}
                >
                  <span className="sx-num" style={{ color: "var(--sx-text-4)" }}>0{i + 1}</span>
                  <span style={{ color: "var(--sx-text-2)" }}>{s}</span>
                  <span className="sx-dot sx-dot-accent" style={{ marginLeft: "auto", width: 4, height: 4 }} />
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="lg:col-span-7 lg:col-start-6" delay={180}>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--sx-sans)",
                fontSize: "clamp(19px, 1.9vw, 26px)",
                lineHeight: 1.5,
                letterSpacing: "-0.01em",
                color: "var(--sx-text-3)",
                textWrap: "pretty",
              }}
            >
              <span style={{ color: "var(--sx-text)" }}>
                Right now, AI agents are earning, spending and settling with one another at every hour of the day.
              </span>{" "}
              Sectoral gives them a private place to do it. It is a non-custodial neobank where people and agents
              move money confidentially, with each settlement checked on Robinhood Chain.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
