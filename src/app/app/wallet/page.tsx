"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Account, Profile, Transaction } from "@/lib/supabase/database.types";
import { Telemetry } from "@/components/sx";

const TOPUP_PRESETS = ["10", "25", "50", "100"];
const DEPOSIT_ADDRESS = process.env.NEXT_PUBLIC_DEPOSIT_ADDRESS ?? "";

type TopUpStep = "amount" | "deposit" | "verifying" | "success";

function formatUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

function truncateAddress(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} · ${time}`;
}

function startOfCurrentMonthIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export default function WalletPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [spentThisMonth, setSpentThisMonth] = useState<number | null>(null);
  const [totalToppedUp, setTotalToppedUp] = useState<number | null>(null);

  const [showTopUp, setShowTopUp] = useState(false);
  const [amount, setAmount] = useState("50");
  const [topUpStep, setTopUpStep] = useState<TopUpStep>("amount");
  const [topUpStatus, setTopUpStatus] = useState<"idle" | "error">("idle");
  const [topUpError, setTopUpError] = useState("");
  const [depositAddress, setDepositAddress] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const verifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (verifyTimerRef.current) clearTimeout(verifyTimerRef.current);
    };
  }, []);

  const fetchWalletData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const [{ data: profileData }, { data: accountData }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
      supabase.from("accounts").select("*").eq("owner_id", user.id).eq("is_primary", true).single<Account>(),
    ]);

    setProfile(profileData ?? null);
    setAccount(accountData ?? null);

    if (accountData) {
      const primaryId = accountData.id;
      const [{ data: txData }, { data: spentData }, { data: toppedUpData }] = await Promise.all([
        supabase
          .from("transactions")
          .select("*")
          .or(`from_account_id.eq.${primaryId},to_account_id.eq.${primaryId}`)
          .order("created_at", { ascending: false })
          .limit(50)
          .returns<Transaction[]>(),
        supabase
          .from("transactions")
          .select("amount")
          .eq("from_account_id", primaryId)
          .eq("status", "settled")
          .gte("created_at", startOfCurrentMonthIso())
          .returns<{ amount: number }[]>(),
        supabase
          .from("transactions")
          .select("amount")
          .eq("to_account_id", primaryId)
          .eq("counterparty_type", "external")
          .returns<{ amount: number }[]>(),
      ]);

      setTransactions(txData ?? []);
      setSpentThisMonth((spentData ?? []).reduce((sum, row) => sum + Number(row.amount), 0));
      setTotalToppedUp((toppedUpData ?? []).reduce((sum, row) => sum + Number(row.amount), 0));
    } else {
      setTransactions([]);
      setSpentThisMonth(null);
      setTotalToppedUp(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const avgSettlementMs = useMemo(() => {
    const settled = transactions.filter((t) => t.status === "settled" && t.finality_ms != null);
    if (settled.length === 0) return null;
    const total = settled.reduce((sum, t) => sum + (t.finality_ms ?? 0), 0);
    return Math.round(total / settled.length);
  }, [transactions]);

  function resetTopUp() {
    setShowTopUp(false);
    setTopUpStep("amount");
    setTopUpStatus("idle");
    setTopUpError("");
    setDepositAddress("");
    setCopyStatus("idle");
  }

  function handleContinueToDeposit() {
    const parsed = parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setTopUpStatus("error");
      setTopUpError("The amount has to be more than zero.");
      return;
    }
    setTopUpStatus("idle");
    setTopUpError("");
    setDepositAddress(DEPOSIT_ADDRESS);
    setTopUpStep("deposit");
  }

  async function handleCopyAddress() {
    try {
      await navigator.clipboard.writeText(depositAddress);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 1500);
    } catch {
      // clipboard API unavailable, nothing more we can do here
    }
  }

  function handleConfirmTransferred() {
    setTopUpStep("verifying");
    const delayMs = 5000 + Math.random() * 5000;
    verifyTimerRef.current = setTimeout(async () => {
      if (!account) return;
      const parsed = parseFloat(amount);
      const supabase = createClient();
      const { error } = await supabase.rpc("simulate_topup", {
        p_account_id: account.id,
        p_amount: parsed,
      });

      if (error) {
        setTopUpStatus("error");
        setTopUpError(error.message);
        setTopUpStep("amount");
        return;
      }

      setTopUpStep("success");
      await fetchWalletData();
    }, delayMs);
  }

  const stats = [
    { label: "Month to date spend", value: spentThisMonth != null ? formatUsd(spentThisMonth) : "n/a" },
    { label: "Deposited so far", value: totalToppedUp != null ? formatUsd(totalToppedUp) : "n/a" },
    { label: "Typical settlement", value: avgSettlementMs != null ? `${avgSettlementMs}ms` : "n/a" },
  ];

  return (
    <div className="sx-app-page">
      {/* Header */}
      <header className="sx-page-head sx-rise">
        <div>
          <div className="sx-overline">Money</div>
          <h1 className="sx-page-title">Your wallet</h1>
          <p className="sx-page-desc">See how much USDG you hold and every payment in and out.</p>
        </div>
        <div className="sx-page-actions">
          <button disabled={loading || !account} className="sx-btn sx-btn-primary">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M6 1v10M1 6h10" />
            </svg>
            Add funds
          </button>
        </div>
      </header>

      {/* Balance readout */}
      <section
        className="sx-card sx-hud sx-rise sx-d1"
        style={{ padding: "clamp(24px, 4vw, 40px)", marginBottom: 14, overflow: "hidden", borderRadius: "var(--sx-r-2xl)" }}
      >
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "inherit", background: "radial-gradient(ellipse 60% 90% at 100% 0%, rgba(255, 236, 216,0.10), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
          <div style={{ minWidth: 0 }}>
            <div className="sx-overline" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="sx-dot sx-dot-accent" />
              Ready to spend
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
              {loading ? (
                <span className="sx-skeleton" style={{ display: "block", width: 220, height: 56 }} />
              ) : (
                <span className="sx-num" style={{ fontSize: "clamp(44px, 6vw, 72px)", fontWeight: 400, lineHeight: 0.95, color: "var(--sx-text)" }}>
                  {account ? account.balance.toFixed(2) : "n/a"}
                </span>
              )}
              <span className="sx-overline" style={{ fontSize: 13, color: "var(--sx-text-3)" }}>USDG</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, minWidth: 0 }}>
            <span className="sx-overline" style={{ fontSize: 10, color: "var(--sx-text-4)" }}>Linked address</span>
            <span className="sx-mono" style={{ color: "var(--sx-text-2)", overflowWrap: "anywhere" }}>
              {loading
                ? "…"
                : profile?.wallet_address
                  ? `${truncateAddress(profile.wallet_address)} · linked Robinhood Chain address`
                  : "Link a wallet from Settings to see it here"}
            </span>
          </div>
        </div>
      </section>

      {/* Top-up panel */}
      {showTopUp && (
        <section className="sx-card-solid sx-rise" style={{ padding: 24, marginBottom: 14 }}>
          {topUpStep === "amount" && (
            <>
              <div className="sx-overline sx-overline-accent" style={{ marginBottom: 16 }}>Deposit USDG</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                <div className="sx-segmented" role="group" aria-label="Preset amounts">
                  {TOPUP_PRESETS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={amount === v}
                      onClick={() => { setAmount(v); setTopUpStatus("idle"); setTopUpError(""); }}
                      className="sx-num"
                    >
                      ${v}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  aria-label="Other amount"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setTopUpStatus("idle"); setTopUpError(""); }}
                  className="sx-input sx-num"
                  style={{ flex: "1 1 140px", width: "auto", height: 38 }}
                  placeholder="Other amount"
                />
              </div>
              {topUpStatus === "error" && (
                <div className="sx-alert sx-alert-danger" role="alert" style={{ marginBottom: 14 }}>{topUpError || "n/a"}</div>
              )}
              <button onClick={handleContinueToDeposit} disabled={!account} className="sx-btn sx-btn-primary sx-btn-block">
                Next
              </button>
            </>
          )}

          {topUpStep === "deposit" && (
            <>
              <div className="sx-title">
                Transfer ${amount || "0"} USDG to the address below
              </div>
              <p className="sx-small" style={{ margin: "6px 0 16px" }}>
                Any Robinhood Chain wallet works, whether that is MetaMask, Rabby or Robinhood Wallet. After you send, tap the button below and we will check the transfer.
              </p>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "rgba(0,0,0,0.28)", border: "1px solid var(--sx-line)",
                borderRadius: "var(--sx-r-md)", padding: "10px 10px 10px 14px", marginBottom: 14,
              }}>
                <span className="sx-mono" style={{ flex: 1, color: "var(--sx-text-2)", wordBreak: "break-all" }}>
                  {depositAddress}
                </span>
                <button onClick={handleCopyAddress} className="sx-btn sx-btn-secondary sx-btn-sm" style={{ flexShrink: 0 }}>
                  {copyStatus === "copied" ? "Copied!" : "Copy address"}
                </button>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setTopUpStep("amount")} className="sx-btn sx-btn-secondary" style={{ flex: 1 }}>
                  Go back
                </button>
                <button onClick={handleConfirmTransferred} className="sx-btn sx-btn-primary" style={{ flex: 2 }}>
                  I have sent it
                </button>
              </div>
            </>
          )}

          {topUpStep === "verifying" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0", textAlign: "center" }}>
              <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ marginBottom: 16 }}>
                <circle cx="12" cy="12" r="10" stroke="var(--sx-line-strong)" strokeWidth="2" />
                <path d="M22 12a10 10 0 0 0-10-10" stroke="var(--sx-accent)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div className="sx-title">Checking your deposit</div>
              <p className="sx-small" style={{ margin: "6px 0 0" }}>
                Looking for your ${amount || "0"} USDG deposit on Robinhood Chain. Expect this to take only a few seconds.
              </p>
            </div>
          )}

          {topUpStep === "success" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", textAlign: "center" }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%", marginBottom: 14, color: "var(--sx-ok)",
                background: "var(--sx-ok-bg)", border: "1px solid rgba(70,192,138,0.28)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8.5l3.2 3.2L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="sx-title">Funds received</div>
              <p className="sx-small" style={{ margin: "6px 0 18px" }}>
                Your account now includes the ${amount || "0"} USDG you sent.
              </p>
              <button onClick={resetTopUp} className="sx-btn sx-btn-primary" style={{ minWidth: 140 }}>
                Close
              </button>
            </div>
          )}
        </section>
      )}

      {/* KPI row */}
      <div className="sx-kpis sx-rise sx-d2" style={{ marginBottom: 32 }}>
        {stats.map((s) => (
          <div key={s.label} className="sx-card sx-hud sx-kpi">
            <Telemetry
              label={s.label}
              value={loading ? <span className="sx-skeleton" style={{ display: "block", width: 88, height: 28 }} /> : s.value}
            />
          </div>
        ))}
      </div>

      {/* Transaction history */}
      <section className="sx-card-solid sx-rise sx-d3" style={{ overflow: "hidden" }}>
        <div className="sx-panel-head">
          <span className="sx-overline">Payments in and out</span>
          {!loading && account && transactions.length > 0 && <span className="sx-tag">{transactions.length}</span>}
        </div>
        {loading ? (
          <div>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="sx-row" style={{ padding: "16px 20px" }}>
                <div className="sx-skeleton" style={{ width: 32, height: 32, borderRadius: "var(--sx-r-sm)" }} />
                <div style={{ flex: 1 }}>
                  <div className="sx-skeleton" style={{ width: "45%", height: 12 }} />
                  <div className="sx-skeleton" style={{ width: "25%", height: 10, marginTop: 8 }} />
                </div>
                <div className="sx-skeleton" style={{ width: 80, height: 14 }} />
              </div>
            ))}
          </div>
        ) : !account || transactions.length === 0 ? (
          <div className="sx-empty">Nothing has moved through this account so far.</div>
        ) : transactions.map((tx) => {
          const isCredit = tx.to_account_id === account.id;
          const shownAmount = isCredit ? tx.amount : -tx.amount;
          const counterpartyLabel = isCredit ? tx.from_display : tx.to_display;
          const description = tx.memo ? `${counterpartyLabel} · ${tx.memo}` : counterpartyLabel;

          return (
            <div key={tx.id} className="sx-row" style={{ padding: "14px 20px" }}>
              <div aria-hidden="true" style={{
                width: 32, height: 32, borderRadius: "var(--sx-r-sm)", flexShrink: 0,
                background: isCredit ? "var(--sx-ok-bg)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${isCredit ? "rgba(70,192,138,0.22)" : "var(--sx-line)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: isCredit ? "var(--sx-ok)" : "var(--sx-text-3)",
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                  {isCredit ? <path d="M6 1.5v9M2.5 7 6 10.5 9.5 7" /> : <path d="M6 10.5v-9M2.5 5 6 1.5 9.5 5" />}
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, color: "var(--sx-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{description || "n/a"}</div>
                <div className="sx-caption" style={{ marginTop: 3, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {formatTimestamp(tx.created_at)}
                  {tx.status !== "settled" && (
                    <span className={`sx-tag ${tx.status === "failed" ? "sx-tag-danger" : "sx-tag-warn"}`} style={{ height: 18, fontSize: 9.5 }}>{tx.status}</span>
                  )}
                </div>
              </div>
              <div className="sx-num" style={{ flexShrink: 0, textAlign: "right", fontSize: 15, color: isCredit ? "var(--sx-ok)" : "var(--sx-text)" }}>
                {isCredit ? "+" : ""}{shownAmount.toFixed(2)} <span style={{ fontSize: 11, color: "var(--sx-text-4)", letterSpacing: "0.12em" }}>USDG</span>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
