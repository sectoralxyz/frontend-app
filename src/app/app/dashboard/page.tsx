"use client";

import { useState, useEffect, useCallback } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type {
  Database as RawDatabase,
  Account,
  SpendPolicy,
  AccountStatus,
  Transaction,
} from "@/lib/supabase/database.types";
import { ListAgentDrawer, ListAgentDrawerShell } from "@/components/ListAgentDrawer";
import { Telemetry } from "@/components/sx";

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

type AgentAccount = Account & { spend_policies: SpendPolicy | null };

const TAB_LABELS: Record<"overview" | "agents" | "payouts", string> = {
  overview: "Summary",
  agents: "Manage agents",
  payouts: "Settled payments",
};

function formatUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "n/a";
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} · ${time}`;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "agents" | "payouts">("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<AgentAccount | null>(null);
  const [revokeAgent, setRevokeAgent] = useState<AgentAccount | null>(null);
  const [agents, setAgents] = useState<AgentAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const supabase = db();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setAgents([]);
      setTransactions([]);
      setLoading(false);
      return;
    }

    const { data: agentData, error: agentError } = await supabase
      .from("accounts")
      .select("*, spend_policies(*)")
      .eq("owner_id", user.id)
      .eq("type", "agent")
      .order("created_at", { ascending: false });

    if (agentError) {
      setLoadError(agentError.message);
      setAgents([]);
      setTransactions([]);
      setLoading(false);
      return;
    }

    const agentRows = agentData ?? [];
    setAgents(agentRows);

    const agentIds = agentRows.map((a) => a.id);
    if (agentIds.length > 0) {
      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .in("from_account_id", agentIds)
        .order("created_at", { ascending: false });

      if (txError) {
        setLoadError(txError.message);
        setTransactions([]);
      } else {
        setTransactions(txData ?? []);
      }
    } else {
      setTransactions([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  async function handleStatusChange(agentId: string, newStatus: "active" | "paused") {
    setActionError(null);
    setBusyId(agentId);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("set_agent_status", { p_account_id: agentId, p_status: newStatus });
    setBusyId(null);
    if (error) {
      setActionError(error.message);
      return;
    }
    if (data) {
      setAgents((prev) => prev.map((a) => (a.id === agentId ? { ...a, ...data } : a)));
    }
  }

  async function handleRevoke(agent: AgentAccount) {
    setActionError(null);
    setBusyId(agent.id);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("revoke_agent_account", { p_account_id: agent.id });
    setBusyId(null);
    setRevokeAgent(null);
    if (error) {
      setActionError(error.message);
      return;
    }
    if (data) {
      setAgents((prev) => prev.map((a) => (a.id === agent.id ? { ...a, ...data } : a)));
    }
  }

  const totalBalance = agents.reduce((s, a) => s + a.balance, 0);
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const settledTxs = transactions.filter((t) => t.status === "settled");
  const totalSettled = settledTxs.reduce((s, t) => s + t.amount, 0);
  const totalPayments = settledTxs.length;

  function onDrawerClose(refresh?: boolean) {
    setDrawerOpen(false);
    setEditAgent(null);
    if (refresh) fetchAgents();
  }

  const runningAgents = agents.filter((a) => a.status === "active");
  const kpis = [
    { label: "Combined balance", value: formatUsd(totalBalance) },
    { label: "Agents running", value: String(activeAgents) },
    { label: "Settled to date", value: formatUsd(totalSettled) },
    { label: "Payments made", value: totalPayments.toLocaleString() },
  ];

  return (
    <div className="sx-app-page">
      {/* Header */}
      <header className="sx-page-head sx-rise">
        <div>
          <div className="sx-overline">Agents</div>
          <h1 className="sx-page-title">AI Agent Accounts</h1>
          <p className="sx-page-desc">
            {loading ? "Fetching agents…" : `${activeAgents} agent account${activeAgents !== 1 ? "s" : ""} running under spend policy`}
          </p>
        </div>
        <div className="sx-page-actions">
          <button onClick={() => setDrawerOpen(true)} className="sx-btn sx-btn-primary">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M6 1v10M1 6h10" />
            </svg>
            New agent account
          </button>
        </div>
      </header>

      {(loadError || actionError) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {loadError && <div className="sx-alert sx-alert-danger" role="alert">{loadError}</div>}
          {actionError && <div className="sx-alert sx-alert-danger" role="alert">{actionError}</div>}
        </div>
      )}

      {/* KPI row */}
      <div className="sx-kpis sx-rise sx-d1" style={{ marginBottom: 32 }}>
        {kpis.map((kpi) => (
          <div key={kpi.label} className="sx-card sx-hud sx-kpi">
            <Telemetry
              label={kpi.label}
              value={loading ? <span className="sx-skeleton" style={{ display: "block", width: 88, height: 28 }} /> : kpi.value}
            />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="sx-rise sx-d2" style={{ marginBottom: 20, maxWidth: "100%", overflowX: "auto" }}>
        <div className="sx-segmented" role="group" aria-label="Agent views">
          {(["overview", "agents", "payouts"] as const).map((tab) => (
            <button key={tab} type="button" aria-pressed={activeTab === tab} onClick={() => setActiveTab(tab)}>
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && (
        <section className="sx-card-solid" style={{ overflow: "hidden" }}>
          <div className="sx-panel-head">
            <span className="sx-overline">Agents you run</span>
            {!loading && <span className="sx-tag">{runningAgents.length} live</span>}
          </div>
          {loading ? (
            <ListSkeleton />
          ) : runningAgents.length === 0 ? (
            <div className="sx-empty">None of your agents are running right now.</div>
          ) : runningAgents.map((agent) => {
            const agentTxs = settledTxs.filter((t) => t.from_account_id === agent.id);
            const agentSettled = agentTxs.reduce((s, t) => s + t.amount, 0);
            return (
              <div key={agent.id} className="sx-row" style={{ flexWrap: "wrap", gap: "14px 28px", padding: "16px 20px" }}>
                <div style={{ flex: "1 1 220px", minWidth: 0, display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="sx-dot sx-dot-live" />
                  <div style={{ minWidth: 0 }}>
                    <div className="sx-title" style={{ fontSize: 14 }}>{agent.name}</div>
                    <div className="sx-caption" style={{ marginTop: 2 }}>
                      {agent.spend_policies ? `up to ${formatUsd(agent.spend_policies.max_per_request)} each request` : "n/a"}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
                  <StatCell label="Payments made" value={agentTxs.length.toLocaleString()} />
                  <StatCell label="Settled value" value={formatUsd(agentSettled)} highlight />
                  <StatCell label="Available" value={formatUsd(agent.balance)} highlight />
                </div>
              </div>
            );
          })}
        </section>
      )}

      {activeTab === "agents" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {loading ? (
            <div className="sx-card-solid" style={{ overflow: "hidden" }}><ListSkeleton /></div>
          ) : agents.length === 0 ? (
            <div className="sx-card-solid sx-empty">You have no agent accounts so far. Hit &quot;New agent account&quot; to set one up.</div>
          ) : agents.map((agent) => {
            const agentTxs = settledTxs.filter((t) => t.from_account_id === agent.id);
            const agentSettled = agentTxs.reduce((s, t) => s + t.amount, 0);
            const isBusy = busyId === agent.id;
            return (
              <article key={agent.id} className="sx-card-solid" style={{ padding: 20, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "18px 28px", opacity: agent.status === "revoked" ? 0.6 : 1 }}>
                <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span className="sx-title" style={{ fontSize: 15 }}>{agent.name}</span>
                    <StatusBadge status={agent.status} />
                  </div>
                  <div className="sx-caption" style={{ marginTop: 6 }}>
                    <span className="sx-mono" style={{ fontSize: 11.5 }}>{agent.handle}.sectoral</span>
                    {agent.spend_policies ? ` · capped at ${formatUsd(agent.spend_policies.max_per_request)} for each request` : ""}
                  </div>
                </div>
                {agent.status !== "revoked" && (
                  <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
                    <StatCell label="Payments made" value={agentTxs.length.toLocaleString()} />
                    <StatCell label="Settled value" value={formatUsd(agentSettled)} highlight />
                    <StatCell label="Available" value={formatUsd(agent.balance)} highlight />
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
                  {agent.status !== "revoked" && (
                    <button onClick={() => setEditAgent(agent)} disabled={isBusy} className="sx-btn sx-btn-secondary sx-btn-sm">
                      Edit policy
                    </button>
                  )}
                  {agent.status === "paused" && (
                    <button onClick={() => handleStatusChange(agent.id, "active")} disabled={isBusy} className="sx-btn sx-btn-secondary sx-btn-sm">
                      {isBusy ? "…" : "Unpause"}
                    </button>
                  )}
                  {agent.status === "active" && (
                    <button onClick={() => handleStatusChange(agent.id, "paused")} disabled={isBusy} className="sx-btn sx-btn-quiet sx-btn-sm" style={{ borderColor: "var(--sx-line-strong)" }}>
                      {isBusy ? "…" : "Pause agent"}
                    </button>
                  )}
                  {agent.status !== "revoked" && (
                    <button onClick={() => setRevokeAgent(agent)} disabled={isBusy} className="sx-btn sx-btn-danger sx-btn-sm">
                      Revoke access
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {activeTab === "payouts" && (
        <section className="sx-card-solid" style={{ overflow: "hidden" }}>
          <div className="sx-panel-head">
            <span className="sx-overline">{TAB_LABELS.payouts}</span>
            {!loading && <span className="sx-tag">{transactions.length.toLocaleString()}</span>}
          </div>
          {loading ? (
            <ListSkeleton />
          ) : transactions.length === 0 ? (
            <div className="sx-empty">Nothing has settled so far. Once your agents pay for something, it shows up in this list.</div>
          ) : transactions.map((tx) => {
            const agent = agents.find((a) => a.id === tx.from_account_id);
            return (
              <div key={tx.id} className="sx-row" style={{ justifyContent: "space-between", padding: "14px 20px" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, color: "var(--sx-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {agent?.name ?? tx.from_display} <span style={{ color: "var(--sx-text-4)" }}>→</span> {tx.to_display}
                  </div>
                  <div className="sx-caption" style={{ marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {formatTimestamp(tx.created_at)}{tx.memo ? ` · ${tx.memo}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                  <TxStatusBadge status={tx.status} />
                  <span className="sx-num" style={{ fontSize: 15, color: "var(--sx-text)", minWidth: 64, textAlign: "right" }}>{formatUsd(tx.amount)}</span>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Create agent account drawer */}
      {drawerOpen && (
        <ListAgentDrawerShell onClose={() => onDrawerClose(false)}>
          <ListAgentDrawer onClose={() => onDrawerClose(true)} />
        </ListAgentDrawerShell>
      )}

      {/* Edit agent drawer */}
      {editAgent && (
        <ListAgentDrawerShell
          onClose={() => onDrawerClose(false)}
          title="Edit policy"
          description={<span className="sx-mono">{editAgent.handle}.sectoral</span>}
        >
          <EditAgentDrawer agent={editAgent} onClose={(refresh) => onDrawerClose(refresh)} />
        </ListAgentDrawerShell>
      )}

      {/* Revoke confirmation */}
      {revokeAgent && (
        <RevokeConfirmModal
          agent={revokeAgent}
          busy={busyId === revokeAgent.id}
          onCancel={() => setRevokeAgent(null)}
          onConfirm={() => handleRevoke(revokeAgent)}
        />
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="sx-row" style={{ padding: "18px 20px" }}>
          <div style={{ flex: 1 }}>
            <div className="sx-skeleton" style={{ width: "40%", height: 12 }} />
            <div className="sx-skeleton" style={{ width: "24%", height: 10, marginTop: 8 }} />
          </div>
          <div className="sx-skeleton" style={{ width: 72, height: 14 }} />
        </div>
      ))}
    </div>
  );
}

