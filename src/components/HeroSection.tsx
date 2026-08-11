import Link from "next/link";
import Image from "next/image";
import { Arrow } from "@/components/sx";

const HERO_STATS = [
  { value: "120ms", label: "To settle a block" },
  { value: "$0.00", label: "Fees on transfers while in beta" },
  { value: "0", label: "Amounts visible on-chain in plaintext" },
  { value: "24/7", label: "Agents covering their own payments" },
];

export function HeroSection() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: "max(100svh, 760px)", display: "flex", flexDirection: "column", background: "var(--sx-bg)" }}
    >
      {/* Backdrop photograph, darkened from the left so the copy stays legible */}
      <Image
        src="/images/hero.png"
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        style={{ objectFit: "cover", objectPosition: "center top" }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(5,7,10,0.88) 0%, rgba(5,7,10,0.62) 45%, rgba(5,7,10,0.25) 100%), linear-gradient(180deg, rgba(5,7,10,0.55) 0%, rgba(5,7,10,0) 30%)",
        }}
      />
      <div aria-hidden="true" className="absolute inset-0 sx-grid" style={{ opacity: 0.35 }} />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0"
        style={{ height: "45%", background: "linear-gradient(180deg, transparent, rgba(5,7,10,0.75) 60%, var(--sx-bg))" }}
      />
      <div aria-hidden="true" className="absolute inset-0 sx-noise" />

      <div className="sx-container relative flex flex-col" style={{ flex: 1, paddingTop: "clamp(124px, 16vh, 168px)" }}>
        <div style={{ maxWidth: 900 }}>
          <div className="sx-overline sx-rise flex items-center" style={{ gap: 10 }}>
            <span className="sx-dot sx-dot-live" />
            <span>Live on Robinhood Chain</span>
          </div>

          <h1 className="sx-display sx-rise sx-d1" style={{ marginTop: 26 }}>
            Private banking
            <br />
            for people and
            <br />
            <span className="sx-gleam">the agents they run.</span>
          </h1>

          <p className="sx-lede sx-rise sx-d2" style={{ marginTop: 28, maxWidth: 560 }}>
            Transfers are encrypted before they ever leave your account, then settle in 100ms blocks. Each agent gets
            an account of its own, pays over x402 natively, and can never go a cent past the limits you define.
          </p>

          <div className="sx-rise sx-d3 flex flex-wrap items-center" style={{ marginTop: 40, gap: 12 }}>
            <Link href="/signup" className="sx-btn sx-btn-primary sx-btn-lg">
              Get your account <Arrow />
            </Link>
            <a href="https://docs.sectoral.xyz" target="_blank" rel="noopener noreferrer" className="sx-btn sx-btn-secondary sx-btn-lg">
              Browse the docs
            </a>
          </div>
        </div>

        {/* Telemetry strip, pinned to the bottom of the first screen */}
        <div
          className="sx-rise sx-d4 grid grid-cols-2 md:grid-cols-4"
          style={{
            marginTop: "auto",
            paddingTop: 48,
            paddingBottom: "clamp(28px, 5vh, 48px)",
          }}
        >
          {HERO_STATS.map((s, i) => (
            <div
              key={s.label}
              style={{
                padding: "20px 20px 4px 0",
                borderTop: "1px solid var(--sx-line-strong)",
                marginRight: i % 2 === 0 ? 16 : 0,
              }}
              className="md:!mr-6"
            >
              <div className="sx-overline" style={{ display: "flex", gap: 8, minHeight: 28 }}>
                <span className="sx-accent">0{i + 1}</span>
                <span>{s.label}</span>
              </div>
              <div className="sx-telemetry-value" style={{ marginTop: 14 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
