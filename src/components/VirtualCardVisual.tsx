import Image from "next/image";
import { useId } from "react";
import type { VirtualCard } from "@/lib/supabase/database.types";

export function formatExpiry(month: number, year: number): string {
  return `${String(month).padStart(2, "0")}/${String(year).slice(-2)}`;
}

/* ── Virtual card visual ──────────────────────────────────────────────────────
   A pure HTML/CSS recreation of the brand card (see /images/card.png for the
   reference art direction): black titanium with a fine horizontal brush, a
   specular sheen, the rocket mark top right and a metallic chip on the left.
   The card is an inline-size container, so every measurement is in cqw and
   the layout holds its proportions at any width. */

function BrushedChip() {
  const gradId = useId();
  return (
    <svg viewBox="0 0 34 26" aria-hidden="true" style={{ width: "11.5cqw", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EDE8DA" />
          <stop offset="0.35" stopColor="#C7BFAA" />
          <stop offset="0.6" stopColor="#A39A84" />
          <stop offset="1" stopColor="#E1DAC7" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="33" height="25" rx="4.5" fill={`url(#${gradId})`} stroke="rgba(0,0,0,0.5)" />
      <path
        d="M12 0.5v7a3.5 3.5 0 0 1-3.5 3.5H0.5M22 0.5v7a3.5 3.5 0 0 0 3.5 3.5h7.5M12 25.5v-6a3.5 3.5 0 0 0-3.5-3.5H0.5M22 25.5v-6a3.5 3.5 0 0 1 3.5-3.5h7.5M12 11.5h10M12 15.5h10"
        stroke="rgba(60,52,38,0.55)"
        strokeWidth="0.9"
        fill="none"
      />
    </svg>
  );
}

/* Small engraved label over a value, like the print on a metal card */
const engraved: React.CSSProperties = {
  fontFamily: "var(--sx-display)",
  fontWeight: 500,
  fontSize: "max(7.5px, 1.95cqw)",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "rgba(220,226,235,0.5)",
  lineHeight: 1,
};

const embossed: React.CSSProperties = {
  fontFamily: "var(--sx-display)",
  fontVariantNumeric: "tabular-nums",
  fontWeight: 500,
  fontSize: "max(11px, 3.3cqw)",
  letterSpacing: "0.08em",
  color: "#F2F5F8",
  textShadow: "0 1px 1px rgba(0,0,0,0.6)",
  lineHeight: 1,
  marginTop: "1.8cqw",
};

export function VirtualCardVisual({
  card,
  revealed,
}: {
  card: VirtualCard;
  revealed: boolean;
}) {
  const frozen = card.status === "frozen";

  return (
    <div
      style={{
        position: "relative",
        aspectRatio: "1.586",
        width: "100%",
        maxWidth: "460px",
        containerType: "inline-size",
        borderRadius: "var(--sx-r-xl)",
        border: "1px solid rgba(255,255,255,0.1)",
        overflow: "hidden",
        isolation: "isolate",
        // Black titanium: specular sheen, fine brush lines, a cool glow
        // behind the mark, over a graphite-to-black base.
        background: [
          "linear-gradient(112deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.025) 28%, rgba(255,255,255,0) 46%, rgba(255,255,255,0.035) 72%, rgba(255,255,255,0) 90%)",
          "repeating-linear-gradient(180deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, rgba(0,0,0,0.035) 2px, rgba(0,0,0,0) 3px)",
          "radial-gradient(circle at 88% 16%, rgba(255, 236, 216,0.12), rgba(255, 236, 216,0) 38%)",
          "linear-gradient(158deg, #1B1E24 0%, #111318 42%, #08090C 100%)",
        ].join(", "),
        boxShadow: [
          "inset 0 1px 0 rgba(255,255,255,0.14)",
          "inset 0 -1px 0 rgba(0,0,0,0.6)",
          "0 30px 60px -20px rgba(0,0,0,0.75)",
          "0 12px 24px -12px rgba(0,0,0,0.6)",
        ].join(", "),
        filter: frozen ? "grayscale(0.9) brightness(0.85)" : "none",
        transition: "filter 0.3s var(--sx-ease), transform 0.4s var(--sx-ease)",
      }}
    >
      {/* Film grain for a machined, non-digital surface */}
      <div aria-hidden="true" className="sx-noise" style={{ position: "absolute", inset: 0, opacity: 0.06, zIndex: -1 }} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          padding: "5.8cqw 6.2cqw 5.6cqw",
        }}
      >
        {/* Top row: Virtual · Debit left, rocket mark right (mirrors the brand card) */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "2.4cqw", height: "4.4cqw", marginTop: "0.4cqw" }}>
            <span style={{ ...engraved, fontSize: "max(8px, 2.3cqw)", color: "rgba(220,226,235,0.62)" }}>Virtual · Debit</span>
            {frozen && (
              <span className="sx-tag sx-tag-accent" style={{ height: "4.4cqw", minHeight: 16, padding: "0 1.6cqw", fontSize: "max(8px, 1.9cqw)" }}>
                Frozen
              </span>
            )}
          </div>
          <div style={{ position: "relative", width: "17cqw", aspectRatio: "1", margin: "-3cqw -3cqw 0 0" }}>
            <Image
              src="/images/logo.png"
              alt="Sectoral"
              fill
              sizes="80px"
              style={{ objectFit: "contain", filter: "drop-shadow(0 0 12px rgba(255, 236, 216,0.22))" }}
            />
          </div>
        </div>

        {/* Chip + contactless, centered in the free space between the header
            and the number so it can never collide with either */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "3cqw" }}>
          <BrushedChip />
          <svg viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ width: "4cqw", height: "auto" }}>
            <path d="M5 3.5C7.5 6.5 7.5 11.5 5 14.5M8.5 2C11.8 6 11.8 12 8.5 16M12 0.5c4 5 4 12 0 17" stroke="rgba(242,245,248,0.45)" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Number: always masked to the last four digits, groups justified
            across the full card width */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "var(--sx-display)",
            fontVariantNumeric: "tabular-nums",
            fontWeight: 400,
            fontSize: "max(15px, 5.6cqw)",
            letterSpacing: "0.12em",
            color: "#F2F5F8",
            textShadow: "0 1px 2px rgba(0,0,0,0.6)",
            lineHeight: 1,
          }}
        >
          {["••••", "••••", "••••", card.card_number.slice(-4)].map((group, i) => (
            <span key={i} style={i < 3 ? { color: "rgba(242,245,248,0.85)", letterSpacing: "0.2em" } : undefined}>
              {group}
            </span>
          ))}
        </div>

        {/* Bottom row: cardholder, expiry, cvv, network mark */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.5fr) auto auto auto",
            alignItems: "end",
            columnGap: "6cqw",
            marginTop: "6cqw",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={engraved}>Holder</div>
            <div style={{ ...embossed, letterSpacing: "0.1em", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {card.cardholder_name}
            </div>
          </div>
          <div>
            <div style={engraved}>Valid thru</div>
            <div style={embossed}>{formatExpiry(card.expiry_month, card.expiry_year)}</div>
          </div>
          <div>
            <div style={engraved}>CVV</div>
            <div style={{ ...embossed, color: revealed ? "#F2F5F8" : "rgba(242,245,248,0.8)" }}>{revealed ? card.cvv : "•••"}</div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
            {card.network === "mastercard" ? (
              <svg viewBox="0 0 38 24" role="img" aria-label="Mastercard" style={{ width: "9.5cqw", height: "auto", display: "block" }}>
                <circle cx="14" cy="12" r="9" fill="#EB001B" />
                <circle cx="24" cy="12" r="9" fill="#F79E1B" fillOpacity="0.9" />
                <path d="M19 4.6a9 9 0 0 1 0 14.8 9 9 0 0 1 0-14.8Z" fill="#F16522" />
              </svg>
            ) : (
              <span
                role="img"
                aria-label="Visa"
                style={{
                  fontFamily: "var(--sx-sans)",
                  fontStyle: "italic",
                  fontWeight: 800,
                  fontSize: "max(13px, 4.6cqw)",
                  letterSpacing: "0.02em",
                  color: "#F2F5F8",
                  lineHeight: 1,
                }}
              >
                VISA
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
