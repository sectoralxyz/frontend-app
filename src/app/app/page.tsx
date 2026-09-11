"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database as RawDatabase, AccountType, PrivacyTier, Transaction } from "@/lib/supabase/database.types";
import { ListAgentDrawer, ListAgentDrawerShell } from "@/components/ListAgentDrawer";
import { Arrow } from "@/components/sx";
import {
  Amount,
  EyeIcon,
  QuickAction,
  AccountRowItem,
  ActivityRow,
  BalanceHero,
} from "@/components/app/accounts-home";
import { type AccountRow, displayHandle } from "@/components/app/format";
import { ICON } from "@/components/app/icons";

const ACCOUNT_TYPES: ("All" | "Human" | "Agent")[] = ["All", "Human", "Agent"];

// ---------------------------------------------------------------------------
// database.types.ts's `Relationships` arrays are empty (this project doesn't
// use the Supabase CLI to generate them), so a nested embed like
// `accounts.select("*, spend_policies(*)")` types the embedded field as a
// `SelectQueryError` even though PostgREST resolves the real foreign key at
// runtime just fine. This re-declares the one relationship this page needs,
// locally, without touching the shared types file.
// ---------------------------------------------------------------------------
type SpendPolicyRelationships = [
  {
    foreignKeyName: "spend_policies_account_id_fkey";
    columns: ["account_id"];
    isOneToOne: true;
    referencedRelation: "accounts";
    referencedColumns: ["id"];
  }
];
type TableRelOverrides = { spend_policies: SpendPolicyRelationships };
type WithRelationships<T> = {
  [K in keyof T]: Omit<T[K], "Relationships"> & {
    Relationships: K extends keyof TableRelOverrides ? TableRelOverrides[K] : [];
  };
};
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


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugifyHandle(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "account";
}

// ---------------------------------------------------------------------------
// Create human sub-account modal
// ---------------------------------------------------------------------------

function CreateHumanAccountModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [privacyTier, setPrivacyTier] = useState<PrivacyTier>("confidential");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus("error");
      setErrorMsg("You need to be signed in.");
      return;
    }

    const base = slugifyHandle(name);
    let attempt = 0;
    let lastError: string | null = null;

    while (attempt < 5) {
      const handle = attempt === 0 ? base : `${base.slice(0, 36)}-${attempt}`;
      const { error } = await supabase.from("accounts").insert({
        owner_id: user.id,
        type: "human",
        name: name.trim(),
        handle,
        privacy_tier: privacyTier,
      });

      if (!error) {
        onCreated();
        onClose();
        return;
      }

      if (error.code === "23505") {
        lastError = error.message;
        attempt += 1;
        continue;
      }

      setStatus("error");
      setErrorMsg(error.message);
      return;
    }

    setStatus("error");
    setErrorMsg(lastError ?? "Every handle we tried was taken. Pick another name and retry.");
  }

  const submitting = status === "submitting";

  return (
    <>
      <div className="sx-overlay sx-glass" onClick={onClose} />
      <div className="sx-dialog" role="dialog" aria-modal="true" aria-labelledby="new-human-account-title">
        <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid var(--sx-line)" }}>
          <div className="sx-overline sx-overline-accent">New account</div>
          <h2 id="new-human-account-title" className="sx-h3" style={{ marginTop: 12, textTransform: "uppercase" }}>New human account</h2>
          <p className="sx-small" style={{ marginTop: 8 }}>
            An extra account held in your own name, such as one for savings or treasury. It opens empty, with a balance of zero.
          </p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18, padding: 24 }}>
          {status === "error" && <div className="sx-alert sx-alert-danger" role="alert">{errorMsg}</div>}
          <div className="sx-field">
            <label htmlFor="human-account-name" className="sx-label">Name this account <span style={{ color: "var(--sx-danger)" }}>*</span></label>
            <input id="human-account-name" required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Treasury, for instance" disabled={submitting} className="sx-input" />
          </div>
          <div className="sx-field">
            <label htmlFor="human-account-tier" className="sx-label">Privacy level</label>
            <select id="human-account-tier" value={privacyTier} onChange={(e) => setPrivacyTier(e.target.value as PrivacyTier)}
              disabled={submitting} className="sx-input" style={{ cursor: "pointer" }}>
              <option value="confidential">Confidential</option>
              <option value="shielded">Shielded</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button type="button" onClick={onClose} disabled={submitting} className="sx-btn sx-btn-secondary" style={{ flex: 1 }}>
              Not now
            </button>
            <button type="submit" disabled={submitting} className="sx-btn sx-btn-primary" style={{ flex: 1 }}>
              {submitting ? "Opening account…" : "Open account"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AccountsPage() {
  const [activeType, setActiveType] = useState<"All" | "Human" | "Agent">("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [activity, setActivity] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [agentDrawerOpen, setAgentDrawerOpen] = useState(false);
  const [humanModalOpen, setHumanModalOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const supabase = db();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setAccounts([]);
      setActivity([]);
      setLoading(false);
      return;
    }

    const [{ data, error }, { data: txData }] = await Promise.all([
      supabase
        .from("accounts")
        .select("*, spend_policies(*)")
        .eq("owner_id", user.id)
        .order("created_at"),
      supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6)
        .returns<Transaction[]>(),
    ]);

    if (error) {
      setLoadError(error.message);
      setAccounts([]);
      setActivity([]);
      setLoading(false);
      return;
    }

    setAccounts(data ?? []);
    setActivity(txData ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const typeFilterValue: AccountType | null = activeType === "Human" ? "human" : activeType === "Agent" ? "agent" : null;

  const filtered = accounts
    .filter((a) => typeFilterValue === null || a.type === typeFilterValue)
    .filter((a) =>
      search === "" ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.handle.toLowerCase().includes(search.toLowerCase()) ||
      (a.description ?? "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "balance-desc") return b.balance - a.balance;
      if (sortBy === "balance-asc") return a.balance - b.balance;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      // "recent": preserve the created_at ascending order from the query, newest last -> reverse for newest first
      return 0;
    });

  if (sortBy === "recent") filtered.reverse();

  const ownedIds = new Set(accounts.map((a) => a.id));
  const total = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const encrypted = accounts.filter((a) => a.privacy_tier !== "public").reduce((sum, a) => sum + Number(a.balance), 0);
  const encryptedShare = total > 0 ? (encrypted / total) * 100 : accounts.length > 0 && accounts.every((a) => a.privacy_tier !== "public") ? 100 : 0;
  const agents = accounts.filter((a) => a.type === "agent");
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const agentBudget = agents.reduce((sum, a) => sum + Number(a.spend_policies?.max_per_day ?? 0), 0);
  const primary = accounts.find((a) => a.is_primary);

  const openCreateMenu = () => setCreateMenuOpen((v) => !v);

  return (
    <div className="sx-app-page">
      {/* Greeting line */}
      <div className="sx-rise flex flex-wrap items-center justify-between" style={{ gap: 12, marginBottom: 20 }}>
        <div className="sx-overline" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="sx-dot sx-dot-live" />
          <span>Money</span>
          <span aria-hidden="true" style={{ color: "var(--sx-text-5)" }}>/</span>
          <span style={{ color: "var(--sx-text-2)" }}>Your accounts</span>
        </div>
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          aria-pressed={revealed}
          className="sx-btn sx-btn-quiet sx-btn-sm"
          style={{ gap: 8, color: revealed ? "var(--sx-text)" : "var(--sx-text-3)" }}
        >
          <EyeIcon open={revealed} />
          {revealed ? "Hide amounts" : "Show amounts"}
        </button>
      </div>

      {loadError && <div className="sx-alert sx-alert-danger" role="alert" style={{ marginBottom: 20 }}>{loadError}</div>}

      {/* Balance hero */}
      <BalanceHero
        loading={loading}
        total={total}
        accountCount={accounts.length}
        revealed={revealed}
        primaryHandle={primary ? displayHandle(primary) : undefined}
        encryptedShare={encryptedShare}
        stats={[
          { label: "Held by people", value: accounts.length - agents.length },
          { label: "Held by agents", value: agents.length },
          { label: "Active", value: accounts.filter((a) => a.status === "active").length },
        ]}
        newAction={
                <div style={{ position: "relative" }}>
                  <QuickAction onClick={openCreateMenu} label="New" ariaLabel="New account" icon={ICON.plus} />
                  {createMenuOpen && (
                    <>
                      <div onClick={() => setCreateMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 90 }} />
                      <div role="menu" className="sx-card-solid sx-rise" style={{
                        position: "absolute", top: "calc(100% + 10px)", left: 0, zIndex: 91,
                        width: 240, padding: 6, borderRadius: "var(--sx-r-lg)", borderColor: "var(--sx-line-strong)",
                        boxShadow: "0 16px 48px rgba(0,0,0,0.55)", animationDuration: "0.35s",
                      }}>
                        {[
                          { label: "For an AI agent", sub: "Runs under a spend policy", onClick: () => { setCreateMenuOpen(false); setAgentDrawerOpen(true); } },
                          { label: "For a person", sub: "Held in your own name", onClick: () => { setCreateMenuOpen(false); setHumanModalOpen(true); } },
                        ].map((opt) => (
                          <button
                            key={opt.label}
                            role="menuitem"
                            onClick={opt.onClick}
                            className="sx-btn-quiet"
                            style={{
                              display: "block", width: "100%", textAlign: "left", padding: "10px 12px",
                              border: "none", borderRadius: "var(--sx-r-sm)", cursor: "pointer",
                              transition: "background-color 0.2s, color 0.2s",
                            }}
                          >
                            <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: "var(--sx-text)" }}>{opt.label}</span>
                            <span className="sx-caption" style={{ display: "block", marginTop: 2 }}>{opt.sub}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
        }
      />

      {/* Accounts + activity */}
      <div className="grid xl:grid-cols-[minmax(0,1fr)_360px]" style={{ gap: 16, marginTop: 16, alignItems: "start" }}>
        <section className="sx-card-solid sx-rise sx-d2" style={{ overflow: "hidden", minWidth: 0 }} aria-label="Accounts">
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid var(--sx-line)" }}>
            <div style={{ marginRight: "auto", display: "flex", alignItems: "baseline", gap: 10 }}>
              <h1 className="sx-h3" style={{ textTransform: "uppercase", fontSize: 18 }}>Accounts</h1>
              <span className="sx-overline" style={{ fontSize: 10 }}>{loading ? "" : `${filtered.length} shown`}</span>
            </div>
            <div className="sx-segmented" role="group" aria-label="Account type">
              {ACCOUNT_TYPES.map((type) => (
                <button key={type} type="button" aria-pressed={activeType === type} onClick={() => setActiveType(type)}>
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: "12px 20px", borderBottom: "1px solid var(--sx-line)", background: "rgba(255,255,255,0.012)" }}>
            <div style={{ position: "relative", flex: "1 1 220px", minWidth: 0 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--sx-text-4)", pointerEvents: "none" }}>
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.25" />
                <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                aria-label="Find an account or handle"
                placeholder="Find an account or handle..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="sx-input"
                style={{ height: 38, paddingLeft: 36, fontSize: 13.5 }}
              />
            </div>
            <select
              aria-label="Sort accounts"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sx-input"
              style={{ height: 38, width: "auto", flex: "0 1 210px", cursor: "pointer", color: "var(--sx-text-2)", fontSize: 13.5 }}
            >
              <option value="recent">Newest first</option>
              <option value="balance-desc">Largest balance first</option>
              <option value="balance-asc">Smallest balance first</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>

          {loading ? (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {[...Array(4)].map((_, i) => (
                <li key={i} className="sx-row" style={{ gap: 16, padding: "16px 20px" }}>
                  <span className="sx-skeleton" style={{ width: 40, height: 40, borderRadius: 12 }} />
                  <span style={{ flex: 1 }}>
                    <span className="sx-skeleton" style={{ display: "block", width: "40%", height: 12 }} />
                    <span className="sx-skeleton" style={{ display: "block", width: "25%", height: 10, marginTop: 8 }} />
                  </span>
                  <span className="sx-skeleton" style={{ width: 80, height: 16 }} />
                </li>
              ))}
            </ul>
          ) : filtered.length === 0 ? (
            <div className="sx-empty">
              <svg width="28" height="28" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true" style={{ color: "var(--sx-text-4)" }}>
                <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" />
                <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" />
                <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" />
                <rect x="9" y="9" width="5.5" height="5.5" rx="1.2" />
              </svg>
              {accounts.length === 0 ? "You have not opened any accounts so far." : `Nothing matches${search ? ` "${search}"` : " this filter"}.`}
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {filtered.map((account) => (
                <AccountRowItem key={account.id} account={account} revealed={revealed} />
              ))}
            </ul>
          )}
        </section>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <section className="sx-card-solid sx-rise sx-d3" style={{ overflow: "hidden" }} aria-label="Recent activity">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid var(--sx-line)" }}>
              <h2 className="sx-h3" style={{ textTransform: "uppercase", fontSize: 16 }}>Recent activity</h2>
              <Link href="/app/executions" className="sx-overline sx-link" style={{ fontSize: 10, color: "var(--sx-text-2)" }}>
                View all
              </Link>
            </div>
            {loading ? (
              <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                {[...Array(4)].map((_, i) => <span key={i} className="sx-skeleton" style={{ display: "block", height: 30 }} />)}
              </div>
            ) : activity.length === 0 ? (
              <div className="sx-empty" style={{ padding: "36px 20px", fontSize: 13 }}>No payments yet. Your first transfer will show up here.</div>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {activity.map((tx) => <ActivityRow key={tx.id} tx={tx} ownedIds={ownedIds} revealed={revealed} />)}
              </ul>
            )}
          </section>

          <section className="sx-card sx-card-accent sx-rise sx-d4" style={{ padding: 20 }} aria-label="Agents">
            <div className="sx-overline sx-overline-accent">Agents</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 14 }}>
              <span className="sx-telemetry-value">{loading ? "·" : activeAgents}</span>
              <span className="sx-small">of {agents.length} running</span>
            </div>
            <p className="sx-small" style={{ marginTop: 10, color: "var(--sx-text-2)" }}>
              {agents.length === 0
                ? "Give an agent its own account and a budget the chain enforces."
                : <>Combined daily allowance <Amount value={agentBudget} revealed={revealed} size={13} />, enforced on-chain.</>}
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              <Link href="/app/dashboard" className="sx-btn sx-btn-secondary sx-btn-sm">Manage agents <Arrow size={12} /></Link>
              <button type="button" onClick={() => setAgentDrawerOpen(true)} className="sx-btn sx-btn-quiet sx-btn-sm">New agent</button>
            </div>
          </section>

          <p className="sx-caption" style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "0 4px" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
              <rect x="3" y="7" width="10" height="7" rx="1.5" />
              <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
            </svg>
            Non-custodial. Your keys stay on this device, and amounts settle encrypted on Robinhood Chain.
          </p>
        </div>
      </div>

      {agentDrawerOpen && (
        <ListAgentDrawerShell onClose={() => setAgentDrawerOpen(false)}>
          <ListAgentDrawer onClose={() => { setAgentDrawerOpen(false); fetchAccounts(); }} />
        </ListAgentDrawerShell>
      )}

      {humanModalOpen && (
        <CreateHumanAccountModal onClose={() => setHumanModalOpen(false)} onCreated={fetchAccounts} />
      )}
    </div>
  );
}
