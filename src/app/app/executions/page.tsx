"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database as RawDatabase, Transaction, TransactionStatus, PrivacyLayer } from "@/lib/supabase/database.types";
import { Arrow } from "@/components/sx";

type TxStatus = TransactionStatus;

type Direction = "in" | "out";

// database.types.ts's Tables/Views entries don't carry a `Relationships` array,
// which recent @supabase/supabase-js versions require for the schema generic to
// resolve (otherwise every `.from()`/`.rpc()` call silently types as `never`).
// This re-shapes the schema locally, for this file only, without touching the
// shared types file or client factory.
type WithRelationships<T> = { [K in keyof T]: T[K] & { Relationships: [] } };
type FixedDatabase = {
  public: {
    Tables: WithRelationships<RawDatabase["public"]["Tables"]>;
    Views: WithRelationships<RawDatabase["public"]["Views"]>;
    Functions: RawDatabase["public"]["Functions"];
  };
};

function db(): SupabaseClient<FixedDatabase> {
  return createClient() as unknown as SupabaseClient<FixedDatabase>;
}

const STATUS_CFG: Record<TxStatus, { label: string; tag: string; color: string }> = {
  settled: { label: "Settled", tag: "sx-tag sx-tag-ok", color: "var(--sx-ok)" },
  pending: { label: "Pending", tag: "sx-tag sx-tag-warn", color: "var(--sx-warn)" },
  failed: { label: "Failed", tag: "sx-tag sx-tag-danger", color: "var(--sx-danger)" },
};

// Privacy layers escalate in accent intensity: neutral, accent text, full accent tag.
const PRIVACY_CFG: Record<PrivacyLayer, { tag: string; color?: string }> = {
  Public: { tag: "sx-tag" },
  Confidential: { tag: "sx-tag", color: "var(--sx-accent)" },
  Shielded: { tag: "sx-tag sx-tag-accent" },
};

