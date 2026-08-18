"use client";

import Link from "next/link";
import { useState } from "react";
import { Reveal } from "@/components/Reveal";
import { Arrow, SectionHeader } from "@/components/sx";

/* Hand-tokenised so the highlighting stays restrained and dependency-free:
   greys for structure, the accent only for calls. */
type Tok = { children: React.ReactNode };
const K = ({ children }: Tok) => <span className="sx-tok-k">{children}</span>;
const S = ({ children }: Tok) => <span className="sx-tok-s">{children}</span>;
const C = ({ children }: Tok) => <span className="sx-tok-c">{children}</span>;
const F = ({ children }: Tok) => <span className="sx-tok-f">{children}</span>;
const P = ({ children }: Tok) => <span className="sx-tok-p">{children}</span>;

const CODE_LINES = 20;
const INSTALL = "npm i @sectoral/sdk";

function Code() {
  return (
    <pre className="sx-code" style={{ margin: 0, flex: 1, minWidth: 0, overflowX: "auto", padding: "22px 24px 22px 0" }}>
      <code>
        <K>import</K> {"{ "}<F>Sectoral</F>{" }"} <K>from</K> <S>&quot;@sectoral/sdk&quot;</S>;{"\n"}
        {"\n"}
        <K>const</K> bank = <K>new</K> <F>Sectoral</F>({"{ "}apiKey: process.env.<P>SECTORAL_API_KEY</P>{" }"});{"\n"}
        {"\n"}
        <C>{"// On-chain, the amount stays encrypted. You get confirmation"}</C>{"\n"}
        <C>{"// that it settled, never the figure itself in plaintext."}</C>{"\n"}
        <K>const</K> transfer = <K>await</K> bank.transfers.<F>create</F>({"{"}{"\n"}
        {"  "}to: <S>&quot;@vendor&quot;</S>,{"\n"}
        {"  "}amount: <S>&quot;125.00&quot;</S>,{"\n"}
        {"  "}asset: <S>&quot;USDG&quot;</S>,{"\n"}
        {"  "}memo: <S>&quot;Invoice #4471&quot;</S>,{"\n"}
        {"}"});{"\n"}
        {"\n"}
        <C>{"// Spin up an agent with a separate account and a strict budget."}</C>{"\n"}
        <K>const</K> agent = <K>await</K> bank.agents.<F>create</F>({"{"}{"\n"}
        {"  "}handle: <S>&quot;datafetch&quot;</S>,{"\n"}
        {"  "}policy: {"{ "}dailyLimit: <S>&quot;50.00&quot;</S>, maxPerRequest: <S>&quot;5.00&quot;</S>{" }"},{"\n"}
        {"}"});{"\n"}
        {"\n"}
        console.<F>log</F>(transfer.status, agent.address);
      </code>
    </pre>
  );
}

const POINTS = [
  {
    title: "Typed end to end, idempotent out of the box",
    body: "Each create call includes an idempotency key, which makes retries safe even when a process restarts.",
  },
  {
    title: "Webhooks worth relying on",
    body: "Settlements, policy hits and agent actions each arrive as signed events that a single helper verifies.",
  },
  {
    title: "Separate test and live keys, with no mode flag",
    body: "The key prefix tells the client which environment to use, so there is no setting to get wrong.",
  },
];

function CopyInstall() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* Clipboard can be blocked; the command stays selectable. */
    }
  };
  return (
    <div
      className="flex items-center"
      style={{ gap: 12, padding: "12px 12px 12px 20px", borderTop: "1px solid var(--sx-line)", background: "rgba(255,255,255,0.015)" }}
    >
      <span className="sx-mono" style={{ color: "var(--sx-text-4)", fontSize: 13 }} aria-hidden="true">$</span>
      <code className="sx-mono" style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--sx-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {INSTALL}
      </code>
      <button type="button" onClick={copy} className="sx-btn sx-btn-quiet sx-btn-sm" aria-label="Copy the install command" style={{ border: "1px solid var(--sx-line)" }}>
        <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}

