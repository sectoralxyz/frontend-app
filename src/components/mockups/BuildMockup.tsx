import { MockWindow, MockLabel, Check, hair } from "./MockKit";

/* Agents: a live x402 payment trace from an agent account, from the 402
   challenge through the policy check to the paid retry. */
export function BuildMockup() {
  type TraceLine = {
    time: string;
    text: string;
    kind: "req" | "deny" | "policy" | "check" | "out" | "ok";
    chip?: string;
  };

  const trace: TraceLine[] = [
    {
      time: "14:32:01.204",
      text: "GET api.marketfeed.io/v1/market-data",
      kind: "req",
    },
    {
      time: "14:32:01.219",
      text: "server replied",
      kind: "deny",
      chip: "402 Payment Required",
    },
    {
      time: "14:32:01.220",
      text: "x402 price · 0.25 USDG each request",
      kind: "out",
    },
    {
      time: "14:32:01.221",
      text: "CHECKING POLICY · spend policy v3",
      kind: "policy",
    },
    { time: "", text: "request ceiling · 0.25 <= 5.00", kind: "check" },
    { time: "", text: "api.marketfeed.io is on the allowlist", kind: "check" },
    { time: "", text: "spent today · 12.40 / 50.00", kind: "check" },
    {
      time: "14:32:01.240",
      text: "encrypted transfer sent · observers cannot see the amount",
      kind: "out",
    },
    { time: "14:32:01.341", text: "final · 100ms · 1 block", kind: "out" },
    {
      time: "14:32:01.355",
      text: "GET again, now with X-Payment header",
      kind: "req",
    },
    {
      time: "14:32:01.402",
      text: "server replied · 4.1 KB body",
      kind: "ok",
      chip: "200 OK",
    },
  ];

  const lineColor: Record<TraceLine["kind"], string> = {
    req: "var(--sx-text)",
    deny: "var(--sx-text-2)",
    policy: "var(--sx-accent)",
    check: "var(--sx-ok)",
    out: "var(--sx-text-3)",
    ok: "var(--sx-text)",
  };

  return (
    <MockWindow
      title="datafetch.sectoral"
      badge={
        <span className="hidden sm:block"><span className="sx-tag sx-tag-accent">
          Self-directed
        </span></span>
      }
      meta="runs without a person"
    >
      {/* Trace meta bar */}
      <div
        className="flex items-center flex-wrap flex-shrink-0"
        style={{ gap: 12, padding: "12px 20px", borderBottom: hair }}
      >
        <MockLabel style={{ color: "var(--sx-text-3)" }}>
          Live · x402 payment trace
        </MockLabel>
        <span
          className="ml-auto sx-mono"
          style={{ fontSize: 11, color: "var(--sx-text-4)" }}
        >
          session 0x4c19...ab27
        </span>
      </div>

      {/* Console */}
      <div
        className="flex-1 min-h-0 overflow-x-auto"
        style={{ padding: "16px 20px", background: "rgba(0,0,0,0.28)" }}
      >
        {trace.map((line, i) => (
          <div
            key={i}
            className="flex items-baseline"
            style={{ gap: 14, padding: "3.5px 0" }}
          >
            <span
              className="sx-mono flex-shrink-0 hidden sm:inline"
              style={{ width: 92, fontSize: 11, color: "var(--sx-text-5)" }}
            >
              {line.time}
            </span>
            <span
              className="sx-mono flex items-start"
              style={{
                fontSize: 12,
                lineHeight: "18px",
                gap: 8,
                color: lineColor[line.kind],
                paddingLeft: line.kind === "check" ? 14 : 0,
                letterSpacing: line.kind === "policy" ? "0.06em" : undefined,
              }}
            >
              {line.kind === "check" && (
                <span
                  className="flex-shrink-0"
                  style={{
                    display: "inline-flex",
                    height: 18,
                    alignItems: "center",
                  }}
                >
                  <Check size={11} />
                </span>
              )}
              <span
                className="inline-flex items-center flex-wrap"
                style={{ gap: 8 }}
              >
                {line.text}
                {line.chip && (
                  <span
                    className={`sx-tag ${line.kind === "ok" ? "sx-tag-ok" : "sx-tag-warn"}`}
                    style={{ height: 19, fontSize: 9.5 }}
                  >
                    {line.chip}
                  </span>
                )}
              </span>
            </span>
          </div>
        ))}
        <div
          className="flex items-baseline"
          style={{ gap: 14, padding: "3.5px 0" }}
        >
          <span
            className="flex-shrink-0 hidden sm:inline"
            style={{ width: 92 }}
          />
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: 7,
              height: 14,
              background: "var(--sx-accent)",
              opacity: 0.8,
            }}
          />
        </div>
      </div>

      {/* Footer summary */}
      <div
        className="flex items-center flex-wrap flex-shrink-0"
        style={{ gap: "10px 24px", padding: "14px 20px", borderTop: hair }}
      >
        <div className="flex items-baseline" style={{ gap: 10 }}>
          <MockLabel>Spent</MockLabel>
          <span
            className="sx-num"
            style={{ fontSize: 15, color: "var(--sx-text)" }}
          >
            0.25 USDG
          </span>
        </div>
        <div className="flex items-baseline" style={{ gap: 10 }}>
          <MockLabel>Remaining budget</MockLabel>
          <span
            className="sx-num"
            style={{ fontSize: 15, color: "var(--sx-text)" }}
          >
            $37.35
          </span>
        </div>
        <span className="sx-caption lg:ml-auto" style={{ maxWidth: 300 }}>
          The chain enforces the policy, and each request covers its own cost.
        </span>
      </div>
    </MockWindow>
  );
}
