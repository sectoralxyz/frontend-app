"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ApiKey, ApiKeyEnvironment, Webhook } from "@/lib/supabase/database.types";
import { Arrow } from "@/components/sx";

const WEBHOOK_EVENT_OPTIONS = ["transfer.settled", "transfer.failed", "payment.received", "policy.limit_reached"];

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function formatDate(iso: string | null): string {
  if (!iso) return "n/a";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="5" y="5" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5l3.2 3L13 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon({ off }: { off?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M1.5 8C2.3 5.3 5 3.5 8 3.5s5.7 1.8 6.5 4.5c-.8 2.7-3.5 4.5-6.5 4.5S2.3 10.7 1.5 8z" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
      {off && <path d="M2 14L14 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />}
    </svg>
  );
}

/** Panel with a titled header bar and an optional action on the right. */
function Panel({ index, title, meta, action, children }: { index: string; title: string; meta?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="sx-card-solid" style={{ overflow: "hidden" }}>
      <header
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
          padding: "16px 20px", borderBottom: "1px solid var(--sx-line)",
        }}
      >
        <div className="sx-overline" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="sx-num sx-accent">{index}</span>
          <span aria-hidden="true" style={{ width: 20, height: 1, background: "var(--sx-line-strong)" }} />
          <span style={{ color: "var(--sx-text-2)" }}>{title}</span>
          {meta}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function ListSkeleton() {
  return (
    <div role="status" aria-label="Fetching…">
      {[0, 1].map((i) => (
        <div key={i} className="sx-row" style={{ padding: "18px 20px", flexDirection: "column", alignItems: "stretch", gap: 10 }}>
          <span className="sx-skeleton" style={{ height: 14, width: "40%" }} />
          <span className="sx-skeleton" style={{ height: 12, width: "65%", opacity: 0.6 }} />
        </div>
      ))}
    </div>
  );
}

export default function KeysPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);

  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEnv, setNewEnv] = useState<ApiKeyEnvironment>("live");
  const [createStatus, setCreateStatus] = useState<"idle" | "creating" | "error">("idle");
  const [createError, setCreateError] = useState("");

  const [revealedKey, setRevealedKey] = useState<{ id: string; secret: string } | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [secretMasked, setSecretMasked] = useState(false);

  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([]);
  const [webhookStatus, setWebhookStatus] = useState<"idle" | "creating" | "error">("idle");
  const [webhookError, setWebhookError] = useState("");

  async function fetchAll() {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setUserId(user.id);
    const [keysRes, webhooksRes] = await Promise.all([
      supabase.from("api_keys").select("*").eq("profile_id", user.id).order("created_at", { ascending: false }),
      supabase.from("webhooks").select("*").eq("profile_id", user.id).order("created_at", { ascending: false }),
    ]);
    setKeys((keysRes.data as ApiKey[]) ?? []);
    setWebhooks((webhooksRes.data as Webhook[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
  }, []);

  // The plaintext secret only ever exists in memory, between generation and
  // dismissal. It is never written to the database or to storage, so once
  // this clears (dismiss, or the component unmounts) it is genuinely gone.
  useEffect(() => {
    return () => setRevealedKey(null);
  }, []);

  async function handleGenerate() {
    if (!newName.trim() || !userId) return;
    setCreateStatus("creating");
    setCreateError("");
    try {
      const supabase = createClient();
      const randomBytes = crypto.getRandomValues(new Uint8Array(24));
      const randomHex = toHex(randomBytes);
      const prefix = newEnv === "live" ? "hc_live_" : "hc_test_";
      const fullKey = `${prefix}${randomHex}`;
      const digestBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(fullKey));
      const keyHash = toHex(new Uint8Array(digestBuf));
      const keyLast4 = fullKey.slice(-4);

      const { data, error } = await supabase
        .from("api_keys")
        .insert({
          profile_id: userId,
          name: newName.trim(),
          key_prefix: prefix,
          key_last4: keyLast4,
          key_hash: keyHash,
          environment: newEnv,
          active: true,
        } as never)
        .select()
        .single();

      if (error) throw new Error(error.message);

      const created = data as ApiKey;
      setKeys((prev) => [created, ...prev]);
      setRevealedKey({ id: created.id, secret: fullKey });
      setSecretMasked(false);
      setNewName("");
      setNewEnv("live");
      setShowNew(false);
      setCreateStatus("idle");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "That did not work. Please retry.");
      setCreateStatus("error");
    }
  }

  async function handleRevoke(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("api_keys").update({ active: false } as never).eq("id", id);
    if (!error) {
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, active: false } : k)));
    }
  }

  async function handleCopySecret() {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey.secret);
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 1500);
    } catch {
      // clipboard API unavailable, nothing more we can do here
    }
  }

  function toggleWebhookEvent(evt: string) {
    setNewWebhookEvents((prev) => (prev.includes(evt) ? prev.filter((e) => e !== evt) : [...prev, evt]));
  }

  async function handleAddWebhook() {
    if (!newWebhookUrl.trim() || newWebhookEvents.length === 0 || !userId) return;
    setWebhookStatus("creating");
    setWebhookError("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("webhooks")
        .insert({ profile_id: userId, url: newWebhookUrl.trim(), events: newWebhookEvents, active: true } as never)
        .select()
        .single();
      if (error) throw new Error(error.message);
      setWebhooks((prev) => [data as Webhook, ...prev]);
      setNewWebhookUrl("");
      setNewWebhookEvents([]);
      setShowAddWebhook(false);
      setWebhookStatus("idle");
    } catch (err) {
      setWebhookError(err instanceof Error ? err.message : "That did not work. Please retry.");
      setWebhookStatus("error");
    }
  }

  async function handleToggleWebhook(id: string, active: boolean) {
    const supabase = createClient();
    const { error } = await supabase.from("webhooks").update({ active: !active } as never).eq("id", id);
    if (!error) {
      setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, active: !active } : w)));
    }
  }

  async function handleDeleteWebhook(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("webhooks").delete().eq("id", id);
    if (!error) {
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    }
  }

  const webhookSaveDisabled = !newWebhookUrl.trim() || newWebhookEvents.length === 0 || webhookStatus === "creating";

  const kpis = [
    { label: "Active keys", value: keys.filter((k) => k.active).length },
    { label: "Revoked", value: keys.filter((k) => !k.active).length },
    { label: "Endpoints enabled", value: `${webhooks.filter((w) => w.active).length}/${webhooks.length}` },
  ];

  return (
    <div className="sx-app-page" style={{ maxWidth: 980 }}>
      {/* Page header */}
      <header className="sx-rise" style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 32 }}>
        <div style={{ minWidth: 0, maxWidth: 620 }}>
          <div className="sx-overline" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="sx-dot sx-dot-accent" />
            <span>Developers</span>
          </div>
          <h1 className="sx-h2" style={{ fontSize: "clamp(28px, 3.4vw, 40px)", marginTop: 14 }}>
            API Access
          </h1>
          <p className="sx-small" style={{ marginTop: 10, color: "var(--sx-text-2)" }}>
            Keys that let your code start transfers and set up payment policies for agents.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNew(!showNew)}
          aria-expanded={showNew}
          aria-controls="new-key-form"
          className={showNew ? "sx-btn sx-btn-secondary sx-btn-sm" : "sx-btn sx-btn-primary sx-btn-sm"}
          style={{ height: 40 }}
        >
          <PlusIcon /> New key
        </button>
      </header>

      {/* Telemetry tiles */}
      <div className="sx-rise sx-d1 grid grid-cols-1 sm:grid-cols-3" style={{ gap: 12, marginBottom: 24 }}>
        {kpis.map((s, i) => (
          <div key={s.label} className="sx-card sx-hud" style={{ padding: "16px 18px 18px" }}>
            <div className="sx-telemetry">
              <span className="sx-overline" style={{ display: "flex", gap: 8 }}>
                <span className="sx-num" style={{ color: "var(--sx-text-4)" }}>0{i + 1}</span>
                <span>{s.label}</span>
              </span>
              {loading ? (
                <span className="sx-skeleton" style={{ height: 30, width: 56 }} />
              ) : (
                <span className="sx-telemetry-value" style={{ fontSize: "clamp(26px, 2.6vw, 32px)" }}>{s.value}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* One-time secret reveal */}
        {revealedKey && (
          <section
            className="sx-card sx-card-accent sx-hud"
            aria-live="polite"
            style={{ padding: "clamp(18px, 3vw, 24px)", animation: "sx-rise 0.5s var(--sx-ease) both" }}
          >
            <div className="sx-overline sx-overline-accent" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="sx-dot sx-dot-accent" />
              Here is your new key
            </div>
            <p className="sx-small" style={{ marginTop: 10, color: "var(--sx-text-2)" }}>
              You will not see this key again after you leave. Copy it now and keep it somewhere safe.
            </p>
            <div
              style={{
                display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                marginTop: 16, padding: "8px 8px 8px 14px",
                background: "var(--sx-bg)", border: "1px solid var(--sx-accent-line)", borderRadius: "var(--sx-r-md)",
              }}
            >
              <code
                className="sx-mono"
                aria-label={secretMasked ? "Key hidden" : "New API key"}
                style={{ fontSize: 13, color: "var(--sx-text)", flex: "1 1 220px", minWidth: 0, wordBreak: "break-all", lineHeight: 1.6, userSelect: "all" }}
              >
                {secretMasked
                  ? `${revealedKey.secret.slice(0, 8)}${"•".repeat(24)}${revealedKey.secret.slice(-4)}`
                  : revealedKey.secret}
              </code>
              <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: "auto" }}>
                <button
                  type="button"
                  onClick={() => setSecretMasked((m) => !m)}
                  aria-pressed={!secretMasked}
                  aria-label={secretMasked ? "Show key" : "Hide key"}
                  className="sx-btn sx-btn-quiet sx-btn-sm"
                  style={{ width: 36, padding: 0 }}
                >
                  <EyeIcon off={!secretMasked} />
                </button>
                <button type="button" onClick={handleCopySecret} className="sx-btn sx-btn-primary sx-btn-sm">
                  {copyStatus === "copied" ? <CheckIcon /> : <CopyIcon />}
                  {copyStatus === "copied" ? "Copied!" : "Copy key"}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRevealedKey(null)}
              className="sx-btn sx-btn-secondary sx-btn-sm"
              style={{ marginTop: 16 }}
            >
              Done, I have it stored
            </button>
          </section>
        )}

        {/* New key form */}
        {showNew && (
          <section id="new-key-form" className="sx-card" style={{ padding: "clamp(18px, 3vw, 24px)", animation: "sx-rise 0.5s var(--sx-ease) both" }}>
            <div className="sx-overline" style={{ marginBottom: 18 }}>Issue an API key</div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 12 }}>
              <div className="sx-field" style={{ flex: "1 1 240px" }}>
                <label htmlFor="new-key-name" className="sx-label">Label</label>
                <input
                  id="new-key-name"
                  className="sx-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && createStatus !== "creating") handleGenerate();
                  }}
                  placeholder="Label it, such as Production"
                  autoComplete="off"
                />
              </div>
              <div className="sx-field">
                <span id="new-key-env" className="sx-label">Environment</span>
                <div className="sx-segmented" role="group" aria-labelledby="new-key-env" style={{ height: 46, alignItems: "center" }}>
                  {(["live", "test"] as ApiKeyEnvironment[]).map((env) => (
                    <button
                      key={env}
                      type="button"
                      aria-pressed={newEnv === env}
                      onClick={() => setNewEnv(env)}
                      style={{ height: 38, padding: "0 16px", color: newEnv === env ? "var(--sx-accent)" : undefined }}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!newName.trim() || createStatus === "creating"}
                className="sx-btn sx-btn-primary"
                style={{ height: 46, boxShadow: !newName.trim() || createStatus === "creating" ? "none" : undefined }}
              >
                {createStatus === "creating" ? "Issuing…" : <>Issue key <Arrow /></>}
              </button>
            </div>
            {createStatus === "error" && (
              <div className="sx-alert sx-alert-danger" role="alert" style={{ marginTop: 14 }}>{createError}</div>
            )}
            <p className="sx-caption" style={{ marginTop: 14 }}>
              We display the key a single time and cannot recover it later, so save it somewhere secure.
            </p>
          </section>
        )}

        {/* Keys list */}
        <Panel index="01" title="Your keys">
          {loading ? (
            <ListSkeleton />
          ) : keys.length === 0 ? (
            <div className="sx-empty">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: "var(--sx-text-4)" }}>
                <circle cx="8" cy="12" r="4" stroke="currentColor" strokeWidth="1.4" />
                <path d="M12 12h9M18 12v3M21 12v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
              </svg>
              You have not issued any keys so far. Use &quot;+ New key&quot; to make your first.
            </div>
          ) : (
            keys.map((key) => (
              <div key={key.id} className="sx-row" style={{ padding: "16px 20px", flexWrap: "wrap", alignItems: "center", opacity: key.active ? 1 : 0.62 }}>
                <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <span className="sx-title" style={{ fontSize: 15 }}>{key.name}</span>
                    <span className={key.environment === "live" ? "sx-tag sx-tag-accent" : "sx-tag"}>{key.environment}</span>
                    <span className={key.active ? "sx-tag sx-tag-ok" : "sx-tag"}>
                      {key.active && <span className="sx-dot" style={{ background: "currentColor", width: 5, height: 5 }} />}
                      {key.active ? "Live" : "Revoked"}
                    </span>
                  </div>
                  <code
                    className="sx-mono"
                    style={{
                      display: "inline-block", marginTop: 10, padding: "5px 10px", fontSize: 12,
                      color: "var(--sx-text-2)", background: "rgba(255, 255, 255, 0.025)",
                      border: "1px solid var(--sx-line)", borderRadius: "var(--sx-r-sm)",
                      maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}
                  >
                    {key.key_prefix}
                    <span style={{ color: "var(--sx-text-4)", letterSpacing: "0.2em" }}>{"•".repeat(4)}</span>
                    {key.key_last4}
                  </code>
                  <div className="sx-caption" style={{ marginTop: 8, color: "var(--sx-text-4)" }}>
                    Issued {formatDate(key.created_at)} · Most recent use {formatDate(key.last_used_at)}
                  </div>
                </div>
                {key.active && (
                  <button type="button" onClick={() => handleRevoke(key.id)} className="sx-btn sx-btn-danger sx-btn-sm" style={{ flexShrink: 0 }}>
                    Revoke key
                  </button>
                )}
              </div>
            ))
          )}
        </Panel>

        {/* Webhooks */}
        <Panel
          index="02"
          title="Webhook endpoints"
          action={
            <button
              type="button"
              onClick={() => setShowAddWebhook(!showAddWebhook)}
              aria-expanded={showAddWebhook}
              aria-controls="new-webhook-form"
              className="sx-btn sx-btn-secondary sx-btn-sm"
              style={{ height: 32 }}
            >
              <PlusIcon /> New endpoint
            </button>
          }
        >
          {showAddWebhook && (
            <div id="new-webhook-form" style={{ padding: "20px", borderBottom: "1px solid var(--sx-line)", background: "var(--sx-surface)" }}>
              <div className="sx-field">
                <label htmlFor="new-webhook-url" className="sx-label">Endpoint URL</label>
                <input
                  id="new-webhook-url"
                  className="sx-input sx-mono"
                  type="url"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  placeholder="https://example.com/sectoral/webhook"
                  autoComplete="off"
                  style={{ fontSize: 13 }}
                />
              </div>
              <div className="sx-field" style={{ marginTop: 16 }}>
                <span id="new-webhook-events" className="sx-label">Events</span>
                <div role="group" aria-labelledby="new-webhook-events" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {WEBHOOK_EVENT_OPTIONS.map((evt) => {
                    const selected = newWebhookEvents.includes(evt);
                    return (
                      <button
                        key={evt}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleWebhookEvent(evt)}
                        className="sx-mono"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 8,
                          height: 32, padding: "0 12px", borderRadius: "var(--sx-r-sm)", cursor: "pointer",
                          background: selected ? "var(--sx-accent-bg)" : "transparent",
                          border: `1px solid ${selected ? "var(--sx-accent-line)" : "var(--sx-line-strong)"}`,
                          color: selected ? "var(--sx-accent)" : "var(--sx-text-3)",
                          transition: "background-color 0.2s var(--sx-ease), border-color 0.2s var(--sx-ease), color 0.2s",
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            width: 10, height: 10, borderRadius: 2,
                            border: `1px solid ${selected ? "var(--sx-accent)" : "var(--sx-text-4)"}`,
                            background: selected ? "var(--sx-accent)" : "transparent",
                          }}
                        />
                        {evt}
                      </button>
                    );
                  })}
                </div>
              </div>
              {webhookStatus === "error" && (
                <div className="sx-alert sx-alert-danger" role="alert" style={{ marginTop: 14 }}>{webhookError}</div>
              )}
              <button
                type="button"
                onClick={handleAddWebhook}
                disabled={webhookSaveDisabled}
                className="sx-btn sx-btn-primary sx-btn-sm"
                style={{ marginTop: 18, height: 40, boxShadow: webhookSaveDisabled ? "none" : undefined }}
              >
                {webhookStatus === "creating" ? "Saving endpoint…" : "Save endpoint"}
              </button>
            </div>
          )}

          {loading ? (
            <ListSkeleton />
          ) : webhooks.length === 0 ? (
            <div className="sx-empty">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: "var(--sx-text-4)" }}>
                <path d="M4 12h6l2-5 3 10 2-5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" strokeLinejoin="round" />
              </svg>
              You have not added any endpoints so far.
            </div>
          ) : (
            webhooks.map((wh) => (
              <div key={wh.id} className="sx-row" style={{ padding: "16px 20px", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <span className={wh.active ? "sx-dot sx-dot-live" : "sx-dot"} style={wh.active ? undefined : { background: "var(--sx-text-4)" }} />
                    <code className="sx-mono" style={{ fontSize: 13, color: wh.active ? "var(--sx-text)" : "var(--sx-text-3)", overflowWrap: "anywhere" }}>
                      {wh.url}
                    </code>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, paddingLeft: 16 }}>
                    {wh.events.length === 0 ? (
                      <span className="sx-caption">n/a</span>
                    ) : (
                      wh.events.map((e) => (
                        <span key={e} className="sx-tag sx-mono" style={{ fontFamily: "var(--sx-mono)", letterSpacing: "0.02em", textTransform: "none", fontWeight: 400, color: "var(--sx-text-3)" }}>
                          {e}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <span className="sx-overline" style={{ color: wh.active ? "var(--sx-text-2)" : "var(--sx-text-4)", minWidth: 64, textAlign: "right" }}>
                      {wh.active ? "Enabled" : "Disabled"}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={wh.active}
                      aria-label={`Webhook ${wh.url}`}
                      onClick={() => handleToggleWebhook(wh.id, wh.active)}
                      className="sx-switch"
                    />
                  </label>
                  <button type="button" onClick={() => handleDeleteWebhook(wh.id)} className="sx-btn sx-btn-danger sx-btn-sm" style={{ height: 32 }}>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </Panel>

        {/* Docs callout */}
        <section
          className="sx-card sx-hud"
          style={{
            padding: "20px 24px",
            display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16,
            background: "linear-gradient(120deg, var(--sx-accent-surface), transparent 60%), var(--sx-surface)",
          }}
        >
          <div style={{ minWidth: 0, flex: "1 1 260px" }}>
            <div className="sx-overline" style={{ marginBottom: 8 }}>Developer docs</div>
            <div className="sx-small" style={{ color: "var(--sx-text-2)" }}>Build Sectoral into your product using the REST API or the MCP server.</div>
          </div>
          <a href="https://docs.sectoral.xyz" target="_blank" rel="noopener noreferrer" className="sx-btn sx-btn-secondary sx-btn-sm" style={{ height: 40, flexShrink: 0 }}>
            Read the docs <Arrow size={12} />
          </a>
        </section>
      </div>
    </div>
  );
}
