import type { ReactNode } from "react";
import type { Transaction } from "@/lib/supabase/database.types";
import { Reveal } from "@/components/Reveal";
import { SidebarNav, TopBarView, UserChip } from "@/components/app/shell";
import {
  AccountRowItem,
  ActivityRow,
  BalanceHero,
  QuickAction,
} from "@/components/app/accounts-home";
import { type AccountRow, displayHandle } from "@/components/app/format";
import { ICON } from "@/components/app/icons";

/* The product, revealed: a tilted console frame holding the accounts home
   (/app) inside the app shell. It is built from the very components the app
   uses (src/components/app), fed with sample data, so the picture on the
   homepage always matches the product. Small screens get a phone frame
   showing the same screen in its mobile layout. */

export function ProductPreview() {
  return (
    <section className="relative w-full overflow-clip" style={{ background: "var(--sx-bg)", paddingBottom: "clamp(72px, 10vw, 128px)" }}>
      {/* Accent light pooling behind the console */}
      <div
        aria-hidden="true"
        className="absolute"
        style={{
          left: "50%",
          top: "18%",
          width: "min(1400px, 120vw)",
          height: "70%",
          transform: "translateX(-50%)",
          background: "radial-gradient(ellipse 50% 45% at 50% 40%, rgba(255, 236, 216,0.10), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div aria-hidden="true" className="absolute inset-0 sx-noise" />

      <div className="sx-container relative" style={{ paddingTop: "clamp(24px, 4vw, 56px)" }}>
        {/* Instrument rail above the frame */}
        <Reveal>
          <div
            className="flex items-center justify-between"
            style={{ gap: 16, paddingBottom: 18, borderBottom: "1px solid var(--sx-line)" }}
          >
            <div className="sx-overline flex items-center" style={{ gap: 12 }}>
              <span className="sx-accent">Console</span>
              <span aria-hidden="true" style={{ width: 28, height: 1, background: "var(--sx-line-strong)" }} />
              <span>Inside the app</span>
            </div>
            <div className="sx-overline hidden sm:flex items-center" style={{ gap: 18 }}>
              <span>View / Accounts</span>
              <span aria-hidden="true" style={{ color: "var(--sx-text-5)" }}>|</span>
              <span className="flex items-center" style={{ gap: 8 }}>
                <span className="sx-dot sx-dot-live" />
                Live
              </span>
            </div>
          </div>
        </Reveal>

        {/* Desktop console */}
        <div className="hidden md:block" style={{ marginTop: "clamp(40px, 5vw, 64px)", perspective: "2400px" }}>
          <div className="sx-console-tilt">
            <ConsoleFrame>
              <MockApp />
            </ConsoleFrame>
          </div>
        </div>

        {/* Phone variant for small screens */}
        <Reveal className="md:hidden" style={{ marginTop: 32 }}>
          <PhoneFrame>
            <MockApp compact />
          </PhoneFrame>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Frames ──────────────────────────────────────────────────────────────── */

function ConsoleFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="sx-hud"
      style={{
        position: "relative",
        borderRadius: "var(--sx-r-2xl)",
        padding: 10,
        background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
        border: "1px solid var(--sx-line-strong)",
        boxShadow:
          "0 -1px 0 rgba(255, 236, 216,0.5), 0 -30px 120px -20px rgba(255, 236, 216,0.18), 0 60px 140px rgba(0,0,0,0.65)",
      }}
    >
      {/* Rim light along the top edge */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -1,
          left: "12%",
          right: "12%",
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(255, 238, 214,0.95), transparent)",
        }}
      />
      <div
        style={{
          height: 780,
          borderRadius: "var(--sx-r-xl)",
          overflow: "hidden",
          background: "var(--sx-bg)",
          border: "1px solid var(--sx-line)",
          position: "relative",
        }}
      >
        {children}
        <ScreenFade height={180} />
      </div>
    </div>
  );
}

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        maxWidth: 400,
        margin: "0 auto",
        padding: 8,
        borderRadius: 34,
        background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015))",
        border: "1px solid var(--sx-line-strong)",
        boxShadow: "0 -1px 0 rgba(255, 236, 216,0.45), 0 30px 80px rgba(0,0,0,0.6)",
      }}
    >
      <div
        style={{
          position: "relative",
          height: 640,
          overflow: "hidden",
          borderRadius: 27,
          background: "var(--sx-bg)",
          border: "1px solid var(--sx-line)",
        }}
      >
        {children}
        <ScreenFade height={140} />
      </div>
    </div>
  );
}

