import Link from "next/link";
import type { ReactNode } from "react";
import { Brand } from "@/components/sx";

/* Readouts along the bottom of the atmosphere panel. */
const READOUTS = [
  { label: "Custody", value: "Yours" },
  { label: "Block time", value: "100ms" },
  { label: "Amounts", value: "Encrypted" },
];

function BackLink() {
  return (
    <Link
      href="/"
      className="sx-btn sx-btn-quiet sx-btn-sm"
      style={{ paddingLeft: 10, paddingRight: 12, gap: 8 }}
    >
      <svg width={12} height={12} viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M14 8H3M7 4 3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
      </svg>
      Return to site
    </Link>
  );
}

/**
 * Shared frame for the auth pages, laid out like a launch console. On wide
 * screens the left half is the atmosphere (stars, blueprint grid, the planet's
 * horizon, the value points and a row of
 * telemetry) and the right half holds the form in a solid panel. On small
 * screens a compact horizon header sits on top, the form comes first and the
 * value points follow it. Pages supply the panel's heading and body.
 */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  aside,
  width = 440,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  aside?: { heading: ReactNode; points: string[] };
  width?: number;
}) {
  const telemetry = (
    <div className="sx-rise sx-d3" style={{ marginTop: aside ? 32 : 0, maxWidth: 380 }}>
      <div className="grid grid-cols-3" style={{ gap: 16 }}>
        {READOUTS.map((r) => (
          <div key={r.label} style={{ paddingTop: 14, borderTop: "1px solid var(--sx-line-strong)" }}>
            <div className="sx-overline" style={{ fontSize: 10 }}>
              {r.label}
            </div>
            <div
              className="sx-num"
              style={{ marginTop: 10, fontSize: "clamp(18px, 1.6vw, 22px)", lineHeight: 1, color: "var(--sx-text)" }}
            >
              {r.value}
            </div>
          </div>
        ))}
      </div>
      <div className="sx-caption" style={{ marginTop: 18, color: "var(--sx-text-4)" }}>
        Running on Robinhood Chain · backed by Ethereum security
      </div>
    </div>
  );

  return (
    <div
      className="relative w-full grid lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]"
      style={{ flex: 1, minHeight: "100svh", background: "var(--sx-bg)" }}
    >
      {/* ── Atmosphere: left half on desktop, after the form on mobile ── */}
      <aside
        className={`relative overflow-hidden order-2 lg:order-1 lg:sticky lg:top-0 lg:h-[100svh] ${aside ? "flex" : "hidden lg:flex"} flex-col`}
        style={{ borderTop: "1px solid var(--sx-line)" }}
      >
        <div aria-hidden="true" className="absolute inset-0 sx-stars" />
        <div aria-hidden="true" className="absolute inset-0 sx-grid" style={{ opacity: 0.8 }} />
        <div
          aria-hidden="true"
          className="hidden lg:block sx-horizon-glow"
          style={{ top: "calc(100% - 132px - 420px)", width: "130%" }}
        />
        <div
          aria-hidden="true"
          className="hidden lg:block sx-horizon"
          style={{ top: "calc(100% - 132px)", width: "210%", maxWidth: "none" }}
        />
        <div aria-hidden="true" className="absolute inset-0 sx-noise" />

        <div
          className="relative flex flex-col"
          style={{ flex: 1, padding: "clamp(40px, 6vw, 56px) clamp(20px, 4.2vw, 64px) clamp(40px, 5vw, 48px)" }}
        >
          <div className="hidden lg:flex items-center" style={{ height: 36 }}>
            <Link href="/" aria-label="Go to the Sectoral homepage" style={{ textDecoration: "none" }}>
              <Brand size={30} />
            </Link>
          </div>

          <div className={aside ? "lg:my-auto" : undefined} style={{ maxWidth: 500, paddingTop: 8, paddingBottom: 8, marginTop: aside ? undefined : 56 }}>
            <div className="sx-overline sx-rise flex items-center" style={{ gap: 10 }}>
              <span className="sx-dot sx-dot-live" />
              <span>Live on Robinhood Chain</span>
            </div>

            {aside && (
              <>
                <h2
                  className="sx-h2 sx-rise sx-d1"
                  style={{ marginTop: 22, fontSize: "clamp(30px, 3.1vw, 44px)", lineHeight: 1.02 }}
                >
                  {aside.heading}
                </h2>
                <ol className="sx-rise sx-d2" style={{ listStyle: "none", margin: "32px 0 0", padding: 0 }}>
                  {aside.points.map((p, i) => (
                    <li
                      key={p}
                      className="flex"
                      style={{ gap: 18, padding: "14px 0", borderTop: "1px solid var(--sx-line)" }}
                    >
                      <span className="sx-overline sx-accent sx-num" style={{ paddingTop: 4, minWidth: 18 }}>
                        0{i + 1}
                      </span>
                      <span className="sx-body" style={{ fontSize: 14.5, lineHeight: 1.6 }}>
                        {p}
                      </span>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>

          {/* Telemetry, pinned just above the horizon */}
          <div className="lg:mt-auto" style={{ paddingTop: 32 }}>{telemetry}</div>
          <div className="hidden lg:block" style={{ height: 96 }} />
        </div>
      </aside>

      {/* ── Console: the form ── */}
      <div
        className="relative order-1 lg:order-2 flex flex-col"
        style={{ background: "var(--sx-raised)", borderLeft: "1px solid var(--sx-line)" }}
      >
        {/* Compact horizon header for small screens */}
        <div className="lg:hidden relative overflow-hidden" style={{ height: 196 }}>
          <div aria-hidden="true" className="absolute inset-0" style={{ background: "var(--sx-bg)" }} />
          <div aria-hidden="true" className="absolute inset-0 sx-stars" />
          <div aria-hidden="true" className="absolute inset-0 sx-grid" style={{ opacity: 0.7 }} />
          <div aria-hidden="true" className="sx-horizon-glow" style={{ top: "calc(100% - 44px - 420px)" }} />
          <div aria-hidden="true" className="sx-horizon" style={{ top: "calc(100% - 44px)", width: "320%" }} />
          <div className="relative flex items-center justify-between" style={{ height: 72, padding: "0 16px 0 20px" }}>
            <Link href="/" aria-label="Go to the Sectoral homepage" style={{ textDecoration: "none" }}>
              <Brand size={26} />
            </Link>
            <BackLink />
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-end" style={{ height: 36, margin: "clamp(40px, 6vw, 56px) clamp(24px, 4vw, 56px) 0" }}>
          <BackLink />
        </div>

        <main
          className="flex flex-col lg:justify-center"
          style={{ flex: 1, padding: "clamp(28px, 5vh, 56px) clamp(16px, 4vw, 56px) clamp(40px, 7vh, 72px)" }}
        >
          <div style={{ width: "100%", maxWidth: width, margin: "0 auto" }}>
            <section
              className="sx-card-solid sx-hud sx-rise sx-d1"
              style={{ padding: "clamp(24px, 4vw, 36px)", borderRadius: "var(--sx-r-xl)", background: "var(--sx-panel)" }}
            >
              <div className="sx-overline flex items-center" style={{ gap: 12 }}>
                <span className="sx-accent">01</span>
                <span aria-hidden="true" style={{ width: 24, height: 1, background: "var(--sx-line-strong)" }} />
                <span>{eyebrow}</span>
              </div>
              <h1
                style={{
                  marginTop: 18,
                  fontFamily: "var(--sx-display)",
                  fontWeight: 500,
                  fontSize: "clamp(28px, 2.5vw, 36px)",
                  lineHeight: 1.04,
                  letterSpacing: "0.01em",
                  textTransform: "uppercase",
                  color: "var(--sx-text)",
                  textWrap: "balance",
                }}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="sx-body" style={{ marginTop: 12, fontSize: 14.5 }}>
                  {subtitle}
                </p>
              )}
              <div style={{ marginTop: 28 }}>{children}</div>
            </section>

            {footer && (
              <div
                className="sx-small sx-rise sx-d2 [&_a]:text-[var(--sx-text)] [&_a]:underline [&_a]:decoration-[var(--sx-line-strong)] [&_a]:underline-offset-4 hover:[&_a]:decoration-[var(--sx-accent)]"
                style={{ marginTop: 22, textAlign: "center" }}
              >
                {footer}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/** Inline error banner used by the forms. */
export function AuthError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="sx-alert sx-alert-danger" style={{ marginBottom: 20 }}>
      <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 4.8v3.8M8 10.6v.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

/** Round status mark for the confirmation states. */
export function AuthSuccessMark() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center"
      style={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: "var(--sx-ok-bg)",
        border: "1px solid rgba(70, 192, 138, 0.28)",
        color: "var(--sx-ok)",
        marginBottom: 20,
      }}
    >
      <svg width={20} height={20} viewBox="0 0 13 13" fill="none">
        <path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
