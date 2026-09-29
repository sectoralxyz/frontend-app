import type { Transaction } from "@/lib/supabase/database.types";
import { ActivityRow, Amount } from "@/components/app/accounts-home";
import { MockWindow, MockLabel, MockRow, MockCard } from "./MockKit";

/* Accounts: a person's account and the agent account it owns, side by side
   on one protocol. Identity, amounts and activity use the same pieces as the
   accounts home in the app. */

/** Avatar exactly as the app draws it: an initial for people, a bot for agents. */
function Avatar({ kind, initial, primary = false }: { kind: "human" | "agent"; initial?: string; primary?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="sx-num"
      style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
        color: primary ? "#05070A" : "var(--sx-text-2)",
        background: primary ? "var(--sx-accent)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${primary ? "var(--sx-accent)" : "var(--sx-line-strong)"}`,
        boxShadow: primary ? "0 0 18px rgba(var(--sx-heat), 0.35)" : "none",
      }}
    >
      {kind === "agent" ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
          <rect x="3" y="4.5" width="10" height="8" rx="2" />
          <path d="M8 2v2.5M6 8.5h.01M10 8.5h.01" strokeLinecap="round" />
        </svg>
      ) : (
        initial
      )}
    </div>
  );
}

function Identity({ kind, name, handle, initial, primary }: { kind: "human" | "agent"; name: string; handle: string; initial?: string; primary?: boolean }) {
  return (
    <div className="flex items-center" style={{ gap: 14 }}>
      <Avatar kind={kind} initial={initial} primary={primary} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="flex items-center" style={{ gap: 8 }}>
          <span className="sx-dot" style={{ background: "var(--sx-ok)" }} />
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--sx-text)" }}>{name}</span>
          {primary && <span className="sx-tag sx-tag-accent" style={{ height: 18, fontSize: 9.5 }}>Main</span>}
        </div>
        <div className="sx-mono truncate" style={{ fontSize: 11, color: "var(--sx-text-3)", marginTop: 5 }}>{handle}</div>
      </div>
    </div>
  );
}

const STAMP = "2026-01-01T00:00:00.000Z";
function sampleTx(o: Partial<Transaction> & Pick<Transaction, "id" | "from_display" | "to_display" | "amount" | "created_at">): Transaction {
  return {
    from_account_id: null, to_account_id: null, counterparty_type: "human", memo: null,
    privacy_layer: "Confidential", status: "settled", finality_ms: 100, proof_hash: null,
    tx_sig: null, disclosed: false, disclosed_at: null, ...o,
  };
}
export function IntakeMockup() {
  const owned = new Set(["alice", "datafetch"]);
  const humanActivity: [Transaction, string][] = [
    [sampleTx({ id: "i1", from_account_id: "alice", from_display: "@alice.sectoral", to_display: "vendor.sectoral", amount: 125, created_at: STAMP }), "2h ago"],
    [sampleTx({ id: "i2", to_account_id: "alice", from_display: "payroll.sectoral", to_display: "@alice.sectoral", amount: 4200, created_at: STAMP }), "1d ago"],
    [sampleTx({ id: "i3", from_account_id: "alice", to_account_id: "datafetch", from_display: "Alice", to_display: "Datafetch", amount: 100, created_at: STAMP }), "3d ago"],
  ];

  const policyRows = [
    { label: "Request ceiling", value: "$5.00" },
    { label: "Per-day cap", value: "$50.00" },
    { label: "Approved domains", value: "2" },
  ];

  return (
    <MockWindow title="Accounts" meta="1 protocol · 2 principals">
      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        {/* Human account */}
        <div className="flex-1 min-w-0 flex flex-col" style={{ padding: 20, gap: 18 }}>
          <Identity kind="human" name="Alice" handle="@alice.sectoral" initial="A" primary />
          <div className="flex flex-wrap" style={{ gap: 6, marginTop: -4 }}>
            <span className="sx-tag sx-tag-accent">Confidential</span>
            <span className="sx-tag">2-of-3 Safe multisig</span>
          </div>

          <MockCard>
            <MockLabel>Balance</MockLabel>
            <div className="flex items-end" style={{ gap: 10, marginTop: 12, color: "var(--sx-text)" }}>
              <Amount value={0} revealed={false} size={22} />
              <span className="sx-overline" style={{ fontSize: 10 }}>USDG</span>
            </div>
            <div className="sx-caption" style={{ marginTop: 12 }}>Only your view key can reveal this</div>
          </MockCard>

          <div>
            <MockLabel style={{ marginBottom: 4 }}>Latest activity</MockLabel>
            <ul style={{ listStyle: "none", margin: "0 -20px", padding: 0, borderTop: "1px solid var(--sx-line)" }}>
              {humanActivity.map(([tx, when]) => (
                <ActivityRow key={tx.id} tx={tx} ownedIds={owned} revealed={false} timeLabel={when} />
              ))}
            </ul>
          </div>
        </div>

        {/* Shared protocol spine */}
        <div
          className="flex-shrink-0 flex items-center justify-center md:w-9 h-9 md:h-auto border-y md:border-y-0 md:border-x border-sx-line"
          style={{ background: "rgba(255,255,255,0.015)" }}
        >
          <span className="sx-overline md:[writing-mode:vertical-rl]" style={{ fontSize: 9.5, letterSpacing: "0.34em", color: "var(--sx-text-4)" }}>
            Shared protocol
          </span>
        </div>

        {/* Agent account */}
        <div className="flex-1 min-w-0 flex flex-col" style={{ padding: 20, gap: 18 }}>
          <Identity kind="agent" name="Datafetch" handle="datafetch.sectoral" />
          <div className="flex flex-wrap items-center" style={{ gap: 6, marginTop: -4 }}>
            <span className="sx-tag sx-tag-accent">Confidential</span>
            <span className="sx-caption">belongs to @alice.sectoral</span>
          </div>

          <MockCard style={{ paddingTop: 14, paddingBottom: 6 }}>
            <MockLabel style={{ marginBottom: 2 }}>Spending rules</MockLabel>
            {policyRows.map((row) => (
              <MockRow key={row.label} label={row.label} value={row.value} />
            ))}
            <div className="flex items-center justify-between" style={{ padding: "10px 0" }}>
              <span style={{ fontSize: 12.5, color: "var(--sx-text-3)" }}>Where it&apos;s enforced</span>
              <span className="sx-tag sx-tag-accent">On-chain</span>
            </div>
          </MockCard>

          <div>
            <MockLabel>Today · parent budget</MockLabel>
            <div className="sx-meter" style={{ marginTop: 12 }}>
              <span style={{ width: "25%" }} />
            </div>
            <div className="flex items-center justify-between flex-wrap" style={{ marginTop: 10, gap: 6 }}>
              <span className="sx-num" style={{ fontSize: 13, color: "var(--sx-text)" }}>
                $12.40 <span style={{ color: "var(--sx-text-4)" }}>of $50.00</span>
              </span>
              <span className="sx-caption">back to zero at 00:00 UTC</span>
            </div>
            <p className="sx-caption" style={{ marginTop: 16, lineHeight: 1.6 }}>
              The protocol reverts any attempt to overspend. There is no custodian and no way to override it.
            </p>
          </div>
        </div>
      </div>
    </MockWindow>
  );
}
