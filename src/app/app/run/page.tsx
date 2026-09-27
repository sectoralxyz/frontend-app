"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Account, AccountPublic, Transaction, PrivacyLayer } from "@/lib/supabase/database.types";
import { Arrow } from "@/components/sx";

type RunStatus = "idle" | "running" | "complete" | "error";
type PaymentStatus = "none" | "preparing" | "pending" | "verifying" | "expired";

interface HistorySummary {
  count: number;
  total: number;
  last: string | null;
}

const PRIVACY_LAYERS: PrivacyLayer[] = ["Public", "Confidential", "Shielded"];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "n/a";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function VerifiedBadge() {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-label="Verified">
      <circle cx="6" cy="6" r="6" fill="var(--sx-ok)" />
      <path d="M3.5 6l1.8 1.8 3.2-3.6" stroke="var(--sx-bg)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Spinner({ size = 12, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px solid ${color}`,
        borderTopColor: "transparent",
        display: "inline-block",
        flexShrink: 0,
        opacity: 0.85,
        animation: "sx-run-spin 0.7s linear infinite",
      }}
    />
  );
}

/** One numbered step of the send sequence: index, label, completion mark, body. */
function StepCard({
  index,
  label,
  done,
  children,
  style,
}: {
  index: string;
  label: string;
  done: boolean;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <section className="sx-card" style={{ padding: "clamp(18px, 3vw, 24px)", ...style }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
        <div className="sx-overline" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="sx-num" style={{ color: done ? "var(--sx-accent)" : "var(--sx-text-4)" }}>{index}</span>
          <span aria-hidden="true" style={{ width: 20, height: 1, background: "var(--sx-line-strong)" }} />
          <span style={{ color: "var(--sx-text-2)" }}>{label}</span>
        </div>
        <span
          aria-hidden="true"
          className={done ? "sx-dot sx-dot-accent" : "sx-dot"}
          style={done ? { boxShadow: "0 0 0 4px var(--sx-accent-bg)" } : { background: "var(--sx-text-5)" }}
        />
      </header>
      {children}
    </section>
  );
}

/** Label/value line used in the side panels and the review sheet. */
function KV({ label, value, strong, mono }: { label: string; value: ReactNode; strong?: boolean; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, padding: "10px 0", borderTop: "1px solid var(--sx-line)" }}>
      <span className="sx-small" style={{ flexShrink: 0 }}>{label}</span>
      <span
        className={mono ? "sx-mono" : "sx-num"}
        style={{
          fontSize: mono ? 12 : 14,
          color: strong ? "var(--sx-text)" : "var(--sx-text-2)",
          fontWeight: strong ? 600 : 400,
          textAlign: "right",
          minWidth: 0,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/** Color for one line of the transfer log, keyed on its source prefix. */
function logLineColor(l: string): string {
  return l.startsWith("[sectoral] ERROR") ? "var(--sx-danger)"
    : l.startsWith("[sectoral]") ? "var(--sx-accent)"
    : l.startsWith("[robinhood]") ? "var(--sx-text)"
    : l.startsWith("[recipient]") ? "var(--sx-ok)"
    : l.startsWith("[client]") ? "var(--sx-text-3)"
    : l.includes("complete") || l.includes("committed") ? "var(--sx-ok)"
    : "var(--sx-text-3)";
}

function RunPageInner() {
  const searchParams = useSearchParams();
  const initialTo = searchParams.get("to") ?? "";

  // ------------------------------------------------------------------
  // Sender (from account) picker
  // ------------------------------------------------------------------
  const [myAccounts, setMyAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [selectedFromId, setSelectedFromId] = useState<string>("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setLoadingAccounts(false);
        return;
      }
      const { data } = await supabase
        .from("accounts")
        .select("*")
        .eq("owner_id", user.id)
        .eq("status", "active")
        .order("is_primary", { ascending: false });
      const accounts = data ?? [];
      setMyAccounts(accounts);
      const primary = accounts.find((a) => a.is_primary) ?? accounts[0];
      if (primary) setSelectedFromId(primary.id);
      setLoadingAccounts(false);
    });
  }, []);

  const selectedFromAccount = myAccounts.find((a) => a.id === selectedFromId) ?? null;

  // ------------------------------------------------------------------
  // Recipient search (accounts_public, no balance exposed)
  // ------------------------------------------------------------------
  const [recipientInput, setRecipientInput] = useState(initialTo);
  const [recipientMatch, setRecipientMatch] = useState<AccountPublic | null>(null);
  const [recipientResults, setRecipientResults] = useState<AccountPublic[]>([]);
  const [recipientSearching, setRecipientSearching] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  useEffect(() => {
    const cleaned = recipientInput.trim().replace(/^@/, "").replace(/\.sectoral$/i, "");
    if (!cleaned) {
      setRecipientResults([]);
      setRecipientMatch(null);
      setRecipientSearching(false);
      return;
    }
    let cancelled = false;
    setRecipientSearching(true);
    const t = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("accounts_public")
        .select("*")
        .ilike("handle", `%${cleaned}%`)
        .limit(6);
      if (cancelled) return;
      const results = (data ?? []).filter((a) => a.id !== selectedFromId);
      setRecipientResults(results);
      const exact = results.find((a) => a.handle.toLowerCase() === cleaned.toLowerCase());
      setRecipientMatch(exact ?? null);
      setRecipientSearching(false);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [recipientInput, selectedFromId]);

  const handleSelectRecipient = useCallback((acct: AccountPublic) => {
    setRecipientInput(acct.handle);
    setRecipientMatch(acct);
    setRecipientResults([]);
    setInputFocused(false);
  }, []);

  const showDropdown = inputFocused && recipientResults.length > 0;

  // ------------------------------------------------------------------
  // Payment history with this recipient (only visible via my own from-side rows)
  // ------------------------------------------------------------------
  const [history, setHistory] = useState<HistorySummary | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [txResult, setTxResult] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!recipientMatch || !selectedFromId) {
      setHistory(null);
      return;
    }
    let cancelled = false;
    setHistoryLoading(true);
    const supabase = createClient();
    supabase
      .from("transactions")
      .select("amount, created_at")
      .eq("from_account_id", selectedFromId)
      .eq("to_account_id", recipientMatch.id)
      .eq("status", "settled")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled) return;
        const rows = data ?? [];
        setHistory({
          count: rows.length,
          total: rows.reduce((sum, r) => sum + Number(r.amount), 0),
          last: rows[0]?.created_at ?? null,
        });
        setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [recipientMatch, selectedFromId, txResult]);

  // ------------------------------------------------------------------
  // Amount / memo / privacy layer
  // ------------------------------------------------------------------
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [privacyLayer, setPrivacyLayer] = useState<PrivacyLayer>("Confidential");

  const amountNum = Number(amount);
  const amountValid = amount.trim() !== "" && Number.isFinite(amountNum) && amountNum > 0;
  const insufficientBalance = !!selectedFromAccount && amountValid && amountNum > selectedFromAccount.balance;

  // ------------------------------------------------------------------
  // Run / pipeline state
  // ------------------------------------------------------------------
  const [status, setStatus] = useState<RunStatus>("idle");
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const outputRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Payment review/confirm state
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("none");
  const [paymentSecondsLeft, setPaymentSecondsLeft] = useState(300);
  const paymentTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startPaymentTimer() {
    setPaymentSecondsLeft(300);
    if (paymentTimerRef.current) clearInterval(paymentTimerRef.current);
    paymentTimerRef.current = setInterval(() => {
      setPaymentSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(paymentTimerRef.current!);
          setPaymentStatus("expired");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputLines]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (paymentTimerRef.current) clearInterval(paymentTimerRef.current);
    };
  }, []);

  const canSend =
    !loadingAccounts &&
    !!selectedFromId &&
    recipientInput.trim() !== "" &&
    amountValid &&
    !insufficientBalance &&
    status !== "running" &&
    paymentStatus === "none";

  function handleSend() {
    if (!canSend) return;
    setStatus("idle");
    setOutputLines([]);
    setTxResult(null);
    setErrorMessage(null);
    setPaymentStatus("preparing");
    setTimeout(() => {
      setPaymentStatus("pending");
      startPaymentTimer();
    }, 900);
  }

  function handleCancelPayment() {
    if (paymentTimerRef.current) clearInterval(paymentTimerRef.current);
    setPaymentStatus("none");
    setPaymentSecondsLeft(300);
  }

  async function handleConfirmPayment() {
    if (paymentTimerRef.current) clearInterval(paymentTimerRef.current);
    if (!selectedFromId) return;

    setPaymentStatus("verifying");
    setStatus("running");
    setOutputLines([]);

    const startedAt = Date.now();
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - startedAt), 100);

    const atmosphericLines = [
      `[sectoral] setting up a ${privacyLayer.toLowerCase()} transfer...`,
      `[sectoral] looking up recipient "${recipientInput.trim()}"...`,
      `[client]    encrypting the amount as ElGamal ciphertext`,
      `[client]    building the ZK range proof...`,
      `[client]    proof ready`,
      `[client]    packing calldata for ConfidentialToken.transfer`,
      `[robinhood] handing the transaction to the sequencer`,
      `[robinhood] checking the ZK range proof on-chain...`,
    ];

    const animate = async () => {
      for (const line of atmosphericLines) {
        await sleep(170 + Math.random() * 150);
        setOutputLines((prev) => [...prev, line]);
      }
    };

    const supabase = createClient();
    const paymentPromise = supabase.rpc("send_payment", {
      p_from_account_id: selectedFromId,
      p_recipient: recipientInput.trim(),
      p_amount: amountNum,
      p_memo: memo.trim() || null,
      p_privacy_layer: privacyLayer,
    });

    const [, result] = await Promise.all([animate(), paymentPromise]);

    if (timerRef.current) clearInterval(timerRef.current);
    setPaymentStatus("none");
    setPaymentSecondsLeft(300);

    if (result.error) {
      setOutputLines((prev) => [...prev, "", `[sectoral] ERROR: ${result.error.message}`, `[sectoral] transfer did not settle`]);
      setErrorMessage(result.error.message);
      setStatus("error");
      return;
    }

    const tx = result.data;
    setTxResult(tx);
    setOutputLines((prev) => [
      ...prev,
      `[robinhood] proof accepted, transfer approved`,
      `[robinhood] final after ${tx.finality_ms ?? "n/a"}ms`,
      `[recipient] new balance recorded`,
      "",
      `[sectoral] tx hash: ${tx.tx_sig ?? "n/a"}`,
      `[sectoral] hash of proof: ${tx.proof_hash ?? "n/a"}`,
      `[sectoral] transfer settled, all complete`,
    ]);
    setStatus("complete");
  }

  const paymentMins = String(Math.floor(paymentSecondsLeft / 60)).padStart(2, "0");
  const paymentSecs = String(paymentSecondsLeft % 60).padStart(2, "0");

  const statusColor = status === "complete" ? "var(--sx-ok)" : status === "running" ? "var(--sx-warn)" : status === "error" ? "var(--sx-danger)" : "var(--sx-text-3)";
  const statusLabel = status === "complete" ? "Settled" : status === "running" ? "In flight" : status === "error" ? "Failed" : "Ready to send";

  const breadcrumbLabel = recipientMatch ? recipientMatch.name : recipientInput.trim() ? recipientInput.trim() : "Send Money";

  const locked = status === "running";

  // Sequence tracker: configure, review, prove, settle
  const phaseIndex =
    status === "complete" ? 3
    : status === "running" || paymentStatus === "verifying" || status === "error" ? 2
    : paymentStatus === "preparing" || paymentStatus === "pending" || paymentStatus === "expired" ? 1
    : 0;
  const PHASES = ["Configure", "Review", "Prove", "Settle"];

  const reviewTone =
    paymentStatus === "expired" ? "var(--sx-danger)" : paymentStatus === "verifying" ? "var(--sx-ok)" : "var(--sx-warn)";

  return (
    <div className="sx-app-page">
      <style>{`
        @keyframes sx-run-spin { to { transform: rotate(360deg); } }
        @keyframes sx-run-blink { 50% { opacity: 0; } }
        #run-amount::-webkit-inner-spin-button, #run-amount::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        #run-amount { -moz-appearance: textfield; appearance: textfield; }
        @media (prefers-reduced-motion: reduce) {
          .sx-run-cursor { animation: none !important; }
        }
      `}</style>

      {/* Page header */}
      <header className="sx-rise" style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 28 }}>
        <div style={{ minWidth: 0 }}>
          <nav aria-label="Breadcrumb" className="sx-overline" style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <Link href="/app" className="sx-link" style={{ color: "var(--sx-text-3)" }}>
              All accounts
            </Link>
            <span aria-hidden="true" style={{ color: "var(--sx-text-5)" }}>/</span>
            <span style={{ color: "var(--sx-text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{breadcrumbLabel}</span>
          </nav>
          <h1 className="sx-h2" style={{ fontSize: "clamp(28px, 3.4vw, 40px)", marginTop: 14 }}>
            Send money
          </h1>
        </div>

        {/* Live status readout */}
        <div
          role="status"
          aria-live="polite"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 14px",
            borderRadius: "var(--sx-r-md)",
            border: "1px solid var(--sx-line)",
            background: "var(--sx-surface)",
          }}
        >
          <span
            className={status === "complete" ? "sx-dot sx-dot-live" : "sx-dot"}
            style={{ background: statusColor }}
          />
          <span className="sx-overline" style={{ color: statusColor }}>{statusLabel}</span>
          {status === "running" && (
            <span className="sx-num" style={{ fontSize: 13, color: "var(--sx-text-3)" }}>
              T+{(elapsedMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      </header>

      {/* Sequence tracker */}
      <ol
        aria-label="Transfer sequence"
        className="sx-rise sx-d1"
        style={{ listStyle: "none", margin: "0 0 28px", padding: 0, display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}
      >
        {PHASES.map((p, i) => {
          const failed = status === "error" && i === 2;
          const reached = i <= phaseIndex;
          const current = i === phaseIndex && status !== "complete";
          const barColor = failed ? "var(--sx-danger)" : reached ? "var(--sx-accent)" : "var(--sx-line-strong)";
          return (
            <li key={p} aria-current={current ? "step" : undefined} style={{ minWidth: 0 }}>
              <div style={{ height: 2, borderRadius: 2, background: barColor, opacity: reached && !current && !failed && status !== "complete" ? 0.55 : 1, transition: "background-color 0.4s var(--sx-ease)" }} />
              <div className="sx-overline" style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6, color: failed ? "var(--sx-danger)" : reached ? "var(--sx-text-2)" : "var(--sx-text-4)", whiteSpace: "nowrap", overflow: "hidden" }}>
                <span className="sx-num" style={{ color: failed ? "var(--sx-danger)" : reached ? "var(--sx-accent)" : "var(--sx-text-4)" }}>0{i + 1}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{p}</span>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px]" style={{ gap: 24, alignItems: "start" }}>
        {/* Left: the send sequence */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          {/* 01 Recipient search / resolution */}
          <StepCard index="01" label="Recipient" done={!!recipientMatch || (!recipientSearching && recipientInput.trim() !== "")} style={{ zIndex: 2 }}>
            <div className="sx-field" style={{ position: "relative" }}>
              <label htmlFor="run-recipient" className="sr-only">
                Recipient
              </label>
              <input
                id="run-recipient"
                className="sx-input"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setTimeout(() => setInputFocused(false), 150)}
                placeholder="A @handle or an outside domain"
                disabled={locked}
                autoComplete="off"
                role="combobox"
                aria-expanded={showDropdown}
                aria-controls="run-recipient-results"
                aria-autocomplete="list"
              />

              {showDropdown && (
                <div
                  id="run-recipient-results"
                  role="listbox"
                  style={{
                    position: "absolute", left: 0, right: 0, top: "calc(100% + 6px)", zIndex: 20,
                    background: "var(--sx-panel)", border: "1px solid var(--sx-line-strong)",
                    borderRadius: "var(--sx-r-lg)", overflow: "hidden", padding: 4,
                    boxShadow: "0 18px 48px rgba(0,0,0,0.55)",
                  }}
                >
                  {recipientResults.map((r) => (
                    <div
                      key={r.id}
                      role="option"
                      aria-selected={recipientMatch?.id === r.id}
                      onMouseDown={() => handleSelectRecipient(r)}
                      className="transition-colors hover:bg-[var(--sx-surface-hover)]"
                      style={{
                        padding: "10px 12px", cursor: "pointer", borderRadius: "var(--sx-r-md)",
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, color: "var(--sx-text)" }}>{r.name}</div>
                        <div className="sx-mono" style={{ color: "var(--sx-text-3)", marginTop: 2 }}>@{r.handle}</div>
                      </div>
                      <span className="sx-tag">{r.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              {recipientSearching ? (
                <div className="sx-small" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Spinner size={11} color="var(--sx-text-3)" />
                  Looking up...
                </div>
              ) : recipientMatch ? (
                <div
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 14, padding: 14,
                    borderRadius: "var(--sx-r-lg)", background: "var(--sx-accent-surface)", border: "1px solid var(--sx-accent-line)",
                  }}
                >
                  <div
                    aria-hidden="true"
                    className="sx-num"
                    style={{
                      width: 40, height: 40, borderRadius: "var(--sx-r-md)", flexShrink: 0,
                      display: "grid", placeItems: "center", fontSize: 16, fontWeight: 600,
                      background: "var(--sx-accent-bg)", color: "var(--sx-accent)", textTransform: "uppercase",
                    }}
                  >
                    {recipientMatch.name.charAt(0)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="sx-title">{recipientMatch.name}</span>
                      <VerifiedBadge />
                    </div>
                    <div className="sx-mono" style={{ color: "var(--sx-text-3)", marginTop: 2 }}>
                      @{recipientMatch.handle}
                    </div>
                    <p className="sx-small" style={{ marginTop: 8, color: "var(--sx-text-2)" }}>
                      {recipientMatch.description ?? "n/a"}
                    </p>
                  </div>
                </div>
              ) : recipientInput.trim() ? (
                <div className="sx-alert">
                  &quot;{recipientInput.trim()}&quot; does not match any Sectoral account, so the payment goes out as an external transfer.
                </div>
              ) : (
                <p className="sx-small" style={{ margin: 0 }}>
                  Look up a Sectoral @handle, or enter a domain or label outside Sectoral.
                </p>
              )}
            </div>
          </StepCard>

          {/* 02 From account picker */}
          <StepCard index="02" label="Pay from" done={!!selectedFromId}>
            {loadingAccounts ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }} aria-label="Fetching your accounts..." role="status">
                <div className="sx-skeleton" style={{ height: 58, borderRadius: "var(--sx-r-lg)" }} />
                <div className="sx-skeleton" style={{ height: 58, borderRadius: "var(--sx-r-lg)", opacity: 0.6 }} />
              </div>
            ) : myAccounts.length === 0 ? (
              <div className="sx-empty" style={{ padding: "28px 16px" }}>n/a, you have no active accounts.</div>
            ) : (
              <div role="radiogroup" aria-label="Pay from" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {myAccounts.map((a) => {
                  const active = a.id === selectedFromId;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => status !== "running" && setSelectedFromId(a.id)}
                      disabled={locked}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
                        width: "100%", textAlign: "left",
                        padding: "12px 14px", borderRadius: "var(--sx-r-lg)",
                        cursor: locked ? "default" : "pointer",
                        background: active ? "var(--sx-accent-surface)" : "transparent",
                        border: `1px solid ${active ? "var(--sx-accent-line)" : "var(--sx-line)"}`,
                        color: "inherit",
                        transition: "background-color 0.25s var(--sx-ease), border-color 0.25s var(--sx-ease)",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <span
                          aria-hidden="true"
                          style={{
                            width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                            border: `1px solid ${active ? "var(--sx-accent)" : "var(--sx-line-strong)"}`,
                            display: "grid", placeItems: "center",
                          }}
                        >
                          {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--sx-accent)" }} />}
                        </span>
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--sx-text)" }}>
                            {a.name}
                            {a.is_primary && <span className="sx-tag" style={{ height: 18, fontSize: 9.5 }}>MAIN</span>}
                          </span>
                          <span className="sx-mono" style={{ display: "block", color: "var(--sx-text-3)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            @{a.handle} · {a.type}
                          </span>
                        </span>
                      </span>
                      <span className="sx-num" style={{ fontSize: 16, color: "var(--sx-text)", flexShrink: 0 }}>{formatUsd(a.balance)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </StepCard>

          {/* 03 Amount / privacy / memo */}
          <StepCard index="03" label="Amount and privacy" done={amountValid && !insufficientBalance}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="sx-field">
                <label htmlFor="run-amount" className="sx-label">
                  How much
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    aria-hidden="true"
                    className="sx-num"
                    style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 22, color: "var(--sx-text-4)", pointerEvents: "none" }}
                  >
                    $
                  </span>
                  <input
                    id="run-amount"
                    className="sx-input sx-num"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={locked}
                    aria-invalid={insufficientBalance || undefined}
                    style={{
                      height: 60, paddingLeft: 36, paddingRight: 70, fontSize: 26, fontFamily: "var(--sx-display)",
                      borderColor: insufficientBalance ? "rgba(229, 96, 79, 0.5)" : undefined,
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="sx-overline"
                    style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                  >
                    USDG
                  </span>
                </div>
                {insufficientBalance && (
                  <p className="sx-caption" style={{ color: "var(--sx-danger)", margin: 0 }}>
                    This account does not hold enough to cover that.
                  </p>
                )}
              </div>

              <div className="sx-field">
                <span id="run-privacy-label" className="sx-label">
                  Privacy level
                </span>
                <div className="sx-segmented" role="group" aria-labelledby="run-privacy-label" style={{ display: "flex", width: "100%" }}>
                  {PRIVACY_LAYERS.map((layer) => (
                    <button
                      key={layer}
                      type="button"
                      aria-pressed={privacyLayer === layer}
                      onClick={() => status !== "running" && setPrivacyLayer(layer)}
                      disabled={locked}
                      style={{
                        flex: 1, height: 36, minWidth: 0, padding: "0 6px",
                        color: privacyLayer === layer ? "var(--sx-accent)" : undefined,
                        cursor: locked ? "default" : "pointer",
                      }}
                    >
                      {layer}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sx-field">
                <label htmlFor="run-memo" className="sx-label">
                  Memo (optional)
                </label>
                <textarea
                  id="run-memo"
                  className="sx-input"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Add a note about the payment"
                  disabled={locked}
                  rows={3}
                />
              </div>
            </div>

            {/* Launch control */}
            <div
              style={{
                display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16,
                marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--sx-line)",
              }}
            >
              <div className="sx-telemetry" style={{ gap: 6 }}>
                <span className="sx-overline" style={{ fontSize: 10 }}>You send</span>
                <span className="sx-num" style={{ fontSize: 22, lineHeight: 1, color: amountValid ? "var(--sx-text)" : "var(--sx-text-4)" }}>
                  {amountValid ? formatUsd(amountNum) : "n/a"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                className="sx-btn sx-btn-primary"
                style={{ boxShadow: canSend ? undefined : "none" }}
              >
                {status === "running" ? "Sending now..." : paymentStatus === "preparing" ? (
                  <>
                    <Spinner size={12} />
                    Getting ready...
                  </>
                ) : (
                  <>
                    Review and pay <Arrow />
                  </>
                )}
              </button>
            </div>
          </StepCard>

          {/* 04 Payment review / confirm sheet */}
          {(paymentStatus === "pending" || paymentStatus === "verifying" || paymentStatus === "expired") && (
            <section
              className="sx-card-solid sx-hud"
              aria-live="polite"
              style={{
                borderColor: paymentStatus === "expired" ? "rgba(229, 96, 79, 0.32)" : paymentStatus === "verifying" ? "rgba(70, 192, 138, 0.3)" : "rgba(224, 168, 74, 0.3)",
                animation: "sx-rise 0.5s var(--sx-ease) both",
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "16px clamp(18px, 3vw, 24px)",
                  borderBottom: "1px solid var(--sx-line)",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  {paymentStatus === "verifying" ? (
                    <Spinner size={11} color="var(--sx-ok)" />
                  ) : (
                    <span className="sx-dot" style={{ background: reviewTone, boxShadow: paymentStatus === "expired" ? undefined : "0 0 0 4px var(--sx-warn-bg)" }} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div className="sx-overline" style={{ display: "flex", gap: 10 }}>
                      <span className="sx-num sx-accent">04</span>
                      <span>Review</span>
                    </div>
                    <div className="sx-title" style={{ marginTop: 6 }}>
                      {paymentStatus === "expired" ? "Review timed out" : paymentStatus === "verifying" ? "Sending transfer..." : "Check your confidential transfer"}
                    </div>
                  </div>
                </div>
                {paymentStatus === "pending" && (
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div className="sx-overline" style={{ fontSize: 10 }}>Window</div>
                    <div
                      className="sx-num"
                      aria-label={`${paymentMins} minutes ${paymentSecs} seconds left`}
                      style={{ fontSize: 26, lineHeight: 1, marginTop: 6, color: paymentSecondsLeft < 60 ? "var(--sx-danger)" : "var(--sx-warn)" }}
                    >
                      {paymentMins}:{paymentSecs}
                    </div>
                  </div>
                )}
              </div>

              {paymentStatus === "verifying" ? (
                <div style={{ padding: "36px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
                  <Spinner size={30} color="var(--sx-ok)" />
                  <div>
                    <div className="sx-title" style={{ marginBottom: 4 }}>Checking the ZK range proof, then settling</div>
                    <div className="sx-small">Hang tight, this is normally quick...</div>
                  </div>
                </div>
              ) : paymentStatus === "expired" ? (
                <div style={{ padding: "28px 20px", display: "flex", flexDirection: "column", gap: 16, alignItems: "center", textAlign: "center" }}>
                  <p className="sx-body" style={{ margin: 0 }}>
                    Time ran out on this review. Begin a fresh payment to have another go.
                  </p>
                  <button type="button" onClick={handleCancelPayment} className="sx-btn sx-btn-secondary sx-btn-sm">
                    Close
                  </button>
                </div>
              ) : (
                <div style={{ padding: "clamp(18px, 3vw, 24px)", display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Amount */}
                  <div className="sx-telemetry">
                    <span className="sx-overline">You send</span>
                    <span className="sx-telemetry-value">
                      {formatUsd(amountNum)} <span className="sx-overline" style={{ fontSize: 12, letterSpacing: "0.18em" }}>USDG</span>
                    </span>
                  </div>

                  {/* Details */}
                  <div>
                    {[
                      { label: "From", value: selectedFromAccount ? `@${selectedFromAccount.handle}` : "n/a" },
                      { label: "To", value: recipientMatch ? `@${recipientMatch.handle}` : recipientInput.trim() || "n/a" },
                      { label: "Note", value: memo.trim() || "n/a" },
                      { label: "Privacy level", value: privacyLayer },
                    ].map((row) => (
                      <KV key={row.label} label={row.label} value={row.value} strong mono={row.label === "From" || row.label === "To"} />
                    ))}
                  </div>

                  {/* Notice */}
                  <div className="sx-alert sx-alert-accent">
                    <span>
                      When you confirm, a {privacyLayer.toLowerCase()} transfer of <strong style={{ color: "var(--sx-text)" }}>{formatUsd(amountNum)} USDG</strong> goes out. Once it settles, it cannot be reversed.
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    <button type="button" onClick={handleConfirmPayment} className="sx-btn sx-btn-primary" style={{ flex: "1 1 200px" }}>
                      Confirm and pay <Arrow />
                    </button>
                    <button type="button" onClick={handleCancelPayment} className="sx-btn sx-btn-secondary" style={{ flex: "0 1 auto" }}>
                      Go back
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Telemetry log */}
          {(outputLines.length > 0 || status !== "idle") && (
            <section
              className="sx-card-solid sx-hud"
              aria-label="Transfer log"
              style={{ background: "var(--sx-raised)" }}
            >
              {/* Log header */}
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  padding: "14px 18px", borderBottom: "1px solid var(--sx-line)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span
                    className={status === "running" ? "sx-dot sx-dot-live" : "sx-dot"}
                    style={{ background: statusColor }}
                  />
                  <span className="sx-overline" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    Transfer log · <span className="sx-mono" style={{ letterSpacing: "0.04em", textTransform: "none" }}>{txResult ? txResult.id.slice(0, 8) : "…"}</span>
                  </span>
                </div>
                <span className="sx-num" style={{ fontSize: 13, color: status === "complete" ? "var(--sx-ok)" : status === "error" ? "var(--sx-danger)" : "var(--sx-text-3)", flexShrink: 0 }}>
                  T+{(elapsedMs / 1000).toFixed(status === "complete" ? 2 : 1)}s
                </span>
              </div>

              {/* Log body */}
              <div
                ref={outputRef}
                role="log"
                aria-live="polite"
                style={{
                  padding: "14px 0", fontFamily: "var(--sx-mono)", fontSize: 12,
                  lineHeight: "20px", maxHeight: 380, overflowY: "auto",
                  background: "linear-gradient(180deg, rgba(255, 236, 216, 0.025), transparent 40%)",
                }}
              >
                {outputLines.map((line, i) => {
                  const l = line ?? "";
                  return (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "44px minmax(0, 1fr)", padding: "0 18px 0 0" }}>
                      <span aria-hidden="true" style={{ color: "var(--sx-text-5)", textAlign: "right", paddingRight: 14, userSelect: "none" }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span style={{ color: logLineColor(l), whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {line || " "}
                      </span>
                    </div>
                  );
                })}
                {status === "running" && (
                  <div style={{ display: "grid", gridTemplateColumns: "44px minmax(0, 1fr)" }}>
                    <span />
                    <span className="sx-run-cursor" style={{ color: "var(--sx-accent)", animation: "sx-run-blink 1s steps(1) infinite" }}>▋</span>
                  </div>
                )}
              </div>

              {/* Error message */}
              {status === "error" && errorMessage && (
                <div style={{ borderTop: "1px solid var(--sx-line)", padding: 14 }}>
                  <div className="sx-alert sx-alert-danger" role="alert">{errorMessage}</div>
                </div>
              )}

              {/* On-chain receipt */}
              {status === "complete" && txResult && (
                <div
                  style={{
                    borderTop: "1px solid var(--sx-line)", padding: "16px 18px",
                    display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14,
                  }}
                >
                  <div style={{ minWidth: 0, flex: "1 1 220px" }}>
                    <div className="sx-overline" style={{ fontSize: 10, marginBottom: 6 }}>Tx hash</div>
                    <div className="sx-mono" style={{ color: "var(--sx-text-2)", overflowWrap: "anywhere" }}>
                      {(txResult.tx_sig ?? "n/a").slice(0, 48)}
                    </div>
                  </div>
                  <Link href="/app/executions" className="sx-btn sx-btn-secondary sx-btn-sm" style={{ flexShrink: 0 }}>
                    Open receipt <Arrow size={12} />
                  </Link>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right: recipient meta */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }} className="xl:sticky xl:top-[72px]">
          {/* Recipient details */}
          <div className="sx-card" style={{ padding: 20 }}>
            <div className="sx-overline" style={{ marginBottom: 12 }}>
              About the recipient
            </div>
            {recipientMatch ? (
              [
                { label: "Kind of account", value: recipientMatch.type === "agent" ? "AI agent" : "Person" },
                { label: "Privacy level", value: recipientMatch.privacy_tier.charAt(0).toUpperCase() + recipientMatch.privacy_tier.slice(1) },
                { label: "Joined", value: formatDate(recipientMatch.created_at) },
              ].map((s) => <KV key={s.label} label={s.label} value={s.value} strong />)
            ) : (
              <p className="sx-small" style={{ margin: 0 }}>
                {recipientInput.trim()
                  ? "This handle is not on Sectoral, so it will be paid as an external transfer."
                  : "Look up a recipient and their account details appear here."}
              </p>
            )}
          </div>

          {/* Payment history with this recipient */}
          {recipientMatch && (
            <div className="sx-card" style={{ padding: 20 }}>
              <div className="sx-overline" style={{ marginBottom: 12 }}>
                What you have paid them before
              </div>
              {historyLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }} role="status" aria-label="Loading">
                  <div className="sx-skeleton" style={{ height: 14 }} />
                  <div className="sx-skeleton" style={{ height: 14, width: "80%" }} />
                  <div className="sx-skeleton" style={{ height: 14, width: "60%" }} />
                </div>
              ) : (
                [
                  { label: "Number of payments", value: history ? history.count.toLocaleString() : "n/a" },
                  { label: "Sum paid", value: history ? formatUsd(history.total) : "n/a" },
                  { label: "Most recent", value: history ? formatDate(history.last) : "n/a" },
                ].map((s) => <KV key={s.label} label={s.label} value={s.value} strong />)
              )}
            </div>
          )}

          {/* Fee breakdown */}
          <div className="sx-card sx-hud" style={{ padding: 20 }}>
            <div className="sx-overline" style={{ marginBottom: 12 }}>
              What it costs
            </div>
            <KV label="You send" value={amountValid ? formatUsd(amountNum) : "n/a"} />
            <KV label="Network charge" value={amountValid ? formatUsd(0) : "n/a"} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, paddingTop: 14, marginTop: 4, borderTop: "1px solid var(--sx-line-strong)" }}>
              <span className="sx-small" style={{ color: "var(--sx-text-2)" }}>They receive</span>
              <span className="sx-num" style={{ fontSize: 22, color: "var(--sx-text)" }}>
                {amountValid ? formatUsd(amountNum) : "n/a"}
              </span>
            </div>
            <p className="sx-caption" style={{ marginTop: 14, color: "var(--sx-text-4)" }}>
              Transfers carry no network fee from Sectoral.
            </p>
          </div>

          {/* Browse more */}
          <Link href="/app" className="sx-btn sx-btn-quiet sx-btn-block" style={{ border: "1px solid var(--sx-line)" }}>
            See every account
          </Link>
        </aside>
      </div>
    </div>
  );
}

export default function RunPage() {
  return (
    <Suspense>
      <RunPageInner />
    </Suspense>
  );
}
