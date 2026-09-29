import { MockWindow, MockLabel, MockPaneHead, MockRow, MockCard, Check, hair } from "./MockKit";

/* Privacy: one transfer, as the chain records it and as its holder reads it. */

function Redacted({ width }: { width: number }) {
  return (
    <span
      aria-label="Encrypted"
      role="img"
      style={{
        display: "inline-block",
        width,
        height: 10,
        borderRadius: 2,
        background:
          "repeating-linear-gradient(90deg, rgba(242,245,248,0.22) 0 3px, rgba(242,245,248,0.1) 3px 6px)",
      }}
    />
  );
}

export function PlanMockup() {
  const chainRows: { label: string; value: string | null; width?: number; tag: string | null }[] = [
    { label: "Sender", value: "0x7fA2...e91c", tag: "stealth" },
    { label: "Recipient", value: "0x3bD8...a04f", tag: "stealth" },
    { label: "Amount", value: null, width: 84, tag: null },
    { label: "Memo", value: null, width: 132, tag: null },
  ];

  const holderRows = [
    { label: "From", value: "alice.sectoral" },
    { label: "To", value: "vendor.sectoral" },
    { label: "Fee", value: "$0.02" },
    { label: "Memo", value: "Invoice #2210" },
    { label: "Sent at", value: "Apr 26 · 14:32:08" },
    { label: "Settled at", value: "Apr 26 · 14:32:09" },
  ];

  return (
    <MockWindow title="Transfer" meta={<span className="sx-mono" style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "none" }}>txn_7a2bk1</span>}>
      {/* Transfer summary */}
      <div className="flex items-center flex-wrap flex-shrink-0" style={{ gap: 10, padding: "14px 20px", borderBottom: hair }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--sx-text)" }}>alice.sectoral</span>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ color: "var(--sx-text-4)" }}>
          <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--sx-text)" }}>vendor.sectoral</span>
        <span className="sx-tag sx-tag-ok ml-auto">
          <Check /> Complete
        </span>
      </div>

      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        {/* What the chain sees */}
        <div className="flex-1 min-w-0 flex flex-col border-b md:border-b-0 md:border-r border-sx-line">
          <MockPaneHead>Visible on-chain</MockPaneHead>
          <div className="flex-1 flex flex-col" style={{ padding: 20, gap: 16 }}>
            {chainRows.map((row) => (
              <div key={row.label}>
                <MockLabel>{row.label}</MockLabel>
                <div className="flex items-center" style={{ gap: 8, marginTop: 8, minHeight: 18 }}>
                  {row.value ? (
                    <span className="sx-mono" style={{ color: "var(--sx-text-2)" }}>{row.value}</span>
                  ) : (
                    <Redacted width={row.width ?? 80} />
                  )}
                  {row.tag && <span className="sx-tag" style={{ height: 18, fontSize: 9.5 }}>{row.tag}</span>}
                </div>
              </div>
            ))}

            <div>
              <MockLabel>ElGamal ciphertext</MockLabel>
              <div
                className="sx-mono"
                style={{
                  marginTop: 8,
                  padding: "10px 12px",
                  fontSize: 11,
                  lineHeight: 1.75,
                  color: "var(--sx-text-4)",
                  background: "rgba(0,0,0,0.25)",
                  border: hair,
                  borderRadius: "var(--sx-r-md)",
                  wordBreak: "break-all",
                }}
              >
                0x8f3a2c1d 9e4b7f6a 0c5d8e2f
                <br />
                0x1a4b7c9d 3e6f2a1b 8c5d0e4f
                <br />
                0x6b2e9f1a 7c43d8e5 b0f4a29c
              </div>
            </div>

            <div className="flex items-center justify-between mt-auto" style={{ paddingTop: 14, borderTop: hair }}>
              <MockLabel>Range proof (ZK)</MockLabel>
              <span className="sx-tag sx-tag-ok">
                <Check /> Valid
              </span>
            </div>
          </div>
        </div>

        {/* What the holder sees */}
        <div className="flex-1 min-w-0 flex flex-col" style={{ background: "var(--sx-accent-surface)" }}>
          <MockPaneHead
            right={
              <span className="sx-tag sx-tag-accent">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="8" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
                  <path d="M12.5 12H21M18 12v3.5M15 12v2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Via view key
              </span>
            }
          >
            Visible to you
          </MockPaneHead>
          <div className="flex-1 flex flex-col" style={{ padding: 20, gap: 4 }}>
            <MockCard style={{ marginBottom: 8 }}>
              <MockLabel>Amount</MockLabel>
              <div className="flex items-baseline" style={{ gap: 8, marginTop: 10 }}>
                <span className="sx-num" style={{ fontSize: 34, lineHeight: 1, fontWeight: 400, color: "var(--sx-text)" }}>
                  $1,240.50
                </span>
                <span className="sx-overline" style={{ fontSize: 10 }}>USDG</span>
              </div>
            </MockCard>

            <div>
              {holderRows.map((row, i) => (
                <MockRow key={row.label} label={row.label} value={row.value} last={i === holderRows.length - 1} />
              ))}
            </div>

            <p className="sx-caption mt-auto" style={{ paddingTop: 14, borderTop: hair, lineHeight: 1.6 }}>
              Your client does the decrypting, so the plaintext never reaches the chain.
            </p>
          </div>
        </div>
      </div>
    </MockWindow>
  );
}
