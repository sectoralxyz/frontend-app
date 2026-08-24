import { Reveal } from "@/components/Reveal";
import { SectionHeader } from "@/components/sx";

const FAQS = [
  {
    q: "Does Sectoral make me anonymous?",
    a: "No, by design. We verify who you are when the account is opened, and your address is visible on-chain. The part we keep hidden is how much moves through the account. Think confidentiality, not anonymity.",
  },
  {
    q: "Will I need to know how blockchains work?",
    a: "Not at all. Signing up takes an email and a passkey, much like turning on Face ID in any other app. Key management, encryption and settlement all happen automatically in the background.",
  },
  {
    q: "What is an agent account, exactly?",
    a: "Each agent receives a dedicated smart account on Robinhood Chain plus an Agent ID that sits under your parent account. Everything it does is bound by a spend policy you write, covering daily limits, approved recipients, time windows and, if you want one, a threshold above which a human must approve.",
  },
  {
    q: "Could an agent overspend what I allowed?",
    a: "It can't. The spend policy is checked before anything gets signed, rather than audited afterwards. A transaction that breaks the policy is never built in the first place.",
  },
  {
    q: "How do I show a payment to an auditor?",
    a: "Hand them a view key. It opens read-only access to the specific transfers you choose and nothing more, and you can withdraw it whenever you like. You keep custody throughout.",
  },
  {
    q: "How much does it cost?",
    a: "While we are in beta, it's free. The only charge is Robinhood Chain gas, usually a fraction of a cent, and your ETH reserve pays it for you automatically.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="sx-section" style={{ background: "var(--sx-bg)", borderTop: "1px solid var(--sx-line)" }}>
      <div
        className="sx-container grid grid-cols-1 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]"
        style={{ gap: "clamp(40px, 6vw, 96px)" }}
      >
        <Reveal>
          <div className="lg:sticky" style={{ top: 120 }}>
            <SectionHeader index="05" overline="FAQ" title="Plain answers to common questions." />
            <p className="sx-body" style={{ marginTop: 22, maxWidth: 360 }}>
              Still curious? Read the{" "}
              <a
                href="https://docs.sectoral.xyz/resources/faq"
                target="_blank"
                rel="noopener noreferrer"
                className="sx-link"
                style={{ backgroundSize: "100% 1px", backgroundImage: "linear-gradient(var(--sx-line-strong), var(--sx-line-strong))" }}
              >
                complete FAQ
              </a>
              .
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div style={{ borderTop: "1px solid var(--sx-line-strong)" }}>
            {FAQS.map((f, i) => (
              <details key={f.q} className="sx-accordion-item" style={{ borderBottom: "1px solid var(--sx-line)" }}>
                <summary className="flex items-center" style={{ gap: 20, padding: "26px 0" }}>
                  <span className="sx-overline sx-num hidden sm:inline" style={{ color: "var(--sx-text-4)", minWidth: 22 }}>
                    0{i + 1}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontFamily: "var(--sx-sans)",
                      fontSize: "clamp(16px, 1.3vw, 18px)",
                      fontWeight: 500,
                      lineHeight: 1.45,
                      letterSpacing: "-0.005em",
                      color: "var(--sx-text)",
                    }}
                  >
                    {f.q}
                  </span>
                  <span className="sx-plus" aria-hidden="true" />
                </summary>
                <p className="sx-body sm:pl-[42px] sm:pr-[52px]" style={{ margin: "-6px 0 0", paddingBottom: 28, maxWidth: 760 }}>
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