function formatTimestamp(iso: string | null) {
  if (!iso) return "n/a";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "n/a";
  const datePart = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const timePart = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${datePart} · ${timePart}`;
}

function formatFinality(ms: number | null) {
  return ms == null ? "n/a" : `${ms}ms`;
}

// Row grid: state, note, other party, layer, amount, finality (desktop); note and amount (mobile)
const ROW_GRID = "grid-cols-[minmax(0,1fr)_auto] xl:grid-cols-[92px_minmax(0,1fr)_minmax(0,170px)_118px_auto_64px]";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "12px 0", borderTop: "1px solid var(--sx-line)" }}>
      <span className="sx-overline" style={{ fontSize: 10 }}>{label}</span>
      {children}
    </div>
  );
}

export default function ExecutionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ownedAccountIds, setOwnedAccountIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [filter, setFilter] = useState<TxStatus | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [disclosureDetailOpen, setDisclosureDetailOpen] = useState<Set<string>>(new Set());
  const [disclosureLoading, setDisclosureLoading] = useState<string | null>(null);
  const [disclosureError, setDisclosureError] = useState<string | null>(null);

  const detailRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // On narrow screens the receipt stacks under the list, so bring it into view when a row opens.
  useEffect(() => {
    if (!selected || !detailRef.current) return;
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1535px)").matches) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selected]);

  async function fetchData() {
    setLoading(true);
    setLoadError(null);
    const supabase = db();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setTransactions([]);
      setOwnedAccountIds(new Set());
      setLoading(false);
      return;
    }

    const { data: accountsData, error: accountsError } = await supabase
      .from("accounts")
      .select("id")
      .eq("owner_id", user.id);

    if (accountsError) {
      setLoadError(accountsError.message);
      setLoading(false);
      return;
    }

    const ownedIds = new Set((accountsData ?? []).map((a) => a.id));
    setOwnedAccountIds(ownedIds);

    const { data: txData, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (txError) {
      setLoadError(txError.message);
      setLoading(false);
      return;
    }

    setTransactions(txData ?? []);
    setLoading(false);
  }

  function directionOf(tx: Transaction): Direction {
    const fromOwned = tx.from_account_id != null && ownedAccountIds.has(tx.from_account_id);
    const toOwned = tx.to_account_id != null && ownedAccountIds.has(tx.to_account_id);
    if (fromOwned) return "out";
    if (toOwned) return "in";
    return "out";
  }

  function isInternal(tx: Transaction) {
    const fromOwned = tx.from_account_id != null && ownedAccountIds.has(tx.from_account_id);
    const toOwned = tx.to_account_id != null && ownedAccountIds.has(tx.to_account_id);
    return fromOwned && toOwned;
  }

  function counterpartyOf(tx: Transaction) {
    return directionOf(tx) === "out" ? tx.to_display : tx.from_display;
  }

  const filtered = filter === "all" ? transactions : transactions.filter((t) => t.status === filter);
  const selectedTx = selected ? transactions.find((t) => t.id === selected) ?? null : null;

  const totalVolume = transactions.filter((t) => t.status === "settled").reduce((s, t) => s + t.amount, 0);

  function toggleReveal(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function formatAmount(tx: Transaction) {
    if (tx.privacy_layer === "Public" || revealed.has(tx.id)) {
      return `$${tx.amount.toFixed(2)}`;
    }
    return "••••• USDG";
  }

  async function handleGenerateDisclosure(tx: Transaction) {
    setDisclosureLoading(tx.id);
    setDisclosureError(null);
    try {
      const supabase = db();
      const { data, error } = await supabase.rpc("generate_disclosure", { p_transaction_id: tx.id });
      if (error) throw new Error(error.message);
      if (data) {
        setTransactions((prev) => prev.map((t) => (t.id === data.id ? data : t)));
      }
    } catch (err) {
      setDisclosureError(err instanceof Error ? err.message : "We could not create the compliance disclosure");
    } finally {
      setDisclosureLoading(null);
    }
  }

  function toggleDisclosureDetail(id: string) {
    setDisclosureDetailOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectTx(id: string) {
    setSelected((prev) => (prev === id ? null : id));
    setDisclosureError(null);
  }

  const kpis = [
    { label: "Settled", value: transactions.filter((t) => t.status === "settled").length, color: "var(--sx-ok)" },
    { label: "Pending", value: transactions.filter((t) => t.status === "pending").length, color: "var(--sx-warn)" },
    { label: "Failed", value: transactions.filter((t) => t.status === "failed").length, color: "var(--sx-danger)" },
    { label: "Value settled", value: `$${totalVolume.toFixed(2)}`, color: undefined },
  ];

  return (
    <div className="sx-app-page" style={{ maxWidth: 1280 }}>
      {/* Page header */}
      <header className="sx-rise" style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 32 }}>
        <div style={{ minWidth: 0, maxWidth: 720 }}>
          <div className="sx-overline" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="sx-dot sx-dot-accent" />
            <span>Activity</span>
          </div>
          <h1 className="sx-h2" style={{ fontSize: "clamp(28px, 3.4vw, 40px)", marginTop: 14 }}>
            Transaction history
          </h1>
          <p className="sx-small" style={{ marginTop: 10, color: "var(--sx-text-2)" }}>
            {loading
              ? "Fetching transactions…"
              : `${transactions.length} transaction${transactions.length !== 1 ? "s" : ""} · $${totalVolume.toFixed(2)} settled in total · verified on Robinhood Chain, with amounts hidden unless you reveal them`}
          </p>
        </div>
        <Link href="/app/run" className="sx-btn sx-btn-primary sx-btn-sm" style={{ height: 40 }}>
          Send money <Arrow size={12} />
        </Link>
      </header>

      {loadError && (
        <div className="sx-alert sx-alert-danger" role="alert" style={{ marginBottom: 24 }}>
          {loadError}
        </div>
      )}

      {/* Telemetry tiles */}
      <div className="sx-rise sx-d1 grid grid-cols-2 lg:grid-cols-4" style={{ gap: 12, marginBottom: 32 }}>
        {kpis.map((s, i) => (
          <div key={s.label} className="sx-card sx-hud" style={{ padding: "18px 18px 20px" }}>
            <div className="sx-telemetry">
              <span className="sx-overline" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="sx-num" style={{ color: "var(--sx-text-4)" }}>0{i + 1}</span>
                {s.color && <span className="sx-dot" style={{ background: s.color }} />}
                <span>{s.label}</span>
              </span>
              {loading ? (
                <span className="sx-skeleton" style={{ height: 34, width: "60%", marginTop: 2 }} />
              ) : (
                <span className="sx-telemetry-value" style={{ fontSize: "clamp(26px, 2.6vw, 34px)", overflowWrap: "anywhere" }}>{s.value}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <div className="sx-segmented" role="group" aria-label="Filter by state" style={{ maxWidth: "100%", overflowX: "auto" }}>
          {(["all", "settled", "pending", "failed"] as const).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
        {!loading && (
          <span className="sx-overline sx-num" style={{ color: "var(--sx-text-4)" }}>
            {filtered.length} / {transactions.length}
          </span>
        )}
      </div>

      <div className={selectedTx ? "grid grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_340px]" : "grid grid-cols-1"} style={{ gap: 16, alignItems: "start" }}>
        {/* Ledger */}
        <div className="sx-card-solid" style={{ overflow: "hidden", minWidth: 0 }}>
          {/* Column header */}
          <div
            className={`${ROW_GRID} hidden xl:grid`}
            style={{
              gap: 16, padding: "12px 20px", borderBottom: "1px solid var(--sx-line)",
              fontFamily: "var(--sx-display)", fontSize: 10.5, fontWeight: 500, letterSpacing: "0.2em",
              textTransform: "uppercase", color: "var(--sx-text-4)",
            }}
          >
            <span>State</span><span>Note</span><span>Other party</span><span>Layer</span><span style={{ textAlign: "right" }}>Amount</span><span style={{ textAlign: "right" }}>Finality</span>
          </div>

          {loading && (
            <div role="status" aria-label="Fetching transactions…">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="sx-row" style={{ padding: "18px 20px", gap: 16 }}>
                  <span className="sx-skeleton" style={{ height: 20, width: 72 }} />
                  <span className="sx-skeleton" style={{ height: 14, flex: 1, maxWidth: 320, opacity: 1 - i * 0.15 }} />
                  <span className="sx-skeleton" style={{ height: 14, width: 64, marginLeft: "auto" }} />
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="sx-empty">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: "var(--sx-text-4)" }}>
                <path d="M4 7h16M4 12h10M4 17h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
              </svg>
              Nothing matches this view.
            </div>
          )}

          {!loading && filtered.map((tx) => {
            const sc = STATUS_CFG[tx.status];
            const pc = PRIVACY_CFG[tx.privacy_layer];
            const isSelected = selected === tx.id;
            const direction = directionOf(tx);
            const counterparty = counterpartyOf(tx);
            const internal = isInternal(tx);
            const hidden = tx.privacy_layer !== "Public";
            return (
              <div
                key={tx.id}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={() => selectTx(tx.id)}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectTx(tx.id);
                  }
                }}
                className={`grid ${ROW_GRID} hover:bg-white/[0.025]`}
                style={{
                  gap: 16, alignItems: "center", position: "relative",
                  padding: "14px 20px",
                  borderBottom: "1px solid var(--sx-line)",
                  marginBottom: -1,
                  background: isSelected ? "var(--sx-accent-surface)" : undefined,
                  boxShadow: isSelected ? "inset 2px 0 0 var(--sx-accent)" : undefined,
                  cursor: "pointer", transition: "background-color 0.2s var(--sx-ease)",
                }}
              >
                {/* Status */}
                <span className="hidden xl:flex">
                  <span className={sc.tag}>{sc.label}</span>
                </span>

                {/* Memo */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: "var(--sx-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tx.memo ?? "n/a"}
                  </div>
                  <div className="sx-mono" style={{ fontSize: 11, color: "var(--sx-text-4)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {tx.id.slice(0, 8)} · {formatTimestamp(tx.created_at)}{internal ? " · between your accounts" : ""}
                  </div>
                  {/* Compact meta for narrow screens */}
                  <div className="flex xl:hidden" style={{ alignItems: "center", gap: 8, marginTop: 8, minWidth: 0 }}>
                    <span className="sx-dot" style={{ background: sc.color }} aria-label={sc.label} />
                    <span className="sx-caption" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {direction === "out" ? "→ " : "← "}{counterparty}
                    </span>
                  </div>
                </div>

                {/* Counterparty */}
                <span
                  className="hidden xl:block"
                  style={{
                    fontSize: 13, color: "var(--sx-text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0,
                    fontFamily: tx.counterparty_type === "human" ? undefined : "var(--sx-mono)",
                  }}
                >
                  <span style={{ color: direction === "out" ? "var(--sx-text-4)" : "var(--sx-accent)" }}>{direction === "out" ? "→ " : "← "}</span>
                  {counterparty}
                </span>

                {/* Privacy layer */}
                <span className="hidden xl:flex">
                  <span className={pc.tag} style={pc.color ? { color: pc.color } : undefined}>{tx.privacy_layer}</span>
                </span>

                {/* Amount */}
                <span style={{ justifySelf: "end", textAlign: "right" }}>
                  {hidden ? (
                    <button
                      type="button"
                      onClick={(e) => toggleReveal(tx.id, e)}
                      title="Click to show the amount"
                      aria-label={revealed.has(tx.id) ? "Hide the amount" : "Click to show the amount"}
                      className="transition-colors hover:border-[var(--sx-line-strong)]"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        background: "transparent", border: "1px solid transparent", borderRadius: "var(--sx-r-sm)",
                        padding: "4px 6px", margin: "-4px -6px", cursor: "pointer",
                        fontFamily: revealed.has(tx.id) ? "var(--sx-display)" : "var(--sx-mono)",
                        fontSize: revealed.has(tx.id) ? 15 : 12,
                        fontVariantNumeric: "tabular-nums",
                        color: revealed.has(tx.id) ? "var(--sx-text)" : "var(--sx-text-3)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatAmount(tx)}
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ color: "var(--sx-text-4)", flexShrink: 0 }}>
                        {revealed.has(tx.id) ? (
                          <path d="M2 2l12 12M6.5 6.6A2 2 0 0 0 9.4 9.5M4.2 4.3C2.8 5.2 1.8 6.6 1.5 8c.8 2.7 3.5 4.5 6.5 4.5 1.2 0 2.3-.3 3.3-.8M7 3.6c.3 0 .7-.1 1-.1 3 0 5.7 1.8 6.5 4.5-.3 1-.8 1.8-1.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        ) : (
                          <>
                            <path d="M1.5 8C2.3 5.3 5 3.5 8 3.5s5.7 1.8 6.5 4.5c-.8 2.7-3.5 4.5-6.5 4.5S2.3 10.7 1.5 8z" stroke="currentColor" strokeWidth="1.3" />
                            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
                          </>
                        )}
                      </svg>
                    </button>
                  ) : (
                    <span className="sx-num" style={{ fontSize: 15, color: "var(--sx-text)", whiteSpace: "nowrap" }}>{formatAmount(tx)}</span>
                  )}
                </span>

                {/* Time (finality) */}
                <span className="hidden xl:block sx-num" style={{ fontSize: 13, color: "var(--sx-text-3)", whiteSpace: "nowrap", textAlign: "right" }}>
                  {formatFinality(tx.finality_ms)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Receipt panel */}
        {selectedTx && (() => {
          const sc = STATUS_CFG[selectedTx.status];
          const pc = PRIVACY_CFG[selectedTx.privacy_layer];
          const direction = directionOf(selectedTx);
          const counterparty = counterpartyOf(selectedTx);
          const detailOpen = disclosureDetailOpen.has(selectedTx.id);
          const isGeneratingThis = disclosureLoading === selectedTx.id;

          return (
            <aside
              ref={detailRef}
              aria-label="Receipt"
              className="sx-card-solid sx-hud 2xl:sticky 2xl:top-[72px]"
              style={{ overflow: "visible", scrollMarginTop: 72, animation: "sx-rise 0.5s var(--sx-ease) both" }}
            >
              {/* Receipt header */}
              <div
                style={{
                  padding: "16px 20px", borderBottom: "1px solid var(--sx-line)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}
              >
                <span className="sx-overline" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="sx-dot" style={{ background: sc.color }} />
                  Receipt
                </span>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Close receipt"
                  className="sx-btn sx-btn-quiet sx-btn-sm"
                  style={{ width: 32, height: 32, padding: 0 }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div style={{ padding: "18px 20px 20px", display: "flex", flexDirection: "column" }}>
                {/* Amount readout */}
                <div className="sx-telemetry" style={{ paddingBottom: 16 }}>
                  <span className="sx-overline" style={{ fontSize: 10 }}>Amount</span>
                  <span className="sx-telemetry-value" style={{ fontSize: 34, overflowWrap: "anywhere" }}>
                    ${selectedTx.amount.toFixed(2)} <span className="sx-overline" style={{ fontSize: 11 }}>USDG</span>
                  </span>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                    <span className={sc.tag}>{sc.label}</span>
                    <span className={pc.tag} style={pc.color ? { color: pc.color } : undefined}>{selectedTx.privacy_layer}</span>
                  </div>
                </div>

                {/* Fields */}
                {[
                  { label: "Transaction reference", value: selectedTx.id, mono: true },
                  { label: "Other party", value: `${direction === "out" ? "To" : "From"} ${counterparty}${isInternal(selectedTx) ? " (between your accounts)" : ""}` },
                  { label: "Date and time", value: formatTimestamp(selectedTx.created_at) },
                  { label: "Time to finality", value: formatFinality(selectedTx.finality_ms) },
                ].map(({ label, value, mono }) => (
                  <Field key={label} label={label}>
                    <span
                      className={mono ? "sx-mono" : undefined}
                      style={{ fontSize: mono ? 12 : 14, color: mono ? "var(--sx-text-2)" : "var(--sx-text)", overflowWrap: "anywhere" }}
                    >
                      {value}
                    </span>
                  </Field>
                ))}

                {/* Memo */}
                <Field label="Note">
                  <span style={{ fontSize: 14, color: "var(--sx-text)", lineHeight: 1.55 }}>
                    {selectedTx.memo ?? "n/a"}
                  </span>
                </Field>

                {/* Tx sig */}
                <Field label="On-chain signature">
                  <span className="sx-mono" style={{ color: selectedTx.tx_sig != null ? "var(--sx-accent)" : "var(--sx-text-4)", wordBreak: "break-all", lineHeight: 1.6 }}>
                    {selectedTx.tx_sig ?? "n/a"}
                  </span>
                </Field>

                {/* Proof hash */}
                {selectedTx.proof_hash != null && (
                  <div
                    style={{
                      marginTop: 8, background: "var(--sx-raised)", border: "1px solid var(--sx-line)",
                      borderRadius: "var(--sx-r-md)", padding: "12px 14px",
                    }}
                  >
                    <div className="sx-overline" style={{ fontSize: 10, marginBottom: 8 }}>
                      Hash of the ZK proof (Robinhood Chain)
                    </div>
                    <div className="sx-mono" style={{ fontSize: 11, color: "var(--sx-text-2)", wordBreak: "break-all", lineHeight: 1.6 }}>
                      {selectedTx.proof_hash}
                    </div>
                  </div>
                )}

                {/* Compliance disclosure for settled */}
                {selectedTx.status === "settled" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedTx.disclosed) toggleDisclosureDetail(selectedTx.id);
                        else handleGenerateDisclosure(selectedTx);
                      }}
                      disabled={isGeneratingThis}
                      aria-expanded={selectedTx.disclosed ? detailOpen : undefined}
                      className="sx-btn sx-btn-secondary sx-btn-sm sx-btn-block"
                      style={{ height: 40 }}
                    >
                      {isGeneratingThis
                        ? "Preparing disclosure…"
                        : selectedTx.disclosed
                          ? (detailOpen ? "Collapse compliance disclosure" : "Open compliance disclosure")
                          : "Create compliance disclosure"}
                    </button>

                    {disclosureError && (
                      <div className="sx-alert sx-alert-danger" role="alert">
                        {disclosureError}
                      </div>
                    )}

                    {selectedTx.disclosed && detailOpen && (
                      <div className="sx-alert sx-alert-accent" style={{ animation: "sx-rise 0.4s var(--sx-ease) both" }}>
                        <span>
                          Disclosure created {formatTimestamp(selectedTx.disclosed_at)}. For compliance review, a view key now exists that unlocks this transaction&apos;s complete proof and settlement details.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Pending notice */}
                {selectedTx.status === "pending" && (
                  <div
                    className="sx-alert"
                    style={{ marginTop: 18, color: "var(--sx-warn)", background: "var(--sx-warn-bg)", borderColor: "rgba(224, 168, 74, 0.28)" }}
                  >
                    The ZK range proof is waiting to be confirmed on-chain. Your balance changes as soon as the validator finalizes the block.
                  </div>
                )}

                {/* Failed notice */}
                {selectedTx.status === "failed" && (
                  <div className="sx-alert sx-alert-danger" style={{ marginTop: 18 }}>
                    Settlement failed for this transaction, so no funds changed hands.
                  </div>
                )}
              </div>
            </aside>
          );
        })()}
      </div>
    </div>
  );
}
