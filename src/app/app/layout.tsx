"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SidebarNav, TopBarView, UserChip } from "@/components/app/shell";

/* ── Sidebar content (shared by desktop rail and mobile drawer) ────────── */

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <SidebarNav pathname={pathname} onNavigate={onNavigate} />;
}

/* ── User card (bottom of sidebar) ─────────────────────────────────────── */

function UserCard() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, wallet_address, handle")
        .eq("id", data.user.id)
        .single();
      const name = profile?.display_name || data.user.email || "";
      setDisplayName(name);
      setWalletAddress(profile?.wallet_address || "");
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <div ref={menuRef} style={{ position: "relative", padding: "0 12px 14px", flexShrink: 0 }}>
      {menuOpen && (
        <div
          role="menu"
          className="sx-rise"
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: 12,
            right: 12,
            background: "var(--sx-panel)",
            border: "1px solid var(--sx-line-strong)",
            borderRadius: "var(--sx-r-lg)",
            padding: 6,
            zIndex: 100,
            boxShadow: "0 16px 48px rgba(0,0,0,0.55)",
            animationDuration: "0.35s",
          }}
        >
          {walletAddress && (
            <div style={{ padding: "10px 10px 12px", borderBottom: "1px solid var(--sx-line)", marginBottom: 6 }}>
              <div className="sx-overline" style={{ fontSize: 10 }}>Connected wallet</div>
              <div className="sx-mono" style={{ marginTop: 6, color: "var(--sx-text-2)" }}>
                {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
              </div>
            </div>
          )}
          <button
            role="menuitem"
            onClick={handleSignOut}
            className="sx-btn-quiet"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "9px 10px",
              borderRadius: "var(--sx-r-sm)",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              textAlign: "left",
              transition: "background-color 0.2s, color 0.2s",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path d="M6 2H2.5A1.5 1.5 0 0 0 1 3.5v8A1.5 1.5 0 0 0 2.5 13H6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
              <path d="M10 10l3-2.5L10 5M13 7.5H5.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Log out
          </button>
        </div>
      )}

      <UserChip
        initials={initials}
        displayName={displayName}
        walletAddress={walletAddress}
        open={menuOpen}
        onClick={() => setMenuOpen((o) => !o)}
      />
    </div>
  );
}

/* ── Top bar (breadcrumb, contextual actions, mobile menu) ─────────────── */

function TopBar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const pathname = usePathname();
  return <TopBarView pathname={pathname} onOpenMobileNav={onOpenMobileNav} />;
}

/* ── Layout ────────────────────────────────────────────────────────────── */

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Drawer: close on Escape and keep the page behind it from scrolling
  useEffect(() => {
    if (!mobileNavOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileNavOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  return (
    <div style={{ background: "var(--sx-bg)", minHeight: "100vh", display: "flex" }}>
      {/* Desktop sidebar rail */}
      <aside
        className="hidden lg:flex"
        style={{
          width: 256,
          flexShrink: 0,
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          borderRight: "1px solid var(--sx-line)",
          background: "var(--sx-raised)",
        }}
      >
        <SidebarContent />
        <UserCard />
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="lg:hidden" role="dialog" aria-modal="true" aria-label="App navigation">
          <div className="sx-overlay sx-glass" onClick={() => setMobileNavOpen(false)} />
          <div className="sx-sheet sx-sheet-left" style={{ width: "min(300px, 86vw)", background: "var(--sx-raised)" }}>
            <button
              onClick={() => setMobileNavOpen(false)}
              aria-label="Hide menu"
              style={{
                position: "absolute",
                top: 18,
                right: 14,
                width: 34,
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "1px solid var(--sx-line)",
                borderRadius: "var(--sx-r-md)",
                color: "var(--sx-text-2)",
                cursor: "pointer",
                zIndex: 1,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} aria-hidden="true">
                <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
              </svg>
            </button>
            <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
            <UserCard />
          </div>
        </div>
      )}

      {/* Content column */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <TopBar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main style={{ position: "relative", flex: 1, minHeight: "calc(100vh - 60px)" }}>
          {/* Faint blueprint grid behind the top of every page */}
          <div aria-hidden="true" className="sx-grid" style={{ position: "absolute", inset: "0 0 auto 0", height: 420, opacity: 0.45 }} />
          <div style={{ position: "relative" }}>{children}</div>
        </main>
      </div>
    </div>
  );
}
