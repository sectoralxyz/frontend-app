"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Account, PrivacyLayer, Transaction } from "@/lib/supabase/database.types";

type RangeOption = "7d" | "30d" | "90d";

const RANGE_DAYS: Record<RangeOption, number> = { "7d": 7, "30d": 30, "90d": 90 };

const LAYER_ORDER: PrivacyLayer[] = ["Confidential", "Shielded", "Public"];
/* Series colors: the accent at three intensities, falling to grey. */
const LAYER_COLOR: Record<PrivacyLayer, string> = {
  Confidential: "var(--sx-accent)",
  Shielded: "var(--sx-accent-muted)",
  Public: "var(--sx-text-4)",
};
const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// JS Date#getDay(): 0 = Sun ... 6 = Sat. Remap so Monday is index 0.
function mondayFirstDow(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function pctDelta(current: number, prior: number): number | null {
  if (prior === 0) return null;
  return ((current - prior) / prior) * 100;
}

function DeltaLabel({ value, suffix = "%" }: { value: number | null; suffix?: string }) {
  if (value === null) return null;
  const positive = value >= 0;
  return (
    <div className="sx-caption sx-num flex flex-wrap items-center" style={{ columnGap: 6 }}>
      <span style={{ color: positive ? "var(--sx-ok)" : "var(--sx-danger)" }}>
        {positive ? "+" : ""}
        {value.toFixed(1)}
        {suffix}
      </span>
      <span>against the prior period</span>
    </div>
  );
}

/** Accent at an intensity between 0.22 and 0.72, for bars scaled by value.
    Full strength is kept for the current day. */
function accentAt(ratio: number): string {
  const a = 0.22 + 0.5 * Math.max(0, Math.min(1, ratio));
  return `rgba(79, 140, 255, ${a.toFixed(2)})`;
}

/** Axis and legend label: the overline face at chart scale, tabular. */
const axisLabel: CSSProperties = {
  fontFamily: "var(--sx-display)",
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--sx-text-4)",
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap",
  lineHeight: 1,
};

