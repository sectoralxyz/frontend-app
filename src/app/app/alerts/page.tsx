"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Alert, AlertPreference } from "@/lib/supabase/database.types";

/* Tag style per alert type. The accent marks security, warn marks limit events;
   payments and system notices stay neutral. */
const TYPE_CFG: Record<Alert["type"], { tag: string; label: string }> = {
  transfer: { tag: "sx-tag", label: "Payment" },
  policy: { tag: "sx-tag sx-tag-warn", label: "Limits" },
  security: { tag: "sx-tag sx-tag-accent", label: "Security" },
  system: { tag: "sx-tag", label: "System" },
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));

  if (diffSec < 60) return "Moments ago";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;

  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Header strip of a panel: overline on the left, optional control on the right. */
function PanelHead({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div
      className="flex flex-wrap items-center justify-between"
      style={{ gap: 12, padding: "16px 18px", borderBottom: "1px solid var(--sx-line)" }}
    >
      <span className="sx-overline">{label}</span>
      {children}
    </div>
  );
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="sx-row" style={{ alignItems: "flex-start" }}>
          <div className="sx-skeleton" style={{ width: 54, height: 18 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="sx-skeleton" style={{ width: "46%", height: 12 }} />
            <div className="sx-skeleton" style={{ width: "78%", height: 10 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AlertsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<Alert[]>([]);
  const [rules, setRules] = useState<AlertPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) {
          setSignedIn(false);
          setLoading(false);
        }
        return;
      }

      const [{ data: alertRows }, { data: prefRows }] = await Promise.all([
        supabase
          .from("alerts")
          .select("*")
          .eq("profile_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("alert_preferences")
          .select("*")
          .eq("profile_id", user.id),
      ]);

      if (cancelled) return;
      setNotifications(alertRows ?? []);
      setRules(prefRows ?? []);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const visible = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const enabledRules = rules.filter((r) => r.enabled).length;

  async function markRead(id: string) {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.read) return;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    const supabase = createClient();
    const { error } = await supabase.from("alerts").update({ read: true }).eq("id", id);
    if (error) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
    }
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const supabase = createClient();
    const { error } = await supabase.from("alerts").update({ read: true }).in("id", unreadIds);
    if (error) {
      setNotifications((prev) => prev.map((n) => (unreadIds.includes(n.id) ? { ...n, read: false } : n)));
    }
  }

  async function toggleRule(rule: AlertPreference) {
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r)));
    const supabase = createClient();
    const { error } = await supabase
      .from("alert_preferences")
      .update({ enabled: !rule.enabled })
      .eq("id", rule.id);
    if (error) {
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, enabled: rule.enabled } : r)));
    }
  }

  const tiles = [
    { label: "Unread", value: unreadCount, live: unreadCount > 0 },
    { label: "Received", value: notifications.length, live: false },
    { label: "Rules on", value: `${enabledRules}/${rules.length}`, live: false },
  ];

  return (
    <div className="sx-app-page">
      {/* Page header */}
      <header
        className="sx-rise flex flex-col sm:flex-row sm:items-end sm:justify-between"
        style={{ gap: 20, paddingBottom: 28, marginBottom: 28, borderBottom: "1px solid var(--sx-line)" }}
      >
        <div style={{ minWidth: 0 }}>
          <div className="sx-overline flex items-center" style={{ gap: 10 }}>
            <span className={`sx-dot ${unreadCount > 0 ? "sx-dot-accent" : ""}`} />
            <span>Alerts</span>
          </div>
          <h1 className="sx-h2" style={{ marginTop: 16, fontSize: "clamp(28px, 3.2vw, 40px)" }}>
            Notifications
          </h1>
          <p className="sx-body" style={{ marginTop: 10, maxWidth: 560 }}>
            {loading ? "Fetching your alerts and what you have chosen to hear about." : "Your recent alerts, plus control over which ones you receive."}
          </p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="sx-btn sx-btn-secondary sx-btn-sm shrink-0 self-start sm:self-auto"
        >
          Clear unread
        </button>
      </header>

      {/* Telemetry */}
      {signedIn && (
        <div className="sx-rise sx-d1 grid grid-cols-3" style={{ gap: 12, marginBottom: 24 }}>
          {tiles.map((t, i) => (
            <div key={t.label} className="sx-card sx-hud" style={{ padding: "clamp(14px, 2vw, 20px)", minWidth: 0 }}>
              <div className="sx-telemetry">
                <span className="sx-overline flex items-center" style={{ gap: 8 }}>
                  <span className="sx-accent hidden sm:inline">0{i + 1}</span>
                  <span>{t.label}</span>
                </span>
                {loading ? (
                  <span className="sx-skeleton" style={{ width: 56, height: 32 }} />
                ) : (
                  <span className="sx-telemetry-value" style={{ color: t.live ? "var(--sx-accent)" : undefined }}>
                    {t.value}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="sx-rise sx-d2 grid items-start lg:grid-cols-[minmax(0,1fr)_340px]" style={{ gap: 16 }}>
        {/* Notifications */}
        <section className="sx-card-solid" style={{ overflow: "hidden" }} aria-label="Notifications">
          <PanelHead label="Inbox">
            <div className="sx-segmented" role="group" aria-label="Filter notifications">
              {(["all", "unread"] as const).map((f) => (
                <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={filter === f}>
                  {f}
                  {f === "unread" && unreadCount > 0 ? <span className="sx-num"> ({unreadCount})</span> : ""}
                </button>
              ))}
            </div>
          </PanelHead>

          {loading && <SkeletonRows count={4} />}

          {!loading && !signedIn && (
            <div className="sx-empty">
              <span className="sx-overline">Signed out</span>
              <span>Your alerts appear here once you sign in.</span>
            </div>
          )}

          {!loading && signedIn && visible.length === 0 && (
            <div className="sx-empty">
              <span className="sx-overline">{filter === "unread" ? "Inbox zero" : "No alerts"}</span>
              <span>{filter === "unread" ? "You are all caught up." : "Nothing has come in so far."}</span>
            </div>
          )}

          {!loading && signedIn && visible.length > 0 && (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {visible.map((n) => {
                const cfg = TYPE_CFG[n.type];
                return (
                  <li
                    key={n.id}
                    className="sx-row"
                    onClick={() => markRead(n.id)}
                    onKeyDown={(e) => {
                      if (!n.read && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        markRead(n.id);
                      }
                    }}
                    role={n.read ? undefined : "button"}
                    tabIndex={n.read ? undefined : 0}
                    aria-label={n.read ? undefined : `Mark "${n.title}" as read`}
                    style={{
                      alignItems: "flex-start",
                      gap: 14,
                      background: n.read ? undefined : "var(--sx-accent-surface)",
                      cursor: n.read ? "default" : "pointer",
                    }}
                  >
                    {/* Unread marker */}
                    <span
                      aria-hidden="true"
                      className={`sx-dot ${n.read ? "" : "sx-dot-accent"}`}
                      style={{ marginTop: 7, background: n.read ? "transparent" : undefined, boxShadow: n.read ? "none" : "0 0 10px rgba(255, 236, 216,0.6)" }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex flex-wrap items-center" style={{ gap: 8 }}>
                        <span className={cfg.tag}>{cfg.label}</span>
                        <span
                          className="sx-title"
                          style={{ fontSize: 14, fontWeight: n.read ? 500 : 600, color: n.read ? "var(--sx-text-2)" : "var(--sx-text)" }}
                        >
                          {n.title}
                        </span>
                      </div>
                      <p className="sx-small" style={{ marginTop: 6, color: "var(--sx-text-3)", overflowWrap: "anywhere" }}>
                        {n.body}
                      </p>
                      <div className="sx-caption sx-num" style={{ marginTop: 8, color: "var(--sx-text-4)" }}>
                        {timeAgo(n.created_at)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Alert rules */}
        <section className="sx-card-solid" style={{ overflow: "hidden" }} aria-label="What to alert me about">
          <PanelHead label="What to alert me about">
            {!loading && signedIn && rules.length > 0 && (
              <span className="sx-tag sx-num">{enabledRules} on</span>
            )}
          </PanelHead>
          {loading && (
            <div aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="sx-row" style={{ justifyContent: "space-between" }}>
                  <div className="sx-skeleton" style={{ width: "55%", height: 12 }} />
                  <div className="sx-skeleton" style={{ width: 38, height: 22, borderRadius: 999 }} />
                </div>
              ))}
            </div>
          )}
          {!loading && !signedIn && (
            <div className="sx-empty" style={{ padding: "40px 20px" }}>
              <span>Your alerts appear here once you sign in.</span>
            </div>
          )}
          {!loading && signedIn && rules.length === 0 && (
            <div className="sx-empty" style={{ padding: "40px 20px" }}>
              <span>You have not set up any alert rules so far.</span>
            </div>
          )}
          {!loading && signedIn && rules.map((rule) => (
            <div
              key={rule.id}
              className="sx-row"
              onClick={() => toggleRule(rule)}
              style={{ justifyContent: "space-between", cursor: "pointer" }}
            >
              <span className="sx-small" style={{ color: rule.enabled ? "var(--sx-text)" : "var(--sx-text-2)", fontSize: 14 }}>
                {rule.label}
              </span>
              {/* Clicks bubble to the row, which performs the toggle */}
              <button type="button" role="switch" aria-checked={rule.enabled} aria-label={rule.label} className="sx-switch" />
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
