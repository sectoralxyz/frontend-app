import { MockWindow, MockLabel, MockCard, Check, Masked, hair } from "./MockKit";

/* Protocol: one payment split by the MPP router across three single-use
   stealth addresses, then settled atomically. */

/** Fan of connectors between a single node and three stacked nodes. The
    route column is a three-row grid, so the stacked centers sit at 1/6, 1/2
    and 5/6 of the height. */
function Fan({ direction }: { direction: "out" | "in" }) {
  const ys = [16.67, 50, 83.33];
  return (
    <svg className="hidden md:block w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {ys.map((y) => (
        <path
          key={y}
          d={direction === "out" ? `M 0 50 C 55 50, 45 ${y}, 100 ${y}` : `M 0 ${y} C 55 ${y}, 45 50, 100 50`}
          fill="none"
          stroke="var(--sx-accent-muted)"
          strokeWidth="1"
          strokeDasharray="3 4"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

/** Short vertical connector for the stacked mobile layout. */
function Drop() {
  return (
    <div aria-hidden="true" className="md:hidden flex justify-center" style={{ height: 22 }}>
      <span style={{ width: 0, borderLeft: "1px dashed var(--sx-accent-muted)" }} />
    </div>
  );
}

export function DiffsMockup() {
  const routes = [
    { addr: "0x7f3a...c19b", n: "01" },
    { addr: "0x2e8d...41f6", n: "02" },
    { addr: "0x9c04...b7e2", n: "03" },
  ];

  return (
    <MockWindow title="Router (MPP)" meta="privacy across many paths">
      <div
        className="flex-1 min-h-0 flex flex-col md:grid md:items-stretch"
        style={{ gridTemplateColumns: "minmax(0,27fr) minmax(0,9fr) minmax(0,26fr) minmax(0,9fr) minmax(0,27fr)", padding: "28px 20px" }}
      >
        {/* Sender */}
        <div className="flex flex-col justify-center">
          <MockCard>
            <MockLabel>Sender</MockLabel>
            <div className="truncate" style={{ marginTop: 8, fontSize: 13.5, fontWeight: 600, color: "var(--sx-text)" }}>
              alice.sectoral
            </div>
            <div className="sx-num" style={{ marginTop: 14, fontSize: 30, lineHeight: 1, color: "var(--sx-text)" }}>
              $4.00
            </div>
            <div className="sx-caption" style={{ marginTop: 10 }}>only you can see this</div>
            <div className="sx-caption" style={{ marginTop: 4, color: "var(--sx-text-4)" }}>
              everyone else sees{" "}
              <span style={{ display: "inline-block", verticalAlign: "middle", marginLeft: 4 }}>
                <Masked size={4} />
              </span>
            </div>
          </MockCard>
        </div>

        <Fan direction="out" />
        <Drop />

        {/* Stealth routes */}
        <div className="grid grid-rows-3">
          {routes.map((r) => (
            <div key={r.addr} className="flex items-center" style={{ padding: "5px 0" }}>
              <div
                className="w-full"
                style={{ padding: "10px 12px", background: "var(--sx-surface)", border: hair, borderRadius: "var(--sx-r-md)" }}
              >
                <div className="flex items-center justify-between" style={{ gap: 8 }}>
                  <MockLabel style={{ fontSize: 9 }}>
                    <span className="sx-accent">{r.n}</span> Stealth addr
                  </MockLabel>
                  <span style={{ color: "var(--sx-text-3)" }}><Masked count={3} size={4} /></span>
                </div>
                <div className="sx-mono truncate" style={{ marginTop: 6, fontSize: 11, color: "var(--sx-text-2)" }}>{r.addr}</div>
                <div className="sx-caption" style={{ marginTop: 3, fontSize: 11, color: "var(--sx-text-4)" }}>
                  used once, then discarded
                </div>
              </div>
            </div>
          ))}
        </div>

        <Fan direction="in" />
        <Drop />

        {/* Recipient */}
        <div className="flex flex-col justify-center">
          <MockCard>
            <MockLabel>Recipient</MockLabel>
            <div className="truncate" style={{ marginTop: 8, fontSize: 13.5, fontWeight: 600, color: "var(--sx-text)" }}>
              vendor.sectoral
            </div>
            <div style={{ marginTop: 14 }}>
              <span className="sx-tag sx-tag-ok">
                <Check /> Complete
              </span>
            </div>
            <div className="sx-caption" style={{ marginTop: 10 }}>whole amount in a single balance</div>
            <div className="sx-caption" style={{ marginTop: 4, color: "var(--sx-text-4)" }}>no link between routes</div>
          </MockCard>
        </div>
      </div>

      {/* Atomic settlement bar */}
      <div className="flex-shrink-0" style={{ padding: "0 20px 20px" }}>
        <div
          className="flex items-center flex-wrap"
          style={{
            gap: "8px 14px",
            padding: "12px 14px",
            background: "var(--sx-surface)",
            border: hair,
            borderLeft: "2px solid var(--sx-accent)",
            borderRadius: "var(--sx-r-md)",
          }}
        >
          <MockLabel style={{ color: "var(--sx-text-2)" }}>Settles atomically</MockLabel>
          <span className="sx-mono truncate min-w-0" style={{ fontSize: 11, color: "var(--sx-text-3)", maxWidth: 220 }}>
            0x9e2d6b0a4f81c53e7a9d2f60...
          </span>
          <MockLabel style={{ marginLeft: "auto", fontSize: 9.5 }}>unlinkable · 1 block · 3 routes</MockLabel>
        </div>
      </div>
    </MockWindow>
  );
}
