"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PrivacyTier } from "@/lib/supabase/database.types";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

export const PRIVACY_TIERS: { value: PrivacyTier; label: string }[] = [
  { value: "confidential", label: "Confidential" },
  { value: "shielded", label: "Shielded" },
];

const req = <span style={{ color: "var(--sx-danger)" }}>*</span>;
const opt = (text: string) => (
  <span style={{ color: "var(--sx-text-4)", letterSpacing: "0.08em", textTransform: "none" }}>{text}</span>
);

export function ListAgentDrawer({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    privacyTier: "confidential" as PrivacyTier,
    maxPerRequest: "",
    maxPerDay: "",
    initialFunding: "",
    allowedDomains: "",
    webhookUrl: "",
  });
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [createdHandle, setCreatedHandle] = useState("");

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitStatus("submitting");
    setErrorMsg("");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You need to be signed in to do this.");

      const maxPerRequest = parseFloat(form.maxPerRequest);
      const maxPerDay = parseFloat(form.maxPerDay);
      if (!Number.isFinite(maxPerRequest) || maxPerRequest < 0) {
        throw new Error("Please provide a valid per-request maximum.");
      }
      if (!Number.isFinite(maxPerDay) || maxPerDay < 0) {
        throw new Error("Please provide a valid daily maximum.");
      }

      const allowedDomains = form.allowedDomains
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);

      const initialFunding = form.initialFunding ? parseFloat(form.initialFunding) : 0;

      const { data, error } = await supabase.rpc("create_agent_account", {
        p_name: form.name,
        p_description: form.description || null,
        p_privacy_tier: form.privacyTier,
        p_max_per_request: maxPerRequest,
        p_max_per_day: maxPerDay,
        p_initial_funding: Number.isFinite(initialFunding) ? initialFunding : 0,
        p_allowed_domains: allowedDomains,
        p_webhook_url: form.webhookUrl || null,
      });

      if (error) throw new Error(error.message);
      setCreatedHandle(data?.handle ?? "");
      setSubmitStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "We hit an unexpected problem. Please try again.");
      setSubmitStatus("error");
    }
  }

  if (submitStatus === "success") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 18, padding: 40, textAlign: "center" }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%", color: "var(--sx-ok)",
          background: "var(--sx-ok-bg)", border: "1px solid rgba(70,192,138,0.28)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="20" height="20" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <div className="sx-h3" style={{ textTransform: "uppercase" }}>Your agent account is ready</div>
          <p className="sx-small" style={{ marginTop: 8, maxWidth: 340 }}>
            {createdHandle ? `${createdHandle}.sectoral is live and can now spend within its policy.` : "The new agent account is live and can now spend within its policy."}
          </p>
        </div>
        <button onClick={onClose} className="sx-btn sx-btn-primary" style={{ marginTop: 6, minWidth: 140 }}>
          Close
        </button>
      </div>
    );
  }

  const submitting = submitStatus === "submitting";

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20, overflowY: "auto", flex: 1, padding: 28 }}>

      {submitStatus === "error" && <div className="sx-alert sx-alert-danger" role="alert">{errorMsg}</div>}

      <div className="sx-overline sx-overline-accent">01 · Identity</div>

      {/* Name */}
      <div className="sx-field">
        <label htmlFor="new-agent-name" className="sx-label">Name for the account {req}</label>
        <input id="new-agent-name" required value={form.name} onChange={e => set("name", e.target.value)}
          placeholder="e.g. my-data-agent" disabled={submitting} className="sx-input" />
      </div>

      {/* Description */}
      <div className="sx-field">
        <label htmlFor="new-agent-desc" className="sx-label">What it does {req}</label>
        <textarea id="new-agent-desc" required value={form.description} onChange={e => set("description", e.target.value)}
          placeholder="Describe the agent's job and the things it pays for."
          disabled={submitting} rows={4} className="sx-input" />
      </div>

      {/* Privacy tier + Initial funding */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, alignItems: "end" }}>
        <div className="sx-field">
          <label htmlFor="new-agent-tier" className="sx-label">Level of privacy</label>
          <select id="new-agent-tier" value={form.privacyTier} onChange={e => set("privacyTier", e.target.value as PrivacyTier)}
            disabled={submitting} className="sx-input" style={{ cursor: "pointer" }}>
            {PRIVACY_TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="sx-field">
          <label htmlFor="new-agent-funding" className="sx-label">Starting balance (USDG) {opt("(not required)")}</label>
          <input id="new-agent-funding" type="number" min="0" step="0.01"
            value={form.initialFunding} onChange={e => set("initialFunding", e.target.value)}
            placeholder="e.g. 100" disabled={submitting} className="sx-input sx-num" />
        </div>
      </div>
      <p className="sx-caption" style={{ margin: "-8px 0 0" }}>
        The starting balance comes out of your primary account and lands in this agent account right away.
      </p>

      <div className="sx-overline sx-overline-accent" style={{ marginTop: 6, paddingTop: 20, borderTop: "1px solid var(--sx-line)" }}>02 · Spend policy</div>

      {/* Spending policy */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, alignItems: "end" }}>
        <div className="sx-field">
          <label htmlFor="new-agent-req" className="sx-label">Request ceiling (USDG) {req}</label>
          <input id="new-agent-req" required type="number" min="0" step="0.01"
            value={form.maxPerRequest} onChange={e => set("maxPerRequest", e.target.value)}
            placeholder="e.g. 0.10" disabled={submitting} className="sx-input sx-num" />
        </div>
        <div className="sx-field">
          <label htmlFor="new-agent-day" className="sx-label">Daily ceiling (USDG) {req}</label>
          <input id="new-agent-day" required type="number" min="0" step="0.01"
            value={form.maxPerDay} onChange={e => set("maxPerDay", e.target.value)}
            placeholder="e.g. 50.00" disabled={submitting} className="sx-input sx-num" />
        </div>
      </div>

      {/* Allowed domains */}
      <div className="sx-field">
        <label htmlFor="new-agent-domains" className="sx-label">Approved domains {opt("(separate with commas, not required)")}</label>
        <input id="new-agent-domains" value={form.allowedDomains} onChange={e => set("allowedDomains", e.target.value)}
          placeholder="api.datavendor.com, api.othervendor.com"
          disabled={submitting} className="sx-input" />
      </div>

      {/* Webhook URL */}
      <div className="sx-field">
        <label htmlFor="new-agent-webhook" className="sx-label">Webhook URL {opt("(not required, receives payment notifications)")}</label>
        <input id="new-agent-webhook" value={form.webhookUrl} onChange={e => set("webhookUrl", e.target.value)}
          placeholder="https://your-service.com/webhooks/sectoral"
          disabled={submitting} className="sx-input" />
      </div>

      {/* Submit */}
      <button type="submit" disabled={submitting} className="sx-btn sx-btn-primary sx-btn-block" style={{ marginTop: 6 }}>
        {submitting ? "Setting it up…" : "Set up agent account"}
      </button>
    </form>
  );
}

export function ListAgentDrawerShell({
  onClose,
  children,
  title = "New agent account",
  description = "Complete the fields below to spin up an agent account governed by a spend policy.",
}: {
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: React.ReactNode;
}) {
  // Close on Escape and stop the page behind the sheet from scrolling
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <>
      <div className="sx-overlay sx-glass" onClick={onClose} />
      <div className="sx-sheet" role="dialog" aria-modal="true" aria-labelledby="agent-sheet-title">
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16,
          padding: "28px 28px 22px", borderBottom: "1px solid var(--sx-line)", flexShrink: 0,
        }}>
          <div style={{ minWidth: 0 }}>
            <div className="sx-overline" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="sx-dot sx-dot-accent" />
              Agent account
            </div>
            <h2 id="agent-sheet-title" className="sx-h3" style={{ marginTop: 14, textTransform: "uppercase" }}>{title}</h2>
            <div className="sx-small" style={{ marginTop: 8 }}>{description}</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            width: 36, height: 36, flexShrink: 0, borderRadius: "var(--sx-r-md)",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "transparent", border: "1px solid var(--sx-line-strong)", cursor: "pointer",
            color: "var(--sx-text-2)",
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
