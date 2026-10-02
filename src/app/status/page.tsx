"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

type ServiceStatus = "operational" | "degraded" | "partial_outage" | "major_outage" | "maintenance";

interface Service {
  name: string;
  description: string;
  status: ServiceStatus;
  uptime: number;
  responseTime: number;
  lastChecked: string;
}

interface IncidentUpdate {
  timestamp: string;
  status: string;
  message: string;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  affectedServices: string[];
  startTime: string;
  endTime?: string;
  duration?: string;
  updates: IncidentUpdate[];
}

interface StatusResponse {
  overall: ServiceStatus;
  uptime: number;
  uptimePeriod: string;
  avgResponseTime: number;
  avgResponseTimeLabel: string;
  services: Service[];
  incidents: { current: Incident[]; past: Incident[] };
  timestamp: string;
}

const STATUS_META: Record<ServiceStatus, { label: string; color: string; bg: string; line: string }> = {
  operational: { label: "Running normally", color: "var(--sx-ok)", bg: "var(--sx-ok-bg)", line: "rgba(70, 192, 138, 0.28)" },
  degraded: { label: "Slower than usual", color: "var(--sx-warn)", bg: "var(--sx-warn-bg)", line: "rgba(224, 168, 74, 0.28)" },
  partial_outage: { label: "Partly down", color: "var(--sx-warn)", bg: "var(--sx-warn-bg)", line: "rgba(224, 168, 74, 0.28)" },
  major_outage: { label: "Widespread outage", color: "var(--sx-danger)", bg: "var(--sx-danger-bg)", line: "rgba(229, 96, 79, 0.28)" },
  maintenance: { label: "Under maintenance", color: "var(--sx-accent)", bg: "var(--sx-accent-bg)", line: "var(--sx-accent-line)" },
};

const UNKNOWN_META = { label: "", color: "var(--sx-text-3)", bg: "var(--sx-surface)", line: "var(--sx-line)" };

function metaFor(status: string) {
  return STATUS_META[status as ServiceStatus] ?? { ...UNKNOWN_META, label: status };
}

function Dot({ color, bg, size = 8, live }: { color: string; bg?: string; size?: number; live?: boolean }) {
  return (
    <span
      className={live ? "sx-dot sx-dot-live" : "sx-dot"}
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: live ? undefined : bg ? `0 0 0 3px ${bg}` : undefined,
      }}
    />
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ background: "var(--sx-bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <div className="relative" style={{ flex: 1 }}>
        <div aria-hidden="true" className="absolute inset-x-0 top-0 sx-grid" style={{ height: 560, opacity: 0.6 }} />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 sx-stars" style={{ height: 560 }} />
        <div
          className="sx-container relative"
          style={{ maxWidth: "calc(1040px + var(--sx-gutter) * 2)", paddingTop: "clamp(128px, 15vw, 168px)", paddingBottom: "clamp(80px, 10vw, 128px)" }}
        >
          <header className="flex flex-col md:flex-row md:items-end md:justify-between" style={{ gap: 24, marginBottom: 40 }}>
            <div>
              <div className="sx-overline flex items-center" style={{ gap: 12 }}>
                <span className="sx-accent">Mission control</span>
                <span aria-hidden="true" style={{ width: 28, height: 1, background: "var(--sx-line-strong)" }} />
                <span>System status</span>
              </div>
              <h1 className="sx-h2" style={{ marginTop: 22 }}>
                Platform health
              </h1>
              <p className="sx-lede" style={{ marginTop: 16 }}>
                Live status for every part of the Sectoral platform.
              </p>
            </div>
            <div className="sx-overline flex items-center" style={{ gap: 10, whiteSpace: "nowrap", paddingBottom: 6 }}>
              <span className="sx-dot sx-dot-accent" />
              <span>Auto refresh</span>
              <span aria-hidden="true" style={{ color: "var(--sx-text-5)" }}>/</span>
              <span className="sx-num" style={{ color: "var(--sx-text-2)" }}>30s</span>
            </div>
          </header>
          {children}
        </div>
      </div>
      <Footer />
    </main>
  );
}

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "var(--sx-panel)",
        border: "1px solid var(--sx-line)",
        borderRadius: "var(--sx-r-xl)",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function BlockTitle({ index, children, aside }: { index: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between" style={{ margin: "56px 0 16px", gap: 16 }}>
      <h2 className="sx-overline flex items-center" style={{ gap: 12, color: "var(--sx-text-2)" }}>
        <span className="sx-accent">{index}</span>
        <span>{children}</span>
      </h2>
      {aside}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="sx-hud" style={{ position: "relative", background: "var(--sx-surface)", border: "1px solid var(--sx-line)", borderRadius: "var(--sx-r-sm)", padding: "20px 22px" }}>
      <div className="sx-overline">{label}</div>
      <div className="sx-telemetry-value" style={{ marginTop: 16 }}>
        {value}
      </div>
      {sub && <div className="sx-caption" style={{ marginTop: 10 }}>{sub}</div>}
    </div>
  );
}

