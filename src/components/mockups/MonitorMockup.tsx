import { MockWindow, MockLabel, MockPaneHead, MockRow, MockCard, Check, hair } from "./MockKit";

/* Transparency: granting an auditor a scoped view key, next to the checks
   that hold without decrypting anything. */
export function MonitorMockup() {
  const grantRows = [
    { label: "Auditor", value: "auditor.sectoral" },
    { label: "Covers", value: "Transfers in Q1 2026" },
    { label: "Permission", value: "View only" },
    { label: "Ends", value: "Apr 30 2026" },
  ];

  const checks = [
    { text: "Proof of existence recorded on-chain", detail: "all 142 of 142 transfers anchored" },
    { text: "Every ZK range proof checks out", detail: "checked with nothing decrypted" },
    { text: "Only the auditor sees decrypted amounts", detail: "client side, with a scoped view key" },
    { text: "Nothing made public", detail: "no change to chain state" },
  ];

  return (
    <MockWindow title="Disclosures" meta="scope: 142 transfers">
      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        {/* View key grant */}
        <div className="flex flex-col md:w-[46%] border-b md:border-b-0 md:border-r border-sx-line" style={{ padding: 20, gap: 16 }}>
          <MockCard style={{ paddingBottom: 18 }}>
            <div className="flex items-center justify-between flex-wrap" style={{ gap: 8 }}>
              <MockLabel style={{ color: "var(--sx-text-3)", whiteSpace: "nowrap" }}>Granting a view key</MockLabel>
              <span className="sx-tag" style={{ height: 20, fontSize: 9.5 }}>Can be revoked</span>
            </div>

            <div style={{ marginTop: 6 }}>
              {grantRows.map((row, i) => (
                <MockRow key={row.label} label={row.label} value={row.value} last={i === grantRows.length - 1} />
              ))}
            </div>

            <div className="sx-btn sx-btn-primary sx-btn-sm sx-btn-block" style={{ marginTop: 14, height: 40, cursor: "default", boxShadow: "none" }}>
              Send view key
            </div>
            <p className="sx-caption" style={{ marginTop: 12, textAlign: "center", lineHeight: 1.55 }}>
              Lets the holder decrypt only the transfers in scope. You can pull access at any time.
            </p>
          </MockCard>

          <p className="sx-caption mt-auto" style={{ lineHeight: 1.6 }}>
            Your auditor sees precisely what you share. To everyone else it stays ciphertext.
          </p>
        </div>

        {/* Verification checklist */}
        <div className="flex-1 min-w-0 flex flex-col">
          <MockPaneHead right={<span className="sx-num" style={{ fontSize: 12, color: "var(--sx-ok)" }}>4 / 4</span>}>
            Checks
          </MockPaneHead>

          <div className="flex-1">
            {checks.map((c) => (
              <div key={c.text} className="flex items-start" style={{ gap: 12, padding: "16px 20px", borderBottom: hair }}>
                <span
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    color: "var(--sx-ok)",
                    background: "var(--sx-ok-bg)",
                    border: "1px solid rgba(70,192,138,0.28)",
                  }}
                >
                  <Check size={11} />
                </span>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 13.5, color: "var(--sx-text)", lineHeight: 1.4 }}>{c.text}</div>
                  <div className="sx-caption" style={{ marginTop: 3 }}>{c.detail}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Export row */}
          <div className="flex-shrink-0" style={{ padding: 20 }}>
            <div
              className="flex items-center"
              style={{ gap: 10, padding: "11px 14px", background: "var(--sx-surface)", border: hair, borderRadius: "var(--sx-r-md)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: "var(--sx-text-3)" }}>
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" stroke="currentColor" strokeWidth="1.6" />
                <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              <span className="truncate min-w-0" style={{ fontSize: 13, color: "var(--sx-text)" }}>audit-export-q1.csv</span>
              <span className="sx-num flex-shrink-0" style={{ fontSize: 12, color: "var(--sx-text-4)" }}>38 KB</span>
              <span className="sx-tag sx-tag-ok ml-auto flex-shrink-0">
                <Check /> Signature ok
              </span>
            </div>
          </div>
        </div>
      </div>
    </MockWindow>
  );
}
