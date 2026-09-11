"use client";

import Link from "next/link";
import type { Transaction } from "@/lib/supabase/database.types";
import { type AccountRow, capitalize, formatUsd, displayHandle, timeAgo, tierTagClass, statusDotColor } from "@/components/app/format";
import { Arrow } from "@/components/sx";
import { ICON } from "@/components/app/icons";

/* Display pieces of the accounts home (/app). The page wires them to live
   data; the homepage console renders the same pieces with sample data. */


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------








/** Masked figure: dots until the viewer chooses to reveal amounts. */
export function Amount({ value, revealed, size = 15, sign = "" }: { value: number; revealed: boolean; size?: number; sign?: string }) {
  return (
    <span
      className="sx-num"
      style={{
        fontSize: size,
        color: "var(--sx-text)",
        letterSpacing: revealed ? "0.01em" : "0.16em",
        whiteSpace: "nowrap",
        transition: "letter-spacing 0.3s var(--sx-ease)",
      }}
    >
      {revealed ? `${sign}${formatUsd(value)}` : "•••••"}
    </span>
  );
}

export function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1 7s2.5-4.5 6-4.5S13 7 13 7s-2.5 4.5-6 4.5S1 7 1 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="7" cy="7" r="1.8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1.5 1.5l11 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M1 7s2.5-4.5 6-4.5c1.1 0 2.1.28 2.98.74M13 7s-1 1.8-2.8 3.1M4.2 4.2C2.3 5.2 1 7 1 7" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

/** Share of the balance that is encrypted, drawn as a thin glowing ring. */
export function PrivacyRing({ value, size = 132 }: { value: number; size?: number }) {
  const stroke = 5;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = ((100 - value) / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", overflow: "visible" }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--sx-text-5)" strokeWidth={1} strokeDasharray="2 6" transform={`scale(0.84) translate(${size * 0.095} ${size * 0.095})`} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--sx-accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.6s var(--sx-ease)", filter: "drop-shadow(0 0 6px rgba(var(--sx-heat), 0.55))" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span className="sx-num" style={{ fontSize: size * 0.27, lineHeight: 1, color: "var(--sx-text)" }}>
          {Math.round(value)}
          <span style={{ fontSize: size * 0.13, color: "var(--sx-text-3)" }}>%</span>
        </span>
        <span className="sx-overline" style={{ fontSize: 9, marginTop: 6 }}>Encrypted</span>
      </div>
    </div>
  );
}

export function QuickAction({ href, onClick, label, ariaLabel, icon }: { href?: string; onClick?: () => void; label: string; ariaLabel?: string; icon: React.ReactNode }) {
  const body = (
    <>
      <span
        aria-hidden="true"
        style={{
          width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid var(--sx-line-strong)", background: "rgba(255,255,255,0.03)", color: "var(--sx-text)",
          transition: "border-color 0.25s, background-color 0.25s, box-shadow 0.25s",
        }}
        className="sx-qa-icon"
      >
        {icon}
      </span>
      <span className="sx-overline" style={{ fontSize: 10, color: "var(--sx-text-2)" }}>{label}</span>
    </>
  );
  const style: React.CSSProperties = {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 10, minWidth: 64,
    background: "none", border: "none", padding: 0, cursor: "pointer", textDecoration: "none",
  };
  return href ? (
    <Link href={href} className="sx-qa" style={style} aria-label={ariaLabel}>{body}</Link>
  ) : (
    <button type="button" onClick={onClick} className="sx-qa" style={style} aria-label={ariaLabel} aria-haspopup="menu">{body}</button>
  );
}


// ---------------------------------------------------------------------------
// Account row
// ---------------------------------------------------------------------------