export default function StatusPage() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("https://api.sectoral.xyz/v1/status", { cache: "no-store" });
        if (!res.ok) throw new Error(`Status request returned ${res.status}`);
        const json = (await res.json()) as StatusResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError("The status service isn't responding right now. Reload the page to retry.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (loading && !data) {
    return (
      <Shell>
        <Panel style={{ padding: "28px 28px" }}>
          <div className="flex items-center" style={{ gap: 14 }}>
            <span className="sx-dot sx-dot-accent" />
            <p className="sx-overline" style={{ color: "var(--sx-text-2)" }} role="status">Running health checks…</p>
          </div>
          <div className="sx-skeleton" style={{ height: 28, width: "min(420px, 80%)", marginTop: 22 }} />
        </Panel>
        <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 12, marginTop: 12 }}>
          {[0, 1, 2, 3].map((k) => (
            <div key={k} className="sx-skeleton" style={{ height: 108, borderRadius: "var(--sx-r-lg)" }} />
          ))}
        </div>
      </Shell>
    );
  }

  if (error || !data) {
    return (
      <Shell>
        <div className="sx-alert sx-alert-danger" role="alert" style={{ padding: "18px 20px", fontSize: 14 }}>
          <span className="sx-dot" style={{ background: "var(--sx-danger)", marginTop: 7 }} />
          <span>{error ?? "Status data is unavailable at the moment."}</span>
        </div>
      </Shell>
    );
  }

  const overall = metaFor(data.overall);
  const allOperational = data.overall === "operational";
  const operationalCount = data.services.filter((s) => s.status === "operational").length;

  return (
    <Shell>
      {/* Overall banner */}
      <section
        aria-label="Overall status"
        className="relative overflow-hidden"
        style={{
          border: `1px solid ${overall.line}`,
          background: `linear-gradient(120deg, ${overall.bg}, transparent 70%), var(--sx-panel)`,
          borderRadius: "var(--sx-r-2xl)",
          padding: "clamp(24px, 4vw, 40px)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center" style={{ gap: 20 }}>
          <span
            className="flex items-center justify-center"
            style={{ width: 52, height: 52, borderRadius: "50%", border: `1px solid ${overall.line}`, background: overall.bg, flexShrink: 0 }}
          >
            <Dot color={overall.color} size={12} live={allOperational} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sx-overline" style={{ color: overall.color }}>
              Overall status
            </div>
            <div
              style={{
                marginTop: 10,
                fontFamily: "var(--sx-display)",
                fontWeight: 500,
                fontSize: "clamp(26px, 3.4vw, 40px)",
                lineHeight: 1.05,
                textTransform: "uppercase",
                color: "var(--sx-text)",
              }}
            >
              {allOperational ? "Every system is up" : overall.label}
            </div>
          </div>
          <div className="sx-caption sx-num" style={{ whiteSpace: "nowrap" }}>
            Refreshed {formatTime(data.timestamp)}
          </div>
        </div>
      </section>

      {/* Telemetry */}
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 12, marginTop: 12 }}>
        <StatCard label="Availability" value={<span className="sx-num">{data.uptime}%</span>} sub={data.uptimePeriod} />
        <StatCard label={data.avgResponseTimeLabel} value={<span className="sx-num">{data.avgResponseTime}ms</span>} sub="Mean time to respond" />
        <StatCard
          label="Components"
          value={
            <span className="sx-num">
              {operationalCount}
              <span style={{ color: "var(--sx-text-4)" }}>/{data.services.length}</span>
            </span>
          }
          sub="Running normally"
        />
        <StatCard label="Open incidents" value={<span className="sx-num">{data.incidents.current.length}</span>} sub="In progress now" />
      </div>

      {/* Services */}
      <BlockTitle index="01" aside={<span className="sx-caption sx-num">{data.services.length} monitored</span>}>
        Components
      </BlockTitle>
      <Panel>
        {data.services.map((service) => {
          const meta = metaFor(service.status);
          return (
            <div key={service.name} className="sx-row flex-wrap sm:flex-nowrap" style={{ padding: "16px 22px", rowGap: 8 }}>
              <Dot color={meta.color} bg={meta.bg} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="sx-title" style={{ fontSize: 14.5 }}>{service.name}</div>
                {service.description && (
                  <div className="sx-caption" style={{ marginTop: 2 }}>{service.description}</div>
                )}
              </div>
              <div className="flex items-center w-full sm:w-auto pl-5 sm:pl-0" style={{ gap: 18 }}>
                <span className="sx-num sx-small" style={{ whiteSpace: "nowrap" }}>
                  {service.responseTime}ms
                </span>
                <span className="sx-num sx-small" style={{ whiteSpace: "nowrap" }}>
                  {service.uptime}%
                </span>
                <span
                  className="sx-overline sm:ml-0 ml-auto"
                  style={{ color: meta.color, whiteSpace: "nowrap", letterSpacing: "0.14em", minWidth: 0, textAlign: "right" }}
                >
                  {meta.label}
                </span>
              </div>
            </div>
          );
        })}
      </Panel>

      {/* Incidents */}
      <BlockTitle index="02">Past and current incidents</BlockTitle>

      {data.incidents.current.length === 0 && data.incidents.past.length === 0 ? (
        <Panel>
          <div className="sx-empty" style={{ padding: "40px 24px" }}>
            <Dot color="var(--sx-ok)" bg="var(--sx-ok-bg)" />
            <span>Nothing to report. No incidents on record.</span>
          </div>
        </Panel>
      ) : (
        <div className="flex flex-col" style={{ gap: 10 }}>
          {data.incidents.current.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} ongoing />
          ))}
          {data.incidents.past.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} />
          ))}
        </div>
      )}
    </Shell>
  );
}