/** Solid panel with an indexed overline title and an optional readout on the right. */
function ChartCard({ index, title, aside, children }: { index: string; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="sx-card-solid" style={{ padding: "clamp(18px, 2.4vw, 24px)", minWidth: 0 }}>
      <div className="flex flex-wrap items-center justify-between" style={{ gap: 12, marginBottom: 24 }}>
        <h2 className="sx-overline flex items-center" style={{ gap: 10, margin: 0 }}>
          <span className="sx-accent">{index}</span>
          <span aria-hidden="true" style={{ width: 16, height: 1, background: "var(--sx-line-strong)" }} />
          <span>{title}</span>
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function ChartSkeleton({ height }: { height: number }) {
  return <div aria-hidden="true" className="sx-skeleton" style={{ height, width: "100%", borderRadius: "var(--sx-r-md)" }} />;
}

function ChartEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="sx-empty" style={{ padding: "36px 16px", border: "1px dashed var(--sx-line)", borderRadius: "var(--sx-r-lg)" }}>
      <span className="sx-overline">No data</span>
      <span className="sx-small">{children}</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<RangeOption>("7d");
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prevTransactions, setPrevTransactions] = useState<Transaction[]>([]);
  const [authed, setAuthed] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAnalytics() {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) { setAuthed(false); setAccounts([]); setTransactions([]); setPrevTransactions([]); setLoading(false); }
        return;
      }

      const { data: accountsData } = await supabase
        .from("accounts")
        .select("*")
        .eq("owner_id", user.id);
      const userAccounts = (accountsData as Account[]) ?? [];

      if (userAccounts.length === 0) {
        if (!cancelled) { setAuthed(true); setAccounts([]); setTransactions([]); setPrevTransactions([]); setLoading(false); }
        return;
      }

      const days = RANGE_DAYS[range];
      const now = Date.now();
      const cutoffIso = new Date(now - days * 86400000).toISOString();
      const prevCutoffIso = new Date(now - 2 * days * 86400000).toISOString();
      const idList = userAccounts.map((a) => a.id).join(",");
      const orFilter = `from_account_id.in.(${idList}),to_account_id.in.(${idList})`;

      const [{ data: currentData }, { data: prevData }] = await Promise.all([
        supabase.from("transactions").select("*").or(orFilter).gte("created_at", cutoffIso).order("created_at", { ascending: true }),
        supabase.from("transactions").select("*").or(orFilter).gte("created_at", prevCutoffIso).lt("created_at", cutoffIso),
      ]);

      if (cancelled) return;
      setAuthed(true);
      setAccounts(userAccounts);
      setTransactions((currentData as Transaction[]) ?? []);
      setPrevTransactions((prevData as Transaction[]) ?? []);
      setLoading(false);
    }

    fetchAnalytics();
    return () => { cancelled = true; };
  }, [range]);

  // ---- KPIs ----
  const totalTransfers = transactions.length;
  const totalVolume = transactions.reduce((s, t) => s + Number(t.amount), 0);
  const avgAmount = totalTransfers > 0 ? totalVolume / totalTransfers : 0;
  const settledCount = transactions.filter((t) => t.status === "settled").length;
  const settledRate = totalTransfers > 0 ? (settledCount / totalTransfers) * 100 : null;

  const prevTotalTransfers = prevTransactions.length;
  const prevTotalVolume = prevTransactions.reduce((s, t) => s + Number(t.amount), 0);
  const prevAvgAmount = prevTotalTransfers > 0 ? prevTotalVolume / prevTotalTransfers : 0;
  const prevSettledCount = prevTransactions.filter((t) => t.status === "settled").length;
  const prevSettledRate = prevTotalTransfers > 0 ? (prevSettledCount / prevTotalTransfers) * 100 : null;

  const transfersDelta = pctDelta(totalTransfers, prevTotalTransfers);
  const volumeDelta = pctDelta(totalVolume, prevTotalVolume);
  const avgDelta = pctDelta(avgAmount, prevAvgAmount);
  const settledDelta = settledRate !== null && prevSettledRate !== null ? settledRate - prevSettledRate : null;

  const kpis: { label: string; value: string; delta: number | null; suffix?: string }[] = [
    { label: "Transfers made", value: totalTransfers.toLocaleString(), delta: transfersDelta },
    { label: "Value moved", value: `$${totalVolume.toFixed(2)}`, delta: volumeDelta },
    { label: "Average transfer", value: totalTransfers > 0 ? `$${avgAmount.toFixed(2)}` : "n/a", delta: avgDelta },
    { label: "Share settled", value: settledRate !== null ? `${settledRate.toFixed(1)}%` : "n/a", delta: settledDelta, suffix: "pts" },
  ];

  // ---- Transfers per day ----
  const days = RANGE_DAYS[range];
  const dayBuckets: { key: string; label: string; count: number; volume: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = range === "7d"
      ? d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    dayBuckets.push({ key, label, count: 0, volume: 0 });
  }
  const dayBucketMap = new Map(dayBuckets.map((b) => [b.key, b]));
  transactions.forEach((t) => {
    const key = t.created_at.slice(0, 10);
    const bucket = dayBucketMap.get(key);
    if (bucket) { bucket.count += 1; bucket.volume += Number(t.amount); }
  });
  const maxDayCount = Math.max(1, ...dayBuckets.map((d) => d.count));
  // For 90d, thin the x-axis labels so they don't collide.
  const labelEvery = range === "90d" ? 10 : range === "30d" ? 5 : 1;

  // ---- Volume by account ----
  const accountTotals = new Map<string, { name: string; handle: string; type: Account["type"]; count: number; volume: number }>();
  accounts.forEach((a) => accountTotals.set(a.id, { name: a.name, handle: a.handle, type: a.type, count: 0, volume: 0 }));
  transactions.forEach((t) => {
    if (t.from_account_id && accountTotals.has(t.from_account_id)) {
      const e = accountTotals.get(t.from_account_id)!;
      e.count += 1;
      e.volume += Number(t.amount);
    }
    if (t.to_account_id && accountTotals.has(t.to_account_id)) {
      const e = accountTotals.get(t.to_account_id)!;
      e.count += 1;
      e.volume += Number(t.amount);
    }
  });
  const accountRows = Array.from(accountTotals.values())
    .filter((e) => e.count > 0)
    .sort((a, b) => b.volume - a.volume);
  const maxAccountVolume = Math.max(1, ...accountRows.map((a) => a.volume));

  // ---- Volume by privacy layer ----
  const layerTotals = new Map<PrivacyLayer, number>();
  transactions.forEach((t) => layerTotals.set(t.privacy_layer, (layerTotals.get(t.privacy_layer) ?? 0) + Number(t.amount)));
  const layerRows = LAYER_ORDER.map((layer) => ({
    category: layer,
    spend: layerTotals.get(layer) ?? 0,
    color: LAYER_COLOR[layer],
  }));

  // ---- Activity heatmap: [day-of-week Mon..Sun][hour 0..23] ----
  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  let maxCell = 0;
  transactions.forEach((t) => {
    const d = new Date(t.created_at);
    const dow = mondayFirstDow(d);
    const hour = d.getHours();
    heatmap[dow][hour] += 1;
    if (heatmap[dow][hour] > maxCell) maxCell = heatmap[dow][hour];
  });
  function cellAlpha(count: number): number {
    if (maxCell === 0 || count === 0) return 0.05;
    const ratio = count / maxCell;
    return ratio < 0.3 ? 0.2 : ratio < 0.6 ? 0.45 : ratio < 0.85 ? 0.7 : 0.95;
  }

  const hasData = totalTransfers > 0;

  function cellColor(count: number): string {
    return count === 0 ? "rgba(255, 255, 255, 0.045)" : `rgba(79, 140, 255, ${cellAlpha(count)})`;
  }

  const chartHeight = 168;
  const peakDay = dayBuckets.reduce((best, d) => (d.count > best.count ? d : best), dayBuckets[0]);

  return (
    <div className="sx-app-page">
      {/* Page header */}
      <header
        className="sx-rise flex flex-col sm:flex-row sm:items-end sm:justify-between"
        style={{ gap: 20, paddingBottom: 28, marginBottom: 28, borderBottom: "1px solid var(--sx-line)" }}
      >
        <div style={{ minWidth: 0 }}>
          <div className="sx-overline flex items-center" style={{ gap: 10 }}>
            <span className="sx-dot sx-dot-accent" />
            <span>Analytics</span>
          </div>
          <h1 className="sx-h2" style={{ marginTop: 16, fontSize: "clamp(28px, 3.2vw, 40px)" }}>
            Insights
          </h1>
          <p className="sx-body" style={{ marginTop: 10, maxWidth: 560 }}>
            How much you moved, and how it splits across privacy layers.
          </p>
        </div>
        <div className="sx-segmented shrink-0 self-start sm:self-auto" role="group" aria-label="Time range">
          {(["7d", "30d", "90d"] as const).map((r) => (
            <button key={r} type="button" onClick={() => setRange(r)} disabled={loading} aria-pressed={range === r} className="sx-num">
              {r}
            </button>
          ))}
        </div>
      </header>

      {!authed ? (
        <div className="sx-card-solid sx-empty">
          <span className="sx-overline">Signed out</span>
          <span>Your insights show up here after you sign in.</span>
        </div>
      ) : (
        <>
          {/* KPI telemetry */}
          <div className="sx-rise sx-d1 grid grid-cols-2 lg:grid-cols-4" style={{ gap: 12, marginBottom: 16 }}>
            {kpis.map((k, i) => (
              <div key={k.label} className="sx-card sx-hud" style={{ padding: "clamp(16px, 2vw, 22px)", minWidth: 0 }}>
                <div className="sx-telemetry" style={{ gap: 12 }}>
                  <span className="sx-overline flex items-center" style={{ gap: 8 }}>
                    <span className="sx-accent hidden sm:inline">0{i + 1}</span>
                    <span>{k.label}</span>
                  </span>
                  {loading ? (
                    <span aria-hidden="true" className="sx-skeleton" style={{ width: "60%", height: 34 }} />
                  ) : (
                    <span className="sx-telemetry-value" style={{ overflowWrap: "anywhere" }}>{k.value}</span>
                  )}
                  <div style={{ minHeight: 18 }}>{!loading && <DeltaLabel value={k.delta} suffix={k.suffix} />}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Daily transfer count */}
          <div className="sx-rise sx-d2" style={{ marginBottom: 16 }}>
            <ChartCard
              index="01"
              title="Daily transfer count"
              aside={
                !loading && hasData ? (
                  <span className="sx-caption flex items-center" style={{ gap: 8 }}>
                    <span className="sx-overline" style={{ fontSize: 10 }}>Peak</span>
                    <span className="sx-num" style={{ color: "var(--sx-text)" }}>{peakDay.count}</span>
                    <span style={{ ...axisLabel, letterSpacing: "0.1em" }}>{peakDay.label}</span>
                  </span>
                ) : null
              }
            >
              {loading ? (
                <ChartSkeleton height={chartHeight + 22} />
              ) : !hasData ? (
                <ChartEmpty>Too little activity in this window to chart.</ChartEmpty>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", columnGap: 12, rowGap: 10 }}>
                  {/* Y axis */}
                  <div aria-hidden="true" style={{ position: "relative", height: chartHeight, minWidth: 18 }}>
                    {[maxDayCount, Math.round(maxDayCount / 2), 0].map((v, i) => (
                      <span key={i} style={{ ...axisLabel, position: "absolute", right: 0, top: `${i * 50}%`, transform: "translateY(-50%)" }}>
                        {v}
                      </span>
                    ))}
                  </div>
                  {/* Plot */}
                  <div style={{ position: "relative", height: chartHeight }}>
                    {[0, 50, 100].map((p) => (
                      <div
                        key={p}
                        aria-hidden="true"
                        style={{
                          position: "absolute", left: 0, right: 0, top: `${p}%`, height: 0,
                          borderTop: p === 100 ? "1px solid var(--sx-line-strong)" : "1px dashed var(--sx-line)",
                        }}
                      />
                    ))}
                    <div style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: range === "90d" ? 2 : range === "30d" ? 4 : 10, height: "100%" }}>
                      {dayBuckets.map((d, i) => {
                        const isLast = i === dayBuckets.length - 1;
                        return (
                          <div
                            key={d.key}
                            title={`${d.label}: $${d.volume.toFixed(2)} across ${d.count} transfer${d.count !== 1 ? "s" : ""}`}
                            style={{ flex: 1, minWidth: 0, height: "100%", display: "flex", alignItems: "flex-end" }}
                          >
                            <div
                              style={{
                                width: "100%",
                                height: `${(d.count / maxDayCount) * 100}%`,
                                minHeight: 2,
                                background: d.count === 0 ? "var(--sx-line-strong)" : isLast ? "var(--sx-accent)" : accentAt(d.count / maxDayCount),
                                boxShadow: isLast && d.count > 0 ? "0 0 18px rgba(255, 236, 216, 0.35)" : undefined,
                                borderRadius: range === "7d" ? "4px 4px 1px 1px" : "2px 2px 0 0",
                                transition: "height 0.6s var(--sx-ease)",
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* X axis */}
                  <div aria-hidden="true" />
                  <div aria-hidden="true" style={{ display: "flex", gap: range === "90d" ? 2 : range === "30d" ? 4 : 10 }}>
                    {dayBuckets.map((d, i) => (
                      <div key={d.key} style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: range === "7d" ? "center" : "flex-start" }}>
                        <span style={axisLabel}>{i % labelEvery === 0 ? d.label : ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ChartCard>
          </div>

          <div className="sx-rise sx-d3 grid lg:grid-cols-2" style={{ gap: 16, marginBottom: 16 }}>
            {/* Volume by account */}
            <ChartCard index="02" title="Value moved per account">
              {loading ? (
                <ChartSkeleton height={120} />
              ) : accountRows.length === 0 ? (
                <ChartEmpty>Too little activity in this window to chart.</ChartEmpty>
              ) : (
                <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 18 }}>
                  {accountRows.map((a, i) => (
                    <li key={a.handle}>
                      <div className="flex items-baseline justify-between" style={{ gap: 12, marginBottom: 8 }}>
                        <span className="flex items-baseline" style={{ gap: 10, minWidth: 0 }}>
                          <span className="sx-num" style={{ ...axisLabel, color: "var(--sx-text-4)" }}>{String(i + 1).padStart(2, "0")}</span>
                          <span className="truncate" style={{ fontSize: 14, color: "var(--sx-text)" }}>
                            {a.name} <span style={{ color: "var(--sx-text-3)" }}>@{a.handle}</span>
                          </span>
                        </span>
                        <span className="sx-num" style={{ fontSize: 15, color: "var(--sx-text)", flexShrink: 0 }}>
                          ${a.volume.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center" style={{ gap: 12 }}>
                        <div className="sx-meter" style={{ flex: 1 }}>
                          <span style={{ width: `${(a.volume / maxAccountVolume) * 100}%`, background: accentAt(a.volume / maxAccountVolume) }} />
                        </div>
                        <span style={{ ...axisLabel, minWidth: 84, textAlign: "right" }}>
                          {a.count} transfer{a.count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </ChartCard>

            {/* Volume by privacy layer */}
            <ChartCard index="03" title="Value moved per privacy layer">
              {loading ? (
                <ChartSkeleton height={120} />
              ) : !hasData ? (
                <ChartEmpty>Too little activity in this window to chart.</ChartEmpty>
              ) : (
                <>
                  {/* Stacked share bar */}
                  <div
                    aria-hidden="true"
                    className="flex"
                    style={{ height: 10, borderRadius: 999, overflow: "hidden", gap: 2, background: "rgba(255, 255, 255, 0.04)" }}
                  >
                    {layerRows.filter((c) => c.spend > 0).map((c) => (
                      <div key={c.category} style={{ width: `${(c.spend / totalVolume) * 100}%`, background: c.color }} />
                    ))}
                  </div>
                  <ul style={{ listStyle: "none", margin: "20px 0 0", padding: 0 }}>
                    {layerRows.map((c) => (
                      <li
                        key={c.category}
                        className="flex items-center"
                        style={{ gap: 12, padding: "11px 0", borderBottom: "1px solid var(--sx-line)" }}
                      >
                        <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 14, color: "var(--sx-text)", flex: 1, minWidth: 0 }}>{c.category}</span>
                        <span style={{ ...axisLabel, minWidth: 48, textAlign: "right" }}>
                          {totalVolume > 0 ? `${((c.spend / totalVolume) * 100).toFixed(0)}%` : "0%"}
                        </span>
                        <span className="sx-num" style={{ fontSize: 14, color: "var(--sx-text-2)", minWidth: 84, textAlign: "right" }}>
                          ${c.spend.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-baseline justify-between" style={{ marginTop: 16 }}>
                    <span className="sx-overline">All layers</span>
                    <span className="sx-num" style={{ fontSize: 20, color: "var(--sx-text)" }}>${totalVolume.toFixed(2)}</span>
                  </div>
                </>
              )}
            </ChartCard>
          </div>

          {/* Hourly heatmap */}
          <div className="sx-rise sx-d4">
            <ChartCard index="04" title="When you transact">
              {loading ? (
                <ChartSkeleton height={150} />
              ) : !hasData ? (
                <ChartEmpty>A pattern will appear once this window has more activity.</ChartEmpty>
              ) : (
                <div style={{ maxWidth: 720 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "30px repeat(24, minmax(0, 1fr))", gap: 3, alignItems: "center" }}>
                    {heatmap.map((row, dowIdx) => (
                      <div key={DOW_LABELS[dowIdx]} style={{ display: "contents" }}>
                        <span style={axisLabel}>{DOW_LABELS[dowIdx]}</span>
                        {row.map((count, hourIdx) => (
                          <div
                            key={hourIdx}
                            title={`${count} transfer${count !== 1 ? "s" : ""} on ${DOW_LABELS[dowIdx]} at ${hourIdx}:00`}
                            style={{ aspectRatio: "1", borderRadius: 2, background: cellColor(count) }}
                          />
                        ))}
                      </div>
                    ))}
                    {/* Hour axis */}
                    <span aria-hidden="true" />
                    {Array.from({ length: 24 }, (_, h) => (
                      <span key={h} aria-hidden="true" style={{ ...axisLabel, marginTop: 6, overflow: "visible" }}>
                        {h % 6 === 0 ? String(h).padStart(2, "0") : ""}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center" style={{ gap: 4, marginTop: 16, paddingLeft: 33 }}>
                    <span style={{ ...axisLabel, marginRight: 6 }}>Fewer</span>
                    {[0, 0.2, 0.45, 0.7, 0.95].map((a) => (
                      <div
                        key={a}
                        style={{ width: 10, height: 10, borderRadius: 2, background: a === 0 ? "rgba(255, 255, 255, 0.045)" : `rgba(79, 140, 255, ${a})` }}
                      />
                    ))}
                    <span style={{ ...axisLabel, marginLeft: 6 }}>More</span>
                  </div>
                </div>
              )}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