export function DeveloperSection() {
  return (
    <section id="developers" className="sx-section" style={{ background: "var(--sx-bg)", borderTop: "1px solid var(--sx-line)", overflow: "hidden" }}>
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 38% 46% at 78% 52%, rgba(255, 236, 216,0.07), transparent 70%)" }}
      />
      <div
        className="sx-container relative grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
        style={{ gap: "clamp(48px, 6vw, 96px)", alignItems: "center" }}
      >
        <Reveal>
          <SectionHeader
            index="04"
            overline="Developers"
            title={
              <>
                Build private banking{" "}
                <span style={{ color: "var(--sx-text-3)" }}>before the day is out.</span>
              </>
            }
            lede="One lightweight, typed SDK wraps the REST API. A single client covers accounts, encrypted transfers, agent accounts with spend policies, and webhooks."
          />

          <ul style={{ marginTop: 40, listStyle: "none", padding: 0, borderTop: "1px solid var(--sx-line)" }}>
            {POINTS.map((p, i) => (
              <li key={p.title} className="flex" style={{ gap: 18, padding: "18px 0", borderBottom: "1px solid var(--sx-line)" }}>
                <span className="sx-overline sx-num" style={{ color: "var(--sx-text-4)", paddingTop: 4, minWidth: 18 }}>
                  0{i + 1}
                </span>
                <div>
                  <div className="sx-title" style={{ fontSize: 15 }}>{p.title}</div>
                  <div className="sx-small" style={{ marginTop: 4, fontSize: 14 }}>{p.body}</div>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center" style={{ gap: 12, marginTop: 36 }}>
            <a href="https://docs.sectoral.xyz" target="_blank" rel="noopener noreferrer" className="sx-btn sx-btn-primary">
              Open the docs <Arrow />
            </a>
            <Link href="/signup" className="sx-btn sx-btn-secondary">
              Create an API key
            </Link>
          </div>
        </Reveal>

        <Reveal delay={120} style={{ minWidth: 0 }}>
          <div
            style={{
              position: "relative",
              background: "var(--sx-panel)",
              border: "1px solid var(--sx-line-strong)",
              borderRadius: "var(--sx-r-xl)",
              boxShadow: "0 40px 80px -40px rgba(0,0,0,0.8)",
            }}
          >
            <div style={{ borderRadius: "var(--sx-r-xl)", overflow: "hidden" }}>
              {/* Window chrome: tabs and a language tag */}
              <div className="flex items-stretch" style={{ height: 46, borderBottom: "1px solid var(--sx-line)", background: "var(--sx-raised)" }}>
                <div className="flex items-center" style={{ gap: 6, padding: "0 18px" }} aria-hidden="true">
                  {[0, 1, 2].map((d) => (
                    <span key={d} style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--sx-text-5)" }} />
                  ))}
                </div>
                <div role="tablist" aria-label="Example files" className="flex items-stretch">
                  <span
                    role="tab"
                    aria-selected="true"
                    className="sx-mono flex items-center"
                    style={{
                      padding: "0 18px",
                      color: "var(--sx-text)",
                      background: "var(--sx-panel)",
                      borderLeft: "1px solid var(--sx-line)",
                      borderRight: "1px solid var(--sx-line)",
                      boxShadow: "inset 0 1px 0 var(--sx-accent)",
                      marginBottom: -1,
                    }}
                  >
                    quickstart.ts
                  </span>
                </div>
                <span className="sx-overline hidden sm:flex items-center" style={{ marginLeft: "auto", padding: "0 18px", color: "var(--sx-text-4)" }}>
                  TypeScript
                </span>
              </div>

              <div className="flex" role="tabpanel" aria-label="quickstart.ts">
                <pre
                  aria-hidden="true"
                  className="sx-code"
                  style={{ margin: 0, padding: "22px 18px 22px 20px", textAlign: "right", color: "var(--sx-text-5)", userSelect: "none", flexShrink: 0 }}
                >
                  {Array.from({ length: CODE_LINES }, (_, i) => i + 1).join("\n")}
                </pre>
                <Code />
              </div>

              <CopyInstall />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