function IncidentCard({ incident, ongoing }: { incident: Incident; ongoing?: boolean }) {
  const [open, setOpen] = useState(Boolean(ongoing));

  return (
    <Panel style={ongoing ? { borderColor: "rgba(229, 96, 79, 0.28)" } : undefined}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="hover:bg-[var(--sx-surface)] transition-colors"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          padding: "18px 22px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          color: "inherit",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center flex-wrap" style={{ gap: 10, marginBottom: 10 }}>
            <span className={ongoing ? "sx-tag sx-tag-danger" : "sx-tag"}>{ongoing ? "In progress" : incident.status}</span>
            <span className="sx-caption sx-num">
              {formatTime(incident.startTime)}
              {incident.duration ? ` · ${incident.duration}` : ""}
            </span>
          </div>
          <div className="sx-title" style={{ fontSize: 15 }}>{incident.title}</div>
          {incident.affectedServices.length > 0 && (
            <div className="sx-caption" style={{ marginTop: 4 }}>
              Impacted: {incident.affectedServices.join(", ")}
            </div>
          )}
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden="true"
          style={{ marginTop: 6, flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.25s var(--sx-ease)" }}
        >
          <path d="M2 4l3 3 3-3" stroke="var(--sx-text-3)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div style={{ padding: "0 22px 22px", borderTop: "1px solid var(--sx-line)" }}>
          <p className="sx-small" style={{ margin: "16px 0 20px", maxWidth: 680 }}>
            {incident.description}
          </p>
          <ol className="flex flex-col" style={{ gap: 16, listStyle: "none", padding: 0, margin: 0 }}>
            {incident.updates.map((update, i) => {
              const uMeta = metaFor(update.status);
              const known = update.status in STATUS_META;
              return (
                <li key={i} className="flex" style={{ gap: 12 }}>
                  <div className="flex flex-col items-center" style={{ paddingTop: 5 }}>
                    <Dot color={known ? uMeta.color : "var(--sx-accent)"} size={7} />
                    {i < incident.updates.length - 1 && (
                      <span style={{ flex: 1, width: 1, background: "var(--sx-line-strong)", marginTop: 6, minHeight: 16 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 2 }}>
                    <div className="flex items-center flex-wrap" style={{ gap: 10, marginBottom: 4 }}>
                      <span className="sx-overline" style={{ color: "var(--sx-text)" }}>
                        {update.status}
                      </span>
                      <span className="sx-caption sx-num">{formatTime(update.timestamp)}</span>
                    </div>
                    <p className="sx-small" style={{ margin: 0 }}>
                      {update.message}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </Panel>
  );
}
