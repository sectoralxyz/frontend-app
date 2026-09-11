import type { Account, SpendPolicy, PrivacyTier, AccountStatus } from "@/lib/supabase/database.types";

/* Plain helpers for the accounts home. Kept out of the client module so
   server components (the homepage console) can call them too. */

export type AccountRow = Account & { spend_policies: SpendPolicy | null };

export function capitalize(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatUsd(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function displayHandle(account: AccountRow): string {
  return account.type === "human" ? `@${account.handle}.sectoral` : `${account.handle}.sectoral`;
}

export function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}d ago` : new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function tierTagClass(tier: PrivacyTier): string {
  if (tier === "confidential") return "sx-tag sx-tag-accent";
  if (tier === "shielded") return "sx-tag";
  return "sx-tag sx-tag-warn";
}

export function statusDotColor(status: AccountStatus) {
  if (status === "active") return "var(--sx-ok)";
  if (status === "paused") return "var(--sx-warn)";
  return "var(--sx-danger)";
}