function RevokeConfirmModal({ agent, busy, onCancel, onConfirm }: { agent: AgentAccount; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <>
      <div className="sx-overlay sx-glass" onClick={busy ? undefined : onCancel} />
      <div className="sx-dialog" role="alertdialog" aria-modal="true" aria-labelledby="revoke-agent-title" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <span className="sx-tag sx-tag-danger">Irreversible</span>
          <h2 id="revoke-agent-title" className="sx-h3" style={{ marginTop: 14 }}>Permanently revoke {agent.name}?</h2>
          <p className="sx-small" style={{ marginTop: 10, color: "var(--sx-text-2)" }}>
            There is no coming back from this. {agent.handle}.sectoral loses the ability to send or receive payments, and
            the {formatUsd(agent.balance)} USDG it holds gets swept into your main account. You will not be able to reverse it.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} disabled={busy} className="sx-btn sx-btn-secondary" style={{ flex: 1 }}>
            Keep agent
          </button>
          <button onClick={onConfirm} disabled={busy} className="sx-btn sx-btn-danger" style={{ flex: 1 }}>
            {busy ? "Revoking access…" : "Yes, revoke it"}
          </button>
        </div>
      </div>
    </>
  );
}

function EditAgentDrawer({ agent, onClose }: { agent: AgentAccount; onClose: (refresh?: boolean) => void }) {
  const [form, setFormState] = useState({
    name: agent.name,
    description: agent.description ?? "",
    maxPerRequest: agent.spend_policies ? String(agent.spend_policies.max_per_request) : "0",
    maxPerDay: agent.spend_policies ? String(agent.spend_policies.max_per_day) : "0",
    allowedDomains: agent.spend_policies ? agent.spend_policies.allowed_domains.join(", ") : "",
    webhookUrl: agent.spend_policies?.webhook_url ?? "",
  });
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function set(key: keyof typeof form, value: string) {
    setFormState((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitStatus("submitting");
    setErrorMsg("");

    try {
      const supabase = createClient();

      const maxPerRequest = parseFloat(form.maxPerRequest);
      const maxPerDay = parseFloat(form.maxPerDay);
      if (!Number.isFinite(maxPerRequest) || maxPerRequest < 0) throw new Error("The per request cap needs to be a number of zero or more.");
      if (!Number.isFinite(maxPerDay) || maxPerDay < 0) throw new Error("The daily cap needs to be a number of zero or more.");

      const allowedDomains = form.allowedDomains
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);

      const { error: accountError } = await supabase
        .from("accounts")
        .update({ name: form.name, description: form.description || null })
        .eq("id", agent.id);
      if (accountError) throw new Error(accountError.message);

      const { error: policyError } = await supabase
        .from("spend_policies")
        .update({
          max_per_request: maxPerRequest,
          max_per_day: maxPerDay,
          allowed_domains: allowedDomains,
          webhook_url: form.webhookUrl || null,
        })
        .eq("account_id", agent.id);
      if (policyError) throw new Error(policyError.message);

      setSubmitStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "That did not work. Please retry.");
      setSubmitStatus("error");
    }
  }

  if (submitStatus === "success") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 18, padding: 40, textAlign: "center" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--sx-ok-bg)", border: "1px solid rgba(70,192,138,0.28)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sx-ok)" }}>
          <svg width="20" height="20" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <div className="sx-h3" style={{ textTransform: "uppercase" }}>Changes saved</div>
          <p className="sx-small" style={{ marginTop: 8 }}>The new spend policy for this agent is now in place.</p>
        </div>
        <button onClick={() => onClose(true)} className="sx-btn sx-btn-primary" style={{ marginTop: 6, minWidth: 140 }}>
          Close
        </button>
      </div>
    );
  }

  const submitting = submitStatus === "submitting";
  const req = <span style={{ color: "var(--sx-danger)" }}>*</span>;
  const opt = (text: string) => <span style={{ color: "var(--sx-text-4)", letterSpacing: "0.08em", textTransform: "none" }}>{text}</span>;

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20, overflowY: "auto", flex: 1, padding: 28 }}>
      {submitStatus === "error" && <div className="sx-alert sx-alert-danger" role="alert">{errorMsg}</div>}

      <div className="sx-field">
        <label htmlFor="edit-agent-name" className="sx-label">Name for this agent {req}</label>
        <input id="edit-agent-name" required value={form.name} onChange={e => set("name", e.target.value)} disabled={submitting} className="sx-input" />
      </div>

      <div className="sx-field">
        <label htmlFor="edit-agent-desc" className="sx-label">What it does</label>
        <textarea id="edit-agent-desc" value={form.description} onChange={e => set("description", e.target.value)} disabled={submitting} rows={4} className="sx-input" />
      </div>

      <div className="sx-overline sx-overline-accent" style={{ marginTop: 6, paddingTop: 20, borderTop: "1px solid var(--sx-line)" }}>Spend policy</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, alignItems: "end" }}>
        <div className="sx-field">
          <label htmlFor="edit-agent-req" className="sx-label">Cap for each request (USDG) {req}</label>
          <input id="edit-agent-req" required type="number" min="0" step="0.01" value={form.maxPerRequest} onChange={e => set("maxPerRequest", e.target.value)} disabled={submitting} className="sx-input sx-num" />
        </div>
        <div className="sx-field">
          <label htmlFor="edit-agent-day" className="sx-label">Cap for each day (USDG) {req}</label>
          <input id="edit-agent-day" required type="number" min="0" step="0.01" value={form.maxPerDay} onChange={e => set("maxPerDay", e.target.value)} disabled={submitting} className="sx-input sx-num" />
        </div>
      </div>

      <div className="sx-field">
        <label htmlFor="edit-agent-domains" className="sx-label">Domains it may pay {opt("(optional, separate with commas)")}</label>
        <input id="edit-agent-domains" value={form.allowedDomains} onChange={e => set("allowedDomains", e.target.value)} disabled={submitting} className="sx-input" placeholder="api.datavendor.com, api.othervendor.com" />
      </div>

      <div className="sx-field">
        <label htmlFor="edit-agent-webhook" className="sx-label">Webhook URL {opt("(optional, we notify it about payments)")}</label>
        <input id="edit-agent-webhook" value={form.webhookUrl} onChange={e => set("webhookUrl", e.target.value)} disabled={submitting} className="sx-input" placeholder="https://your-service.com/webhooks/sectoral" />
      </div>

      <button type="submit" disabled={submitting} className="sx-btn sx-btn-primary sx-btn-block" style={{ marginTop: 6 }}>
        {submitting ? "Saving…" : "Save policy"}
      </button>
    </form>
  );
}

function StatCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ minWidth: 84 }}>
      <div className="sx-overline" style={{ fontSize: 9.5, color: "var(--sx-text-4)" }}>{label}</div>
      <div className="sx-num" style={{ marginTop: 6, fontSize: 16, color: highlight ? "var(--sx-text)" : "var(--sx-text-2)" }}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: AccountStatus }) {
  const cfg: Record<AccountStatus, { label: string; cls: string }> = {
    active: { label: "Running", cls: "sx-tag sx-tag-ok" },
    paused: { label: "Paused", cls: "sx-tag sx-tag-warn" },
    revoked: { label: "Revoked", cls: "sx-tag sx-tag-danger" },
  };
  const c = cfg[status];
  return <span className={c.cls}>{c.label}</span>;
}

function TxStatusBadge({ status }: { status: Transaction["status"] }) {
  const cls: Record<Transaction["status"], string> = {
    settled: "sx-tag sx-tag-ok",
    pending: "sx-tag sx-tag-warn",
    failed: "sx-tag sx-tag-danger",
  };
  return <span className={cls[status]}>{capitalize(status)}</span>;
}
