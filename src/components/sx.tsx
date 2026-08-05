import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

/* Shared building blocks for the Sectoral design system. Styling lives in the
   sx-* classes in globals.css; these components only fix the structure. */

/** Rocket mark plus the tracked wordmark. */
export function Brand({ size = 28, wordmark = true }: { size?: number; wordmark?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: Math.round(size * 0.5) }}>
      <Image
        src="/images/logo.png"
        alt={wordmark ? "" : "Sectoral"}
        width={size}
        height={size}
        style={{ display: "block", margin: `${-size * 0.12}px ${-size * 0.18}px` }}
        priority
      />
      {wordmark && (
        <span
          style={{
            fontFamily: "var(--sx-display)",
            fontWeight: 600,
            fontSize: Math.max(14, Math.round(size * 0.62)),
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--sx-text)",
            lineHeight: 1,
          }}
        >
          Sectoral
        </span>
      )}
    </span>
  );
}

/** Overline, headline and optional lede, the top of every marketing section. */
export function SectionHeader({
  index,
  overline,
  title,
  lede,
  align = "left",
  maxWidth = 760,
  style,
}: {
  index?: string;
  overline: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: "left" | "center";
  maxWidth?: number;
  style?: CSSProperties;
}) {
  const centered = align === "center";
  return (
    <div
      style={{
        maxWidth,
        margin: centered ? "0 auto" : undefined,
        textAlign: centered ? "center" : "left",
        ...style,
      }}
    >
      <div
        className="sx-overline"
        style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: centered ? "center" : "flex-start" }}
      >
        {index && <span className="sx-accent">{index}</span>}
        {index && <span aria-hidden="true" style={{ width: 28, height: 1, background: "var(--sx-line-strong)" }} />}
        <span>{overline}</span>
      </div>
      <h2 className="sx-h2" style={{ marginTop: 22 }}>
        {title}
      </h2>
      {lede && (
        <p className="sx-lede" style={{ marginTop: 22, maxWidth: centered ? 640 : 600, marginLeft: centered ? "auto" : undefined, marginRight: centered ? "auto" : undefined }}>
          {lede}
        </p>
      )}
    </div>
  );
}

/** Label over a large tabular value, like a launch telemetry readout. */
export function Telemetry({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="sx-telemetry">
      <span className="sx-overline">{label}</span>
      <span className="sx-telemetry-value">{value}</span>
      {sub && <span className="sx-caption">{sub}</span>}
    </div>
  );
}

/** Right-pointing arrow used inside buttons and links. */
export function Arrow({ size = 14 }: { size?: number }) {
  return (
    <svg className="sx-arrow" width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}
