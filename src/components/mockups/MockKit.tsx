import type { CSSProperties, ReactNode } from "react";

/* Shared pieces for the homepage product mockups: an app window, small
   uppercase labels, key/value rows and status tags, all built on the sx-*
   tokens so every mock reads as one product. */

export const hair = "1px solid var(--sx-line)";

/** App window: solid panel, title bar with a status dot, title and meta. */
export function MockWindow({
  title,
  meta,
  live = true,
  badge,
  children,
  style,
}: {
  title: ReactNode;
  meta?: ReactNode;
  live?: boolean;
  badge?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      className="w-full flex-1 flex flex-col overflow-hidden"
      style={{
        background: "var(--sx-panel)",
        border: "1px solid var(--sx-line-strong)",
        borderRadius: "var(--sx-r-xl)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 30px 80px rgba(0,0,0,0.45)",
        ...style,
      }}
    >
      <div
        className="flex items-center flex-shrink-0"
        style={{ gap: 10, height: 48, padding: "0 18px", borderBottom: hair, background: "rgba(255,255,255,0.015)" }}
      >
        <span className={`sx-dot ${live ? "sx-dot-live" : ""}`} />
        <span className="sx-title truncate" style={{ fontSize: 13.5 }}>
          {title}
        </span>
        {badge}
        {meta && (
          <span className="ml-auto sx-overline truncate hidden sm:inline" style={{ fontSize: 10, color: "var(--sx-text-4)" }}>
            {meta}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/** Small uppercase label used for field names and pane headings. */
export function MockLabel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="sx-overline" style={{ fontSize: 10, letterSpacing: "0.18em", color: "var(--sx-text-4)", ...style }}>
      {children}
    </div>
  );
}

/** Pane heading strip with a hairline under it. */
export function MockPaneHead({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between flex-shrink-0" style={{ gap: 12, minHeight: 42, padding: "0 18px", borderBottom: hair }}>
      <MockLabel style={{ color: "var(--sx-text-3)" }}>{children}</MockLabel>
      {right}
    </div>
  );
}

/** Label on the left, value on the right, hairline between rows. */
export function MockRow({
  label,
  value,
  mono,
  last,
}: {
  label: ReactNode;
  value: ReactNode;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ gap: 12, padding: "11px 0", borderBottom: last ? undefined : hair }}
    >
      <span style={{ fontSize: 12.5, color: "var(--sx-text-3)" }}>{label}</span>
      <span
        className={mono ? "sx-mono truncate" : "sx-num truncate"}
        style={{ fontSize: mono ? 11.5 : 13.5, color: "var(--sx-text)", textAlign: "right" }}
      >
        {value}
      </span>
    </div>
  );
}

/** Inset card inside a window. */
export function MockCard({ children, accent, style }: { children: ReactNode; accent?: boolean; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: accent ? "var(--sx-accent-surface)" : "var(--sx-surface)",
        border: `1px solid ${accent ? "var(--sx-accent-line)" : "var(--sx-line)"}`,
        borderRadius: "var(--sx-r-lg)",
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Check mark used inside ok tags and verification lists. */
export function Check({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 6.2l2.3 2.3 4.7-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Masked value placeholder: a row of small dots. */
export function Masked({ count = 5, size = 5 }: { count?: number; size?: number }) {
  return (
    <span role="img" aria-label="Hidden" className="inline-flex items-center" style={{ gap: size * 0.7 }}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{ width: size, height: size, borderRadius: "50%", background: "currentColor", opacity: 0.85 }} />
      ))}
    </span>
  );
}
