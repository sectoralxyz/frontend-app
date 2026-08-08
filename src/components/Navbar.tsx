"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Brand, Arrow } from "@/components/sx";

const NAV_LINKS = [
  { label: "Accounts", href: "/#accounts" },
  { label: "Privacy", href: "/#privacy" },
  { label: "Agents", href: "/#agents" },
  { label: "Protocol", href: "/#protocol" },
  { label: "Docs", href: "https://docs.sectoral.xyz" },
] as const;

function XIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 1200 1227" fill="currentColor" aria-hidden="true">
      <path d="M714.163 519.284 1160.89 0h-105.86L667.137 450.887 381.109 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.163 519.284Zm-144.999 168.404-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.164 687.688Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.44 7.44 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.4} aria-hidden="true">
      {open ? (
        <>
          <line x1={4.5} y1={4.5} x2={15.5} y2={15.5} />
          <line x1={15.5} y1={4.5} x2={4.5} y2={15.5} />
        </>
      ) : (
        <>
          <line x1={3} y1={7} x2={17} y2={7} />
          <line x1={3} y1={13} x2={17} y2={13} />
        </>
      )}
    </svg>
  );
}

const linkStyle: React.CSSProperties = {
  fontFamily: "var(--sx-display)",
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "var(--sx-text-2)",
  textDecoration: "none",
  transition: "color 0.2s",
};

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const solid = scrolled || mobileMenuOpen;

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-[100]"
        style={{
          transition: "background-color 0.4s var(--sx-ease), border-color 0.4s var(--sx-ease), backdrop-filter 0.4s",
          background: solid ? "rgba(5,7,10,0.78)" : "transparent",
          backdropFilter: solid ? "blur(24px) saturate(140%)" : "none",
          WebkitBackdropFilter: solid ? "blur(24px) saturate(140%)" : "none",
          borderBottom: `1px solid ${solid ? "var(--sx-line)" : "transparent"}`,
        }}
      >
        <div className="sx-container flex items-center" style={{ height: 72 }}>
          <Link href="/" aria-label="Go to the Sectoral homepage" style={{ textDecoration: "none" }}>
            <Brand size={30} />
          </Link>

          <nav aria-label="Primary navigation" className="hidden lg:flex items-center" style={{ gap: 36, margin: "0 auto" }}>
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={label} href={href} style={linkStyle} className="hover:!text-[var(--sx-text)]">
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center" style={{ gap: 18 }}>
            <a href="https://x.com/sectoralxyz" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" style={{ color: "var(--sx-text-3)" }} className="hover:!text-[var(--sx-text)] transition-colors">
              <XIcon />
            </a>
            <a href="https://github.com/sectoralxyz" target="_blank" rel="noopener noreferrer" aria-label="GitHub" style={{ color: "var(--sx-text-3)" }} className="hover:!text-[var(--sx-text)] transition-colors">
              <GitHubIcon />
            </a>
            <span aria-hidden="true" style={{ width: 1, height: 18, background: "var(--sx-line-strong)" }} />
            {user ? (
              <Link href="/app" className="sx-btn sx-btn-primary sx-btn-sm">
                Open app <Arrow size={12} />
              </Link>
            ) : (
              <>
                <Link href="/login" style={linkStyle} className="hover:!text-[var(--sx-text)]">
                  Sign in
                </Link>
                <Link href="/signup" className="sx-btn sx-btn-primary sx-btn-sm">
                  Get started <Arrow size={12} />
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? "Hide menu" : "Show menu"}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden flex items-center justify-center"
            style={{
              marginLeft: "auto",
              width: 42,
              height: 42,
              borderRadius: "var(--sx-r-md)",
              border: "1px solid var(--sx-line-strong)",
              background: "transparent",
              color: "var(--sx-text)",
              cursor: "pointer",
            }}
          >
            <MenuIcon open={mobileMenuOpen} />
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed left-0 right-0 bottom-0 z-[99] flex flex-col"
          style={{ top: 72, background: "rgba(5,7,10,0.97)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
        >
          <nav aria-label="Navigation for small screens" className="sx-container flex flex-col" style={{ paddingTop: 16 }}>
            {NAV_LINKS.map(({ label, href }, i) => (
              <Link
                key={label}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="sx-rise flex items-center justify-between"
                style={{
                  animationDelay: `${i * 0.04}s`,
                  padding: "20px 0",
                  borderBottom: "1px solid var(--sx-line)",
                  fontFamily: "var(--sx-display)",
                  fontSize: 26,
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--sx-text)",
                  textDecoration: "none",
                }}
              >
                {label}
                <span className="sx-overline">0{i + 1}</span>
              </Link>
            ))}
            <div className="flex items-center" style={{ gap: 20, padding: "24px 0", color: "var(--sx-text-3)" }}>
              <a href="https://x.com/sectoralxyz" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="flex items-center gap-2" style={{ color: "inherit", textDecoration: "none", fontSize: 14 }}>
                <XIcon /> X (Twitter)
              </a>
              <a href="https://github.com/sectoralxyz" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="flex items-center gap-2" style={{ color: "inherit", textDecoration: "none", fontSize: 14 }}>
                <GitHubIcon /> GitHub
              </a>
            </div>
          </nav>
          <div className="sx-container flex flex-col" style={{ gap: 10, marginTop: "auto", paddingBottom: 32 }}>
            {user ? (
              <Link href="/app" onClick={() => setMobileMenuOpen(false)} className="sx-btn sx-btn-primary sx-btn-lg sx-btn-block">
                Open app <Arrow />
              </Link>
            ) : (
              <>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="sx-btn sx-btn-primary sx-btn-lg sx-btn-block">
                  Get started <Arrow />
                </Link>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="sx-btn sx-btn-secondary sx-btn-lg sx-btn-block">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