/** The screen dissolves into space at the bottom edge. */
function ScreenFade({ height }: { height: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height,
        background: "linear-gradient(180deg, transparent, var(--sx-bg))",
        pointerEvents: "none",
      }}
    />
  );
}

/* ── The mocked accounts home ────────────────────────────────────────────── */

/**
 * The /app screen as a picture: shell, balance hero, accounts and activity.
 * Marked inert so nothing inside can be focused or clicked.
 */
function MockApp({ compact = false }: { compact?: boolean }) {
  const ownedIds = new Set(ACCOUNTS.map((a) => a.id));
  const total = ACCOUNTS.reduce((sum, a) => sum + a.balance, 0);
  const encrypted = ACCOUNTS.filter((a) => a.privacy_tier !== "public").reduce((sum, a) => sum + a.balance, 0);
  const agents = ACCOUNTS.filter((a) => a.type === "agent");
  const primary = ACCOUNTS.find((a) => a.is_primary);

  return (
    <div inert aria-hidden="true" style={{ display: "flex", height: "100%", textAlign: "left", userSelect: "none" }}>
      {/* Sidebar rail, as in the app */}
      {!compact && (
        <aside
          style={{
            width: 248,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--sx-line)",
            background: "var(--sx-raised)",
          }}
        >
          <SidebarNav pathname="/app" />
          <div style={{ padding: "0 12px 14px" }}>
            <UserChip initials="V" displayName="Vlad" walletAddress="0x7b5Ff1373608CF16fEf673222D0A7716F45b30c6" />
          </div>
        </aside>
      )}

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <TopBarView pathname="/app" />
        <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
          <div aria-hidden="true" className="sx-grid" style={{ position: "absolute", inset: "0 0 auto 0", height: 420, opacity: 0.45 }} />
          <div style={{ position: "relative", padding: compact ? "18px 8px" : "28px 32px" }}>
            {/* Greeting line */}
            <div className="flex items-center justify-between" style={{ gap: 12, marginBottom: 18 }}>
              <div className="sx-overline" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="sx-dot sx-dot-live" />
                <span>Money</span>
                <span style={{ color: "var(--sx-text-5)" }}>/</span>
                <span style={{ color: "var(--sx-text-2)" }}>Your accounts</span>
              </div>
              {!compact && <span className="sx-overline" style={{ color: "var(--sx-text)" }}>Hide amounts</span>}
            </div>

            <BalanceHero
              loading={false}
              total={total}
              accountCount={ACCOUNTS.length}
              revealed
              primaryHandle={primary ? displayHandle(primary) : undefined}
              encryptedShare={(encrypted / total) * 100}
              stats={[
                { label: "Held by people", value: ACCOUNTS.length - agents.length },
                { label: "Held by agents", value: agents.length },
                { label: "Active", value: ACCOUNTS.filter((a) => a.status === "active").length },
              ]}
              newAction={<QuickAction label="New" ariaLabel="New account" icon={ICON.plus} />}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: compact ? "minmax(0, 1fr)" : "minmax(0, 1fr) 320px",
                gap: 16,
                marginTop: 16,
                alignItems: "start",
              }}
            >
              <section className="sx-card-solid" style={{ overflow: "hidden", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid var(--sx-line)" }}>
                  <div style={{ marginRight: "auto", display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span className="sx-h3" style={{ textTransform: "uppercase", fontSize: 18 }}>Accounts</span>
                    <span className="sx-overline" style={{ fontSize: 10 }}>{ACCOUNTS.length} shown</span>
                  </div>
                  {!compact && (
                    <div className="sx-segmented">
                      <button type="button" aria-pressed="true">All</button>
                      <button type="button">Human</button>
                      <button type="button">Agent</button>
                    </div>
                  )}
                </div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {ACCOUNTS.map((account) => (
                    <AccountRowItem key={account.id} account={account} revealed />
                  ))}
                </ul>
              </section>

              {!compact && (
                <section className="sx-card-solid" style={{ overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid var(--sx-line)" }}>
                    <span className="sx-h3" style={{ textTransform: "uppercase", fontSize: 16 }}>Recent activity</span>
                    <span className="sx-overline" style={{ fontSize: 10, color: "var(--sx-text-2)" }}>View all</span>
                  </div>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {ACTIVITY.map(([tx, when]) => (
                      <ActivityRow key={tx.id} tx={tx} ownedIds={ownedIds} revealed timeLabel={when} />
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sample data ─────────────────────────────────────────────────────────── */

const STAMP = "2026-01-01T00:00:00.000Z";

function account(o: Partial<AccountRow> & Pick<AccountRow, "id" | "type" | "name" | "handle" | "privacy_tier" | "balance">): AccountRow {
  return {
    owner_id: "sample",
    description: null,
    status: "active",
    is_primary: false,
    created_at: STAMP,
    updated_at: STAMP,
    spend_policies: null,
    ...o,
  };
}

function policy(accountId: string, perRequest: number, perDay: number, domains: string[]) {
  return {
    id: `p-${accountId}`,
    account_id: accountId,
    max_per_request: perRequest,
    max_per_day: perDay,
    allowed_domains: domains,
    webhook_url: null,
    created_at: STAMP,
    updated_at: STAMP,
  };
}

const ACCOUNTS: AccountRow[] = [
  account({ id: "a1", type: "human", name: "Vlad", handle: "vlad", privacy_tier: "confidential", balance: 12480.5, is_primary: true }),
  account({ id: "a2", type: "human", name: "Treasury", handle: "treasury", privacy_tier: "shielded", balance: 48210 }),
  account({ id: "a3", type: "agent", name: "Datafetch", handle: "datafetch", privacy_tier: "confidential", balance: 312.4, spend_policies: policy("a3", 5, 50, ["api.example.com", "data.example.org"]) }),
  account({ id: "a4", type: "agent", name: "Research bot", handle: "research", privacy_tier: "confidential", balance: 88.12, status: "paused", spend_policies: policy("a4", 2, 25, []) }),
  account({ id: "a5", type: "human", name: "Travel", handle: "travel", privacy_tier: "public", balance: 950 }),
];

function tx(o: Partial<Transaction> & Pick<Transaction, "id" | "from_display" | "to_display" | "amount" | "created_at">): Transaction {
  return {
    from_account_id: null,
    to_account_id: null,
    counterparty_type: "human",
    memo: null,
    privacy_layer: "Confidential",
    status: "settled",
    finality_ms: 100,
    proof_hash: null,
    tx_sig: null,
    disclosed: false,
    disclosed_at: null,
    ...o,
  };
}

/* Each sample payment with the fixed "ago" label the preview shows. */
const ACTIVITY: [Transaction, string][] = [
  [tx({ id: "t1", from_account_id: "a1", from_display: "@vlad.sectoral", to_display: "vendor.sectoral", amount: 125, created_at: STAMP }), "12m ago"],
  [tx({ id: "t2", from_account_id: "a3", from_display: "datafetch.sectoral", to_display: "api.example.com", counterparty_type: "x402", amount: 0.25, created_at: STAMP }), "48m ago"],
  [tx({ id: "t3", to_account_id: "a1", from_display: "payroll.sectoral", to_display: "@vlad.sectoral", amount: 4200, privacy_layer: "Shielded", created_at: STAMP }), "5h ago"],
  [tx({ id: "t4", from_account_id: "a1", to_account_id: "a3", from_display: "Vlad", to_display: "Datafetch", counterparty_type: "agent", amount: 100, created_at: STAMP }), "1d ago"],
  [tx({ id: "t5", from_account_id: "a1", from_display: "@vlad.sectoral", to_display: "mira.sectoral", amount: 64.9, status: "pending", created_at: STAMP }), "2d ago"],
];
