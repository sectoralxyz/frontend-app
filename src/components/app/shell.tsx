"use client";

import Link from "next/link";
import { Brand } from "@/components/sx";

/* Display pieces of the signed-in app shell. src/app/app/layout.tsx wires
   them to the router and the session; the homepage console renders the
   same pieces with sample data, so the two always match. */

/* ── Nav model ─────────────────────────────────────────────────────────── */

export type NavItem = { label: string; href: string; icon: React.ReactNode };

const ICON_STROKE = { stroke: "currentColor", strokeWidth: 1.25, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };

export const icons = {
  accounts: (
    <svg width="16" height="16" viewBox="0 0 16 16" {...ICON_STROKE} aria-hidden="true">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1.2" />
    </svg>
  ),
  send: (
    <svg width="16" height="16" viewBox="0 0 16 16" {...ICON_STROKE} aria-hidden="true">
      <path d="M14 2 7.5 8.5" />
      <path d="M14 2 9.8 14l-2.3-5.5L2 6.2 14 2Z" />
    </svg>
  ),
  wallet: (
    <svg width="16" height="16" viewBox="0 0 16 16" {...ICON_STROKE} aria-hidden="true">
      <rect x="1.5" y="3.5" width="13" height="9.5" rx="2" />
      <path d="M10.5 8.25h2.5" />
      <path d="M1.5 6h13" />
    </svg>
  ),
  cards: (
    <svg width="16" height="16" viewBox="0 0 16 16" {...ICON_STROKE} aria-hidden="true">
      <rect x="1.5" y="3" width="13" height="10" rx="1.8" />
      <path d="M1.5 6.2h13" />
      <path d="M4 10.5h3" />
    </svg>
  ),
  agents: (
    <svg width="16" height="16" viewBox="0 0 16 16" {...ICON_STROKE} aria-hidden="true">
      <rect x="3.5" y="3.5" width="9" height="9" rx="1.6" />
      <path d="M6 1v2.5M10 1v2.5M6 12.5V15M10 12.5V15M1 6h2.5M1 10h2.5M12.5 6H15M12.5 10H15" />
    </svg>
  ),
  activity: (
    <svg width="16" height="16" viewBox="0 0 16 16" {...ICON_STROKE} aria-hidden="true">
      <path d="M1.5 8h3l2-4.5 3 9 2-4.5h3" />
    </svg>
  ),
  analytics: (
    <svg width="16" height="16" viewBox="0 0 16 16" {...ICON_STROKE} aria-hidden="true">
      <path d="M2 14V9M6 14V5M10 14V7.5M14 14V3" />
    </svg>
  ),
  keys: (
    <svg width="16" height="16" viewBox="0 0 16 16" {...ICON_STROKE} aria-hidden="true">
      <circle cx="5" cy="8" r="3.2" />
      <path d="M8.2 8H14.5M12.5 8v2.4M10.4 8v1.7" />
    </svg>
  ),
  alerts: (
    <svg width="16" height="16" viewBox="0 0 16 16" {...ICON_STROKE} aria-hidden="true">
      <path d="M8 2a4.2 4.2 0 0 0-4.2 4.2c0 3-1.3 4.3-1.3 4.3h11s-1.3-1.3-1.3-4.3A4.2 4.2 0 0 0 8 2Z" />
      <path d="M6.6 13a1.6 1.6 0 0 0 2.8 0" />
    </svg>
  ),
  status: (
    <svg width="16" height="16" viewBox="0 0 16 16" {...ICON_STROKE} aria-hidden="true">
      <circle cx="8" cy="8" r="6.2" />
      <path d="M4.5 8h2l1-2.2 1.6 4.4 1-2.2h1.9" />
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 16 16" {...ICON_STROKE} aria-hidden="true">
      <circle cx="8" cy="8" r="2.2" />
      <path d="M13.2 9.9a5.6 5.6 0 0 0 0-3.8l1.3-1-1.3-2.2-1.6.5a5.6 5.6 0 0 0-3.3-1.9L8 0h0L7.7 1.5a5.6 5.6 0 0 0-3.3 1.9l-1.6-.5-1.3 2.2 1.3 1a5.6 5.6 0 0 0 0 3.8l-1.3 1 1.3 2.2 1.6-.5a5.6 5.6 0 0 0 3.3 1.9L8 16l.3-1.5a5.6 5.6 0 0 0 3.3-1.9l1.6.5 1.3-2.2-1.3-1Z" />
    </svg>
  ),
};

