"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CardNetwork, VirtualCard } from "@/lib/supabase/database.types";
import { VirtualCardVisual } from "@/components/VirtualCardVisual";
import { Telemetry } from "@/components/sx";

/* ── Card number generation (Luhn-valid demo numbers, not issued) ─────────── */

function luhnCheckDigit(payload: number[]): number {
  const sum = payload
    .slice()
    .reverse()
    .reduce((acc, d, i) => {
      if (i % 2 === 0) {
        const doubled = d * 2;
        return acc + (doubled > 9 ? doubled - 9 : doubled);
      }
      return acc + d;
    }, 0);
  return (10 - (sum % 10)) % 10;
}

function generateCardNumber(network: CardNetwork): string {
  const digits: number[] =
    network === "visa" ? [4] : [5, 1 + Math.floor(Math.random() * 5)];
  while (digits.length < 15) digits.push(Math.floor(Math.random() * 10));
  digits.push(luhnCheckDigit(digits));
  return digits.join("");
}

function generateCvv(): string {
  return String(Math.floor(Math.random() * 1000)).padStart(3, "0");
}


/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function CardsPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [holderName, setHolderName] = useState("");
  const [network, setNetwork] = useState<CardNetwork>("visa");
  const [createStatus, setCreateStatus] = useState<"idle" | "creating" | "error">("idle");
  const [createError, setCreateError] = useState("");

  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  async function fetchCards() {
    setLoading(true);
    setLoadError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setUserId(user.id);

    const [{ data: profile }, cardsRes] = await Promise.all([
      supabase.from("profiles").select("display_name").eq("id", user.id).single(),
      supabase.from("virtual_cards").select("*").eq("profile_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (cardsRes.error) {
      setLoadError(
        `Cards failed to load: ${cardsRes.error.message}. A missing table means supabase/migrations/0002_virtual_cards.sql still needs to be applied.`
      );
      setCards([]);
    } else {
      setCards((cardsRes.data as VirtualCard[]) ?? []);
    }

    setHolderName((prev) => prev || profile?.display_name || "");
    setLoading(false);
  }

  useEffect(() => {
    fetchCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !holderName.trim()) return;
    setCreateStatus("creating");
    setCreateError("");

    const now = new Date();
    const supabase = createClient();
    const { data, error } = await supabase
      .from("virtual_cards")
      .insert({
        profile_id: userId,
        cardholder_name: holderName.trim(),
        network,
        card_number: generateCardNumber(network),
        expiry_month: now.getMonth() + 1,
        expiry_year: now.getFullYear() + 4,
        cvv: generateCvv(),
      })
      .select()
      .single();

    if (error) {
      setCreateStatus("error");
      setCreateError(error.message);
      return;
    }

    setCards((prev) => [data as VirtualCard, ...prev]);
    setRevealedIds((prev) => new Set(prev).add((data as VirtualCard).id));
    setCreateStatus("idle");
  }

  function toggleReveal(id: string) {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function toggleFreeze(card: VirtualCard) {
    const nextStatus = card.status === "frozen" ? "active" : "frozen";
    const supabase = createClient();
    const { error } = await supabase.from("virtual_cards").update({ status: nextStatus }).eq("id", card.id);
    if (!error) {
      setCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, status: nextStatus } : c)));
    }
  }

  async function removeCard(card: VirtualCard) {
    if (!window.confirm(`Delete the ${card.network} card that ends in ${card.card_number.slice(-4)}? There is no way to reverse this.`)) {
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("virtual_cards").delete().eq("id", card.id);
    if (!error) {
      setCards((prev) => prev.filter((c) => c.id !== card.id));
    }
  }

  const frozenCount = cards.filter((c) => c.status === "frozen").length;
  const kpis = [
    { label: "Cards issued", value: cards.length },
    { label: "Active", value: cards.length - frozenCount },
    { label: "Frozen", value: frozenCount },
  ];
  const canIssue = createStatus !== "creating" && !!holderName.trim();

  return (
    <div className="sx-app-page">
      {/* Page header */}
      <header className="sx-page-head sx-rise">
        <div>
          <div className="sx-overline">Money</div>
          <h1 className="sx-page-title">Virtual cards</h1>
          <p className="sx-page-desc">
            Debit cards funded from your main account. Use them wherever cards are taken, and keep the details hidden until you need them.
          </p>
        </div>
        <div className="sx-page-actions">
          <a href="#issue-card" className="sx-btn sx-btn-primary">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M6 1v10M1 6h10" />
            </svg>
            Issue a card
          </a>
        </div>
      </header>

      {loadError && <div className="sx-alert sx-alert-danger" role="alert" style={{ marginBottom: 20 }}>{loadError}</div>}

      {/* KPI row */}
      <div className="sx-kpis sx-rise sx-d1" style={{ marginBottom: 32 }}>
        {kpis.map((k) => (
          <div key={k.label} className="sx-card sx-hud sx-kpi">
            <Telemetry
              label={k.label}
              value={loading ? <span className="sx-skeleton" style={{ display: "block", width: 48, height: 28 }} /> : k.value}
            />
          </div>
        ))}
      </div>

      {/* Issue form */}
      <section id="issue-card" className="sx-card-solid sx-rise sx-d2" style={{ padding: 24, marginBottom: 40, scrollMarginTop: 84 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div className="sx-overline sx-overline-accent">Issue a card</div>
          <span className="sx-caption">You get a card number right away. Freeze it or delete it whenever you like.</span>
        </div>
        <form onSubmit={handleGenerate} style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 16, marginTop: 20 }}>
          <div className="sx-field" style={{ flex: "1 1 240px", minWidth: 0 }}>
            <label htmlFor="card-holder" className="sx-label">Name on card</label>
            <input
              id="card-holder"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              placeholder="Exactly as it should be printed"
              maxLength={26}
              className="sx-input"
            />
          </div>

          <div className="sx-field" style={{ flex: "0 1 300px", minWidth: 0 }}>
            <span className="sx-label" id="card-network-label">Card network</span>
            <div className="sx-segmented" role="group" aria-labelledby="card-network-label" style={{ display: "flex", height: 46, alignItems: "stretch" }}>
              {(["visa", "mastercard"] as CardNetwork[]).map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={network === n}
                  onClick={() => setNetwork(n)}
                  style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height: "auto" }}
                >
                  {n === "visa" ? (
                    <span aria-hidden="true" style={{ fontFamily: "var(--sx-sans)", fontStyle: "italic", fontWeight: 800, fontSize: 12, letterSpacing: "0.02em" }}>VISA</span>
                  ) : (
                    <svg width="22" height="14" viewBox="0 0 38 24" aria-hidden="true">
                      <circle cx="14" cy="12" r="9" fill="#EB001B" />
                      <circle cx="24" cy="12" r="9" fill="#F79E1B" fillOpacity="0.9" />
                    </svg>
                  )}
                  {n === "visa" ? "Visa" : "Mastercard"}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={!canIssue} className="sx-btn sx-btn-primary" style={{ height: 46, flex: "1 0 auto" }}>
            {createStatus === "creating" ? "Issuing..." : "Issue card"}
          </button>
        </form>
        {createStatus === "error" && <div className="sx-alert sx-alert-danger" role="alert" style={{ marginTop: 14 }}>{createError}</div>}
      </section>

      <div>
        {/* Cards gallery */}
        <section className="sx-rise sx-d3" aria-label="Your cards">
          <div className="sx-overline" style={{ marginBottom: 18 }}>Your cards</div>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: 24 }}>
              {[0, 1].map((i) => (
                <div key={i} className="sx-skeleton" style={{ aspectRatio: "1.586", borderRadius: "var(--sx-r-xl)" }} />
              ))}
            </div>
          ) : cards.length === 0 && !loadError ? (
            <div className="sx-card-solid sx-empty">
              <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="0.9" aria-hidden="true" style={{ color: "var(--sx-text-4)" }}>
                <rect x="1.5" y="3" width="13" height="10" rx="1.8" />
                <path d="M1.5 6.2h13" />
                <path d="M4 10.5h3" />
              </svg>
              You have no cards so far. Use the form above to issue your first one.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "32px 24px" }}>
              {cards.map((card) => (
                <div key={card.id} style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
                  <VirtualCardVisual card={card} revealed={revealedIds.has(card.id)} />
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <button onClick={() => toggleReveal(card.id)} aria-pressed={revealedIds.has(card.id)} className="sx-btn sx-btn-secondary sx-btn-sm">
                      {revealedIds.has(card.id) ? "Mask CVV" : "Show CVV"}
                    </button>
                    <button onClick={() => toggleFreeze(card)} className="sx-btn sx-btn-quiet sx-btn-sm" style={{ borderColor: "var(--sx-line-strong)" }}>
                      {card.status === "frozen" ? "Unfreeze card" : "Freeze card"}
                    </button>
                    <button onClick={() => removeCard(card)} className="sx-btn sx-btn-danger sx-btn-sm" style={{ marginLeft: "auto" }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