export function AccountRowItem({ account, revealed }: { account: AccountRow; revealed: boolean }) {
  const policy = account.spend_policies;
  const isRevoked = account.status === "revoked";
  return (
    <li className="sx-row sx-acct-row" style={{ gap: "clamp(10px, 2vw, 16px)", padding: "16px clamp(14px, 3vw, 20px)", opacity: isRevoked ? 0.5 : 1 }}>
      <div
        aria-hidden="true"
        className="sx-num"
        style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
          color: account.is_primary ? "#05070A" : "var(--sx-text-2)",
          background: account.is_primary ? "var(--sx-accent)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${account.is_primary ? "var(--sx-accent)" : "var(--sx-line-strong)"}`,
          boxShadow: account.is_primary ? "0 0 18px rgba(var(--sx-heat), 0.35)" : "none",
        }}
      >
        {account.type === "agent" ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
            <rect x="3" y="4.5" width="10" height="8" rx="2" />
            <path d="M8 2v2.5M6 8.5h.01M10 8.5h.01" strokeLinecap="round" />
          </svg>
        ) : (
          account.name.charAt(0).toUpperCase()
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span className="sx-dot" style={{ background: statusDotColor(account.status) }} aria-label={account.status} />
          <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--sx-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {account.name}
          </span>
          {account.is_primary && <span className="sx-tag sx-tag-accent" style={{ height: 18, fontSize: 9.5, flexShrink: 0 }}>Main</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 5, minWidth: 0 }}>
          <span className="sx-mono" style={{ fontSize: 11, color: "var(--sx-text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayHandle(account)}
          </span>
          {account.type === "agent" && policy && (
            <span className="sx-caption hidden sm:inline" style={{ whiteSpace: "nowrap", color: "var(--sx-text-4)" }}>
              {formatUsd(policy.max_per_request)} each · {formatUsd(policy.max_per_day)} a day
            </span>
          )}
        </div>
      </div>

      <span className="hidden md:block" style={{ flexShrink: 0 }}><span className={tierTagClass(account.privacy_tier)}>{capitalize(account.privacy_tier)}</span></span>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <Amount value={account.balance} revealed={revealed} size={16} />
        <div className="sx-overline" style={{ fontSize: 9, marginTop: 5 }}>USDG</div>
      </div>

      {isRevoked ? (
        <span className="hidden sm:block" style={{ flexShrink: 0 }}><span className="sx-tag sx-tag-danger">Revoked</span></span>
      ) : (
        <Link
          href={`/app/run?to=${account.handle}`}
          aria-label={`Pay ${account.name}`}
          className="sx-acct-pay"
          style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid var(--sx-line)", color: "var(--sx-text-3)", transition: "all 0.25s var(--sx-ease)",
          }}
        >
          <Arrow size={13} />
        </Link>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Activity row
// ---------------------------------------------------------------------------

/** `timeLabel` replaces the computed "ago" label, for static previews. */
export function ActivityRow({ tx, ownedIds, revealed, timeLabel }: { tx: Transaction; ownedIds: Set<string>; revealed: boolean; timeLabel?: string }) {
  const outgoing = tx.from_account_id !== null && ownedIds.has(tx.from_account_id) && !(tx.to_account_id && ownedIds.has(tx.to_account_id));
  const internal = tx.from_account_id !== null && tx.to_account_id !== null && ownedIds.has(tx.from_account_id) && ownedIds.has(tx.to_account_id);
  const counterparty = outgoing ? tx.to_display : tx.from_display;
  const statusColor = tx.status === "settled" ? "var(--sx-ok)" : tx.status === "pending" ? "var(--sx-warn)" : "var(--sx-danger)";
  return (
    <li className="sx-row" style={{ gap: 12, padding: "13px 18px" }}>
      <span
        aria-hidden="true"
        style={{
          width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid var(--sx-line)", color: outgoing ? "var(--sx-text-3)" : "var(--sx-accent)",
          transform: outgoing ? "none" : "rotate(180deg)",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" strokeLinecap="square" />
        </svg>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--sx-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {internal ? `${tx.from_display} to ${tx.to_display}` : counterparty}
        </div>
        <div className="sx-caption" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
          <span className="sx-dot" style={{ width: 5, height: 5, background: statusColor }} />
          {capitalize(tx.status)} · {timeLabel ?? timeAgo(tx.created_at)}
        </div>
      </div>
      <Amount value={Number(tx.amount)} revealed={revealed} size={14} sign={internal ? "" : outgoing ? "−" : "+"} />
    </li>
  );
}

// ---------------------------------------------------------------------------
// Balance hero
// ---------------------------------------------------------------------------

export function BalanceHero({
  loading,
  total,
  accountCount,
  revealed,
  primaryHandle,
  encryptedShare,
  stats,
  newAction,
}: {
  loading: boolean;
  total: number;
  accountCount: number;
  revealed: boolean;
  primaryHandle?: string;
  encryptedShare: number;
  stats: { label: string; value: number }[];
  newAction: React.ReactNode;
}) {
  return (
  <section
    className="sx-rise sx-d1 sx-hud"
    aria-label="Total balance"
    style={{
      position: "relative",
      overflow: "hidden",
      borderRadius: "var(--sx-r-2xl)",
      border: "1px solid var(--sx-line-strong)",
      background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01)), var(--sx-raised)",
      padding: "clamp(22px, 3.4vw, 36px)",
      ["--sx-hud-size" as string]: "34px",
    }}
  >
    <div aria-hidden="true" className="absolute inset-0 sx-stars" style={{ opacity: 0.6 }} />
    <div aria-hidden="true" className="sx-horizon" style={{ top: "calc(100% - 18px)", width: "300%" }} />
    <div aria-hidden="true" className="absolute inset-0 sx-noise" />

    <div className="relative grid lg:grid-cols-[minmax(0,1fr)_auto]" style={{ gap: "28px 48px", alignItems: "center" }}>
      <div style={{ minWidth: 0 }}>
        <div className="sx-overline">
          Total balance · {loading ? "…" : `${accountCount} account${accountCount === 1 ? "" : "s"}`}
        </div>
        <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
          {loading ? (
            <span className="sx-skeleton" style={{ display: "block", width: 240, height: 56 }} />
          ) : (
            <span
              className="sx-num"
              style={{
                fontSize: "clamp(44px, 6vw, 72px)",
                lineHeight: 0.95,
                fontWeight: 400,
                color: "var(--sx-text)",
                letterSpacing: revealed ? "0" : "0.12em",
                textShadow: revealed ? "0 0 32px rgba(var(--sx-heat), 0.18)" : "none",
              }}
            >
              {revealed ? formatUsd(total) : <span style={{ fontSize: "0.5em", letterSpacing: "0.3em", verticalAlign: "0.35em" }}>••••••</span>}
            </span>
          )}
          <span className="sx-overline" style={{ fontSize: 12 }}>USDG</span>
        </div>
        <p className="sx-small" style={{ marginTop: 12, color: "var(--sx-text-3)" }}>
          {revealed ? "Decrypted in your browser. Nobody else sees these figures." : "Only your view key can read these figures."}
          {primaryHandle && <> Main account <span className="sx-mono" style={{ color: "var(--sx-text-2)" }}>{primaryHandle}</span>.</>}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, max-content))", gap: "clamp(8px, 3vw, 28px)", marginTop: 30, marginBottom: 6, position: "relative" }}>
          <QuickAction href="/app/run" label="Send" icon={ICON.send} />
          <QuickAction href="/app/wallet" label="Top up" icon={ICON.topup} />
          <QuickAction href="/app/cards" label="Cards" icon={ICON.card} />
          {newAction}
        </div>
      </div>

      <div className="hidden sm:flex items-center" style={{ gap: 22 }}>
        <PrivacyRing value={loading ? 0 : encryptedShare} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 150 }}>
          {stats.map((k) => (
            <div key={k.label} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, paddingBottom: 10, borderBottom: "1px solid var(--sx-line)" }}>
              <span className="sx-overline" style={{ fontSize: 10 }}>{k.label}</span>
              <span className="sx-num" style={{ fontSize: 20, color: "var(--sx-text)" }}>{loading ? "·" : k.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
  );
}