export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Money",
    items: [
      { label: "Accounts", href: "/app", icon: icons.accounts },
      { label: "Send Money", href: "/app/run", icon: icons.send },
      { label: "Cards", href: "/app/cards", icon: icons.cards },
      { label: "Wallet", href: "/app/wallet", icon: icons.wallet },
    ],
  },
  {
    label: "Agents",
    items: [
      { label: "AI Agent Accounts", href: "/app/dashboard", icon: icons.agents },
      { label: "Agent Activity", href: "/app/executions", icon: icons.activity },
      { label: "Analytics", href: "/app/analytics", icon: icons.analytics },
    ],
  },
  {
    label: "Build",
    items: [
      { label: "API Keys", href: "/app/keys", icon: icons.keys },
      { label: "Alerts", href: "/app/alerts", icon: icons.alerts },
      { label: "System Status", href: "/status", icon: icons.status },
    ],
  },
];

export const SETTINGS_ITEM: NavItem = { label: "Settings", href: "/app/settings", icon: icons.settings };

export function isActivePath(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

/** Current page label plus the nav group it sits in, for the breadcrumb. */
export function pageCrumb(pathname: string): { group: string | null; title: string } {
  const all = [
    ...NAV_GROUPS.flatMap((g) => g.items.map((item) => ({ item, group: g.label as string | null }))),
    { item: SETTINGS_ITEM, group: null },
  ];
  const match = all
    .filter(({ item }) => isActivePath(pathname, item.href))
    .sort((a, b) => b.item.href.length - a.item.href.length)[0];
  return match ? { group: match.group, title: match.item.label } : { group: null, title: "App" };
}

/* ── Sidebar (shared by the desktop rail, the mobile drawer and the homepage console) ────────── */

export function SidebarNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {

  return (
    <>
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 20px 18px", flexShrink: 0 }}>
        <Link href="/" aria-label="Go to the Sectoral homepage" style={{ textDecoration: "none", display: "inline-flex" }}>
          <Brand size={24} />
        </Link>
      </div>

      {/* Nav groups */}
      <nav
        aria-label="App navigation"
        style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "10px 12px 16px", display: "flex", flexDirection: "column", gap: 26 }}
      >
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div className="sx-overline" style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px", marginBottom: 10, fontSize: 10 }}>
              <span style={{ color: "var(--sx-text-4)" }}>0{gi + 1}</span>
              <span>{group.label}</span>
            </div>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className="sx-nav-item"
                aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
              >
                {item.icon}
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Settings */}
      <div style={{ padding: "8px 12px", flexShrink: 0, borderTop: "1px solid var(--sx-line)" }}>
        <Link
          href={SETTINGS_ITEM.href}
          onClick={onNavigate}
          className="sx-nav-item"
          aria-current={isActivePath(pathname, SETTINGS_ITEM.href) ? "page" : undefined}
        >
          {SETTINGS_ITEM.icon}
          <span>{SETTINGS_ITEM.label}</span>
        </Link>
      </div>

      <ChainTelemetry />
    </>
  );
}

/* ── Chain status readout ──────────────────────────────────────────────── */

export function ChainTelemetry() {
  return (
    <div style={{ padding: "4px 12px 12px", flexShrink: 0 }}>
      <div className="sx-hud" style={{ position: "relative", padding: "14px 14px 12px", borderRadius: "var(--sx-r-lg)", background: "rgba(255,255,255,0.018)", border: "1px solid var(--sx-line)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span className="sx-overline" style={{ fontSize: 10 }}>Network</span>
          <span className="sx-overline" style={{ fontSize: 10, display: "inline-flex", alignItems: "center", gap: 6, color: "var(--sx-ok)" }}>
            <span className="sx-dot sx-dot-live" />
            Live
          </span>
        </div>
        <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: "var(--sx-text)" }}>Robinhood Chain</div>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, paddingTop: 10, borderTop: "1px solid var(--sx-line)" }}>
          <div>
            <div className="sx-overline" style={{ fontSize: 9, color: "var(--sx-text-4)" }}>Blocks</div>
            <div className="sx-num" style={{ marginTop: 4, fontSize: 15, color: "var(--sx-text)" }}>102ms</div>
          </div>
          <div>
            <div className="sx-overline" style={{ fontSize: 9, color: "var(--sx-text-4)" }}>Amounts</div>
            <div className="sx-num" style={{ marginTop: 4, fontSize: 15, color: "var(--sx-text)" }}>Private</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── User chip (the button at the foot of the sidebar) ───────────────── */

