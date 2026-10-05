import Link from "next/link";
import { Brand } from "@/components/sx";

interface FooterColumn {
  heading: string;
  links: { label: string; href: string; external?: boolean }[];
}

const columns: FooterColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "App", href: "/app" },
      { label: "Create an account", href: "/signup" },
      { label: "Roadmap", href: "/roadmap" },
      { label: "Contracts on the explorer", href: "https://explorer.testnet.chain.robinhood.com/address/0x6bE6CD2eDc4E903fD5c869A3e8b766A58546D9f4" },

    ],
  },
  {
    heading: "Capabilities",
    links: [
      { label: "Personal accounts", href: "/#accounts" },
      { label: "Accounts for agents", href: "/#accounts" },
      { label: "Encrypted transfers", href: "/#privacy" },
      { label: "Zero-knowledge proofs", href: "/#privacy" },
      { label: "Payments over x402", href: "/#agents" },
      { label: "Routing via MPP", href: "/#protocol" },
      { label: "Receipts on-chain", href: "/#transparency" },
    ],
  },
  {
    heading: "Learn",
    links: [
      { label: "Docs home", href: "https://docs.sectoral.xyz/", external: true },
      { label: "How a transfer works", href: "https://docs.sectoral.xyz/start-here/anatomy-of-a-transfer", external: true },
      { label: "Picking the right account", href: "https://docs.sectoral.xyz/start-here/choosing-an-account", external: true },
      { label: "Wallets for agents", href: "https://docs.sectoral.xyz/agents/agent-wallets", external: true },
      { label: "API docs", href: "https://docs.sectoral.xyz/api-reference/auth-and-keys", external: true },
      { label: "Architecture overview", href: "https://docs.sectoral.xyz/protocol/system-design", external: true },
      { label: "Join the beta", href: "/signup" },
      { label: "Common questions", href: "https://docs.sectoral.xyz/resources/faq", external: true },
    ],
  },
  {
    heading: "Get in touch",
    links: [
      { label: "Email the team", href: "mailto:contact@sectoral.xyz" },
      { label: "X (Twitter)", href: "https://x.com/sectoralxyz" },
      { label: "GitHub", href: "https://github.com/sectoralxyz" },
    ],
  },
];

const linkClass = "hover:!text-[var(--sx-text)] transition-colors";

export function Footer() {
  return (
    <footer
      style={{
        background: "var(--sx-bg)",
        borderTop: "1px solid var(--sx-line)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div className="sx-container" style={{ paddingTop: "clamp(64px, 8vw, 104px)" }}>
        <div
          className="grid grid-cols-2 sm:grid-cols-4 lg:[grid-template-columns:minmax(0,1.3fr)_repeat(4,minmax(0,1fr))]"
          style={{ columnGap: 32, rowGap: 48 }}
        >
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1" style={{ paddingRight: 24 }}>
            <Link href="/" aria-label="Go to the Sectoral homepage" style={{ textDecoration: "none", display: "inline-block" }}>
              <Brand size={30} />
            </Link>
            <p className="sx-small" style={{ marginTop: 22, maxWidth: 280 }}>
              Private banking for people and the AI agents working for them. Runs on Robinhood Chain with Ethereum security underneath.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <p className="sx-overline" style={{ margin: 0, color: "var(--sx-text-4)" }}>
                {col.heading}
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20, listStyle: "none", padding: 0 }}>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      style={{ fontSize: 14, lineHeight: 1.4, color: "var(--sx-text-2)", textDecoration: "none" }}
                      className={linkClass}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Legal row */}
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
          style={{
            marginTop: "clamp(56px, 7vw, 88px)",
            padding: "22px 0",
            borderTop: "1px solid var(--sx-line)",
            gap: 14,
          }}
        >
          <span className="sx-caption" style={{ color: "var(--sx-text-4)" }}>
            © {new Date().getFullYear()} Sectoral. Confidential from the start, provable at every step.
          </span>
          <div className="flex items-center" style={{ gap: 22 }}>
            <Link href="/roadmap" className={`sx-overline ${linkClass}`} style={{ textDecoration: "none" }}>
              What&apos;s next
            </Link>
          </div>
        </div>
      </div>

      {/* Giant faint wordmark, clipped at the page's bottom edge */}
      <div aria-hidden="true" style={{ overflow: "hidden", marginBottom: "-0.2em", lineHeight: 1 }}>
        <div
          style={{
            fontFamily: "var(--sx-display)",
            fontWeight: 600,
            fontSize: "min(19vw, 300px)",
            letterSpacing: "0.04em",
            marginRight: "-0.04em",
            textTransform: "uppercase",
            textAlign: "center",
            lineHeight: 0.9,
            whiteSpace: "nowrap",
            background: "linear-gradient(180deg, rgba(242,245,248,0.075), rgba(242,245,248,0.0) 85%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            userSelect: "none",
          }}
        >
          Sectoral
        </div>
      </div>
    </footer>
  );
}