export function UserChip({
  initials,
  displayName,
  walletAddress,
  open = false,
  onClick,
}: {
  initials: string;
  displayName: string;
  walletAddress: string;
  open?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
        onClick={onClick}
        aria-haspopup="menu"
        aria-expanded={open}
        className="sx-card-interactive"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          background: "var(--sx-surface)",
          border: "1px solid var(--sx-line)",
          borderRadius: "var(--sx-r-lg)",
          padding: "9px 10px",
          cursor: "pointer",
          color: "var(--sx-text)",
        }}
      >
        <span
          aria-hidden="true"
          className="sx-num"
          style={{
            width: 30,
            height: 30,
            borderRadius: "var(--sx-r-sm)",
            background: "var(--sx-accent-bg)",
            border: "1px solid var(--sx-accent-line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.06em",
            color: "var(--sx-accent)",
            flexShrink: 0,
          }}
        >
          {initials || "?"}
        </span>
        <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName || "Your account"}
          </span>
          {walletAddress && (
            <span className="sx-mono" style={{ display: "block", marginTop: 2, fontSize: 10.5, color: "var(--sx-text-4)" }}>
              {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
            </span>
          )}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" style={{ flexShrink: 0, color: "var(--sx-text-3)", transform: open ? "none" : "rotate(180deg)", transition: "transform 0.25s var(--sx-ease)" }}>
          <path d="M2 6.5 5 3.5l3 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
  );
}

/* ── Top bar (breadcrumb, contextual actions, mobile menu) ─────────────── */

export function TopBarView({ pathname, onOpenMobileNav }: { pathname: string; onOpenMobileNav?: () => void }) {
  const crumb = pageCrumb(pathname);
  const onSendPage = isActivePath(pathname, "/app/run");

  return (
    <header
      className="sx-glass"
      style={{
        height: 60,
        borderWidth: "0 0 1px 0",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 clamp(16px, 3vw, 32px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Small screens: menu button + rocket */}
      <button
        className="flex lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Show menu"
        style={{
          width: 38,
          height: 38,
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "1px solid var(--sx-line-strong)",
          borderRadius: "var(--sx-r-md)",
          cursor: "pointer",
          color: "var(--sx-text)",
          flexShrink: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.4} aria-hidden="true">
          <line x1={3} y1={7} x2={17} y2={7} />
          <line x1={3} y1={13} x2={17} y2={13} />
        </svg>
      </button>
      <Link href="/" aria-label="Go to the Sectoral homepage" className="flex lg:hidden" style={{ textDecoration: "none", flexShrink: 0 }}>
        <Brand size={24} wordmark={false} />
      </Link>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ minWidth: 0 }}>
        <ol className="sx-overline" style={{ display: "flex", alignItems: "center", gap: 10, listStyle: "none", margin: 0, padding: 0, whiteSpace: "nowrap" }}>
          <li className="hidden sm:block" style={{ color: "var(--sx-text-4)" }}>App</li>
          {crumb.group && (
            <>
              <li aria-hidden="true" className="hidden sm:block" style={{ color: "var(--sx-text-5)" }}>/</li>
              <li className="hidden sm:block" style={{ color: "var(--sx-text-4)" }}>{crumb.group}</li>
            </>
          )}
          <li aria-hidden="true" className="hidden sm:block" style={{ color: "var(--sx-text-5)" }}>/</li>
          <li aria-current="page" style={{ color: "var(--sx-text)", overflow: "hidden", textOverflow: "ellipsis" }}>{crumb.title}</li>
        </ol>
      </nav>

      {/* Contextual actions */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <span className="hidden md:block"><span className="sx-tag" style={{ height: 28, padding: "0 10px" }}>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <rect x="2" y="5" width="8" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
            <path d="M4 5V3.8a2 2 0 0 1 4 0V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Private unless shared
        </span></span>
        {!onSendPage && (
          <Link href="/app/run" className="sx-btn sx-btn-secondary sx-btn-sm" style={{ height: 34, padding: "0 14px" }}>
            {icons.send}
            <span className="hidden sm:inline">Send Money</span>
          </Link>
        )}
      </div>
    </header>
  );
}
