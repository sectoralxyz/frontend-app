"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, ProfileSettings } from "@/lib/supabase/database.types";

type ToggleKey = "requireConfirm" | "autoTopup" | "streamResults" | "saveHistory" | "dataSharing";

function Toggle({ on, onToggle, disabled, label }: { on: boolean; onToggle: () => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      disabled={disabled}
      className="sx-switch"
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
    />
  );
}

/** A settings group: indexed title on the left, a solid panel of rows on the right. */
function Section({ index, title, tone, children }: { index: string; title: string; tone?: "danger"; children: ReactNode }) {
  const danger = tone === "danger";
  return (
    <section
      className="grid lg:grid-cols-[200px_minmax(0,1fr)]"
      style={{ gap: "14px 32px", paddingTop: 28, marginTop: 28, borderTop: "1px solid var(--sx-line)" }}
    >
      <div>
        <div className="sx-overline" style={{ color: danger ? "var(--sx-danger)" : "var(--sx-accent)" }}>{index}</div>
        <h2 className="sx-h3" style={{ marginTop: 10, fontSize: 18, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {title}
        </h2>
      </div>
      <div
        className="sx-card-solid"
        style={{ overflow: "hidden", minWidth: 0, borderColor: danger ? "rgba(229, 96, 79, 0.24)" : undefined }}
      >
        {children}
      </div>
    </section>
  );
}

/** Label and description on the left, the control on the right. Stacks on narrow screens unless `inline`. */
function Row({ label, sublabel, htmlFor, inline, children }: { label: string; sublabel?: string; htmlFor?: string; inline?: boolean; children: ReactNode }) {
  return (
    <div
      className={inline ? "sx-row" : "sx-row flex-col !items-stretch sm:flex-row sm:!items-center"}
      style={{ justifyContent: "space-between", gap: inline ? 16 : "12px 24px", padding: "18px 20px" }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        {htmlFor ? (
          <label htmlFor={htmlFor} className="sx-title" style={{ fontSize: 14, fontWeight: 500, display: "block" }}>{label}</label>
        ) : (
          <div className="sx-title" style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        )}
        {sublabel && <p className="sx-small" style={{ marginTop: 4, maxWidth: 440 }}>{sublabel}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/** Action strip at the foot of a panel: button plus an inline status. */
function Actions({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex flex-wrap items-center"
      style={{ gap: 12, padding: "14px 20px", borderTop: "1px solid var(--sx-line)", background: "rgba(255, 255, 255, 0.015)" }}
    >
      {children}
    </div>
  );
}

function Status({ tone, children }: { tone: "ok" | "danger"; children: ReactNode }) {
  return (
    <span role="status" className="sx-caption flex items-center" style={{ gap: 8, color: tone === "ok" ? "var(--sx-ok)" : "var(--sx-danger)" }}>
      <span className="sx-dot" style={{ background: "currentColor" }} />
      {children}
    </span>
  );
}

/** Dollar amount input with the currency mark inside the field. */
function MoneyInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ position: "relative" }} className="w-full sm:w-[160px]">
      <span
        aria-hidden="true"
        className="sx-num"
        style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--sx-text-3)", fontSize: 14 }}
      >
        $
      </span>
      <input
        id={id}
        className="sx-input sx-num"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="number"
        min={0}
        inputMode="decimal"
        style={{ paddingLeft: 28, height: 42 }}
      />
    </div>
  );
}

/* sx-input sets width: 100%, so the desktop width needs to win over it */
const fieldWidth = "sm:!w-[260px]";

const DEFAULT_PREFS: Record<ToggleKey, boolean> = {
  requireConfirm: true,
  autoTopup: false,
  streamResults: true,
  saveHistory: true,
  dataSharing: false,
};

export default function SettingsPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [walletStatus, setWalletStatus] = useState<"idle" | "saving" | "saved" | "error" | "invalid">("idle");

  const [daily, setDaily] = useState("0");
  const [monthly, setMonthly] = useState("0");
  const [limitsStatus, setLimitsStatus] = useState<"idle" | "saving" | "saved" | "error" | "invalid">("idle");

  const [prefs, setPrefs] = useState<Record<ToggleKey, boolean>>(DEFAULT_PREFS);
  const [togglingKey, setTogglingKey] = useState<ToggleKey | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const [exportStatus, setExportStatus] = useState<"idle" | "exporting" | "error">("idle");
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "confirming" | "deleting" | "error">("idle");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setProfileLoading(true);
      setProfileError(null);
      const supabase = createClient();

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        if (!cancelled) {
          setProfileError("Sign in first to open your settings.");
          setProfileLoading(false);
        }
        return;
      }
      if (!cancelled) setEmail(userData.user.email ?? "");

      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single();

      if (cancelled) return;

      if (profileErr || !profileData) {
        setProfileError("Your profile failed to load. A page refresh usually fixes this.");
        setProfileLoading(false);
        return;
      }

      setProfile(profileData);
      setDisplayName(profileData.display_name ?? "");
      setWalletAddress(profileData.wallet_address ?? "");
      setDaily(String(profileData.settings?.dailyLimit ?? 0));
      setMonthly(String(profileData.settings?.monthlyLimit ?? 0));
      setPrefs({
        requireConfirm: profileData.settings?.requireConfirm ?? true,
        autoTopup: profileData.settings?.autoTopup ?? false,
        streamResults: profileData.settings?.streamResults ?? true,
        saveHistory: profileData.settings?.saveHistory ?? true,
        dataSharing: profileData.settings?.dataSharing ?? false,
      });
      setProfileLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    if (!profile) return;
    setSaveStatus("saving");
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", profile.id);
    if (error) {
      setSaveStatus("error");
      return;
    }
    setProfile((p) => (p ? { ...p, display_name: displayName } : p));
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 1500);
  }

  function isValidWalletAddress(address: string): boolean {
    return /^0x[0-9a-fA-F]{40}$/.test(address);
  }

  async function handleSaveWallet() {
    if (!profile) return;
    if (walletAddress && !isValidWalletAddress(walletAddress)) {
      setWalletStatus("invalid");
      return;
    }
    setWalletStatus("saving");
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ wallet_address: walletAddress || null }).eq("id", profile.id);
    if (error) {
      setWalletStatus("error");
      return;
    }
    setProfile((p) => (p ? { ...p, wallet_address: walletAddress || null } : p));
    setWalletStatus("saved");
    setTimeout(() => setWalletStatus("idle"), 1500);
  }

  async function handleSaveLimits() {
    if (!profile) return;
    const dailyNum = Number(daily);
    const monthlyNum = Number(monthly);
    if (!Number.isFinite(dailyNum) || dailyNum < 0 || !Number.isFinite(monthlyNum) || monthlyNum < 0) {
      setLimitsStatus("invalid");
      return;
    }
    setLimitsStatus("saving");
    const supabase = createClient();
    const newSettings: ProfileSettings = { ...profile.settings, dailyLimit: dailyNum, monthlyLimit: monthlyNum };
    const { error } = await supabase.from("profiles").update({ settings: newSettings }).eq("id", profile.id);
    if (error) {
      setLimitsStatus("error");
      return;
    }
    setProfile((p) => (p ? { ...p, settings: newSettings } : p));
    setLimitsStatus("saved");
    setTimeout(() => setLimitsStatus("idle"), 1500);
  }

  async function handleToggle(key: ToggleKey) {
    if (!profile || togglingKey) return;
    const newValue = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: newValue }));
    setTogglingKey(key);
    setToggleError(null);
    const supabase = createClient();
    const newSettings: ProfileSettings = { ...profile.settings, [key]: newValue };
    const { error } = await supabase.from("profiles").update({ settings: newSettings }).eq("id", profile.id);
    setTogglingKey(null);
    if (error) {
      setPrefs((p) => ({ ...p, [key]: !newValue }));
      setToggleError("That change did not stick. Please retry.");
      setTimeout(() => setToggleError(null), 2500);
      return;
    }
    setProfile((p) => (p ? { ...p, settings: newSettings } : p));
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleExport() {
    if (!profile) return;
    setExportStatus("exporting");
    try {
      const supabase = createClient();
      const [accountsRes, transactionsRes, alertsRes, apiKeysRes, webhooksRes] = await Promise.all([
        supabase.from("accounts").select("*").eq("owner_id", profile.id),
        supabase.from("transactions").select("*"),
        supabase.from("alerts").select("*").eq("profile_id", profile.id),
        supabase.from("api_keys").select("*").eq("profile_id", profile.id),
        supabase.from("webhooks").select("*").eq("profile_id", profile.id),
      ]);

      const exportPayload = {
        exported_at: new Date().toISOString(),
        profile,
        accounts: accountsRes.data ?? [],
        transactions: transactionsRes.data ?? [],
        alerts: alertsRes.data ?? [],
        api_keys: apiKeysRes.data ?? [],
        webhooks: webhooksRes.data ?? [],
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sectoral-export-${profile.handle}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportStatus("idle");
    } catch {
      setExportStatus("error");
    }
  }

  async function handleDeleteAccount() {
    if (!profile) return;
    if (deleteStatus !== "confirming") {
      setDeleteStatus("confirming");
      return;
    }
    setDeleteStatus("deleting");
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ deletion_requested_at: new Date().toISOString() })
      .eq("id", profile.id);
    if (error) {
      setDeleteStatus("error");
      return;
    }
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }


  if (profileLoading) {
    return (
      <div className="sx-app-page" style={{ maxWidth: 980 }} aria-busy="true">
        <p className="sr-only">Fetching your settings...</p>
        <div className="sx-skeleton" style={{ width: 90, height: 10 }} />
        <div className="sx-skeleton" style={{ width: 220, height: 34, marginTop: 18 }} />
        <div className="sx-skeleton" style={{ width: "min(420px, 90%)", height: 12, marginTop: 14 }} />
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid lg:grid-cols-[200px_minmax(0,1fr)]" style={{ gap: "14px 32px", marginTop: 44 }}>
            <div className="sx-skeleton" style={{ width: 120, height: 14 }} />
            <div className="sx-skeleton" style={{ height: 150, borderRadius: "var(--sx-r-xl)" }} />
          </div>
        ))}
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="sx-app-page" style={{ maxWidth: 980 }}>
        <div className="sx-overline">Account</div>
        <h1 className="sx-h2" style={{ marginTop: 16, fontSize: "clamp(28px, 3.2vw, 40px)" }}>Settings</h1>
        <div className="sx-alert sx-alert-danger" role="alert" style={{ marginTop: 24, maxWidth: 560 }}>
          {profileError ?? "Your profile failed to load."}
        </div>
      </div>
    );
  }

  return (
    <div className="sx-app-page" style={{ maxWidth: 980 }}>
      {/* Page header */}
      <header className="sx-rise flex flex-col sm:flex-row sm:items-end sm:justify-between" style={{ gap: 20 }}>
        <div style={{ minWidth: 0 }}>
          <div className="sx-overline flex items-center" style={{ gap: 10 }}>
            <span className="sx-dot sx-dot-live" />
            <span>Account</span>
            <span aria-hidden="true" style={{ color: "var(--sx-text-5)" }}>/</span>
            <span className="sx-mono" style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "none" }}>@{profile.handle}</span>
          </div>
          <h1 className="sx-h2" style={{ marginTop: 16, fontSize: "clamp(28px, 3.2vw, 40px)" }}>
            Settings
          </h1>
          <p className="sx-body" style={{ marginTop: 10, maxWidth: 560 }}>
            Control your profile, linked wallet, limits and preferences in one place.
          </p>
        </div>
        <button type="button" onClick={handleSignOut} className="sx-btn sx-btn-secondary sx-btn-sm shrink-0 self-start sm:self-auto">
          Log out
        </button>
      </header>

      <div className="sx-rise sx-d1">
        {/* Profile */}
        <Section index="01" title="Your profile">
          <Row label="Handle" sublabel="Your Sectoral identity. It is fixed for good and cannot be edited">
            <div
              className={`sx-input sx-mono flex items-center ${fieldWidth}`}
              style={{ height: 42, color: "var(--sx-text-2)", background: "rgba(255, 255, 255, 0.015)", borderStyle: "dashed", fontSize: 12 }}
              aria-readonly="true"
            >
              <span className="truncate">@{profile.handle}.sectoral</span>
            </div>
          </Row>
          <Row label="Display name" sublabel="The name people see on your public creator profile" htmlFor="settings-display-name">
            <input
              id="settings-display-name"
              className={`sx-input ${fieldWidth}`}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={{ height: 42 }}
            />
          </Row>
          <Row label="Email" sublabel="Where we send alerts and execution receipts" htmlFor="settings-email">
            <input id="settings-email" className={`sx-input ${fieldWidth}`} value={email} disabled style={{ height: 42 }} />
          </Row>
          <Actions>
            <button type="button" onClick={handleSave} disabled={saveStatus === "saving"} className="sx-btn sx-btn-primary sx-btn-sm">
              {saveStatus === "saving" ? "Saving..." : "Save profile"}
            </button>
            {saveStatus === "saved" && <Status tone="ok">Changes saved</Status>}
            {saveStatus === "error" && <Status tone="danger">That did not work, please retry</Status>}
          </Actions>
        </Section>

        {/* Wallet */}
        <Section index="02" title="Linked wallet">
          <Row
            label="Wallet address"
            sublabel="The Robinhood Chain address used for payouts and anything you do on-chain"
            htmlFor="settings-wallet"
          >
            <input
              id="settings-wallet"
              className={`sx-input sx-mono sm:!w-[300px]`}
              value={walletAddress}
              onChange={(e) => { setWalletAddress(e.target.value); setWalletStatus("idle"); }}
              placeholder="0x4A9e...c7F2, for example"
              spellCheck={false}
              autoComplete="off"
              aria-invalid={walletStatus === "invalid"}
              style={{ height: 42, fontSize: 12, borderColor: walletStatus === "invalid" ? "rgba(229, 96, 79, 0.5)" : undefined }}
            />
          </Row>
          <Actions>
            <button type="button" onClick={handleSaveWallet} disabled={walletStatus === "saving"} className="sx-btn sx-btn-primary sx-btn-sm">
              {walletStatus === "saving" ? "Saving..." : "Update wallet"}
            </button>
            {walletStatus === "saved" && <Status tone="ok">Changes saved</Status>}
            {walletStatus === "invalid" && <Status tone="danger">That address is not valid</Status>}
            {walletStatus === "error" && <Status tone="danger">That did not work, please retry</Status>}
          </Actions>
        </Section>

        {/* Spending limits */}
        <Section index="03" title="Spend controls">
          <Row label="Daily limit" sublabel="Payments stop for the day once your total hits this amount. Use 0 to remove the limit" htmlFor="settings-daily">
            <MoneyInput id="settings-daily" value={daily} onChange={(v) => { setDaily(v); setLimitsStatus("idle"); }} />
          </Row>
          <Row label="Monthly limit" sublabel="A strict ceiling for each calendar month. Use 0 to remove the limit" htmlFor="settings-monthly">
            <MoneyInput id="settings-monthly" value={monthly} onChange={(v) => { setMonthly(v); setLimitsStatus("idle"); }} />
          </Row>
          <Actions>
            <button type="button" onClick={handleSaveLimits} disabled={limitsStatus === "saving"} className="sx-btn sx-btn-primary sx-btn-sm">
              {limitsStatus === "saving" ? "Saving..." : "Update limits"}
            </button>
            {limitsStatus === "saved" && <Status tone="ok">Changes saved</Status>}
            {limitsStatus === "invalid" && <Status tone="danger">Amounts must be zero or more</Status>}
            {limitsStatus === "error" && <Status tone="danger">That did not work, please retry</Status>}
          </Actions>
          <div style={{ borderTop: "1px solid var(--sx-line)" }}>
            <Row inline label="Ask before paying" sublabel="Pop up a confirmation step for every payment above $0.50">
              <Toggle label="Ask before paying" on={prefs.requireConfirm} onToggle={() => handleToggle("requireConfirm")} disabled={togglingKey === "requireConfirm"} />
            </Row>
            <Row inline label="Auto top-up" sublabel="Refill your main account on its own whenever the balance gets low">
              <Toggle label="Auto top-up" on={prefs.autoTopup} onToggle={() => handleToggle("autoTopup")} disabled={togglingKey === "autoTopup"} />
            </Row>
          </div>
        </Section>

        {/* Execution preferences */}
        <Section index="04" title="Run preferences">
          <Row inline label="Stream results" sublabel="Display output live rather than holding it until the run finishes">
            <Toggle label="Stream results" on={prefs.streamResults} onToggle={() => handleToggle("streamResults")} disabled={togglingKey === "streamResults"} />
          </Row>
          <Row inline label="Keep run history" sublabel="Save every run output and receipt to your account">
            <Toggle label="Keep run history" on={prefs.saveHistory} onToggle={() => handleToggle("saveHistory")} disabled={togglingKey === "saveHistory"} />
          </Row>
          <Row inline label="Share anonymised usage stats" sublabel="Helps us make agents better. Your inputs are never included.">
            <Toggle label="Share anonymised usage stats" on={prefs.dataSharing} onToggle={() => handleToggle("dataSharing")} disabled={togglingKey === "dataSharing"} />
          </Row>
          {toggleError && (
            <div style={{ padding: "0 20px 18px" }}>
              <div className="sx-alert sx-alert-danger" role="alert">{toggleError}</div>
            </div>
          )}
        </Section>

        {/* Danger zone */}
        <Section index="05" title="Irreversible actions" tone="danger">
          <Row label="Download your data" sublabel="Get one JSON file containing all of your accounts, transactions, alerts, API keys and webhooks">
            <button
              type="button"
              onClick={handleExport}
              disabled={exportStatus === "exporting"}
              className="sx-btn sx-btn-secondary sx-btn-sm"
            >
              {exportStatus === "exporting" ? "Preparing..." : "Download"}
            </button>
          </Row>
          {exportStatus === "error" && (
            <div style={{ padding: "0 20px 18px" }}>
              <div className="sx-alert sx-alert-danger" role="alert">
                We could not build your export. Please give it another try.
              </div>
            </div>
          )}
          <div style={{ padding: "20px", borderTop: "1px solid var(--sx-line)", background: "rgba(229, 96, 79, 0.03)" }}>
            {profile.deletion_requested_at ? (
              <div className="sx-alert sx-alert-danger" role="status">
                You asked us to delete this account on {new Date(profile.deletion_requested_at).toLocaleDateString()}. To undo that, reach out to support.
              </div>
            ) : (
              <>
                <div className="sx-title" style={{ fontSize: 14, fontWeight: 500 }}>Account deletion</div>
                <p className="sx-small" style={{ marginTop: 4, maxWidth: 520 }}>
                  Once you request deletion, you are signed out right away and your account plus all of its data is
                  queued for permanent removal within 30 days. Changed your mind? Get in touch with support before that window closes.
                </p>
                <div className="flex flex-wrap items-center" style={{ gap: 10, marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteStatus === "deleting"}
                    className="sx-btn sx-btn-danger sx-btn-sm"
                  >
                    {deleteStatus === "deleting"
                      ? "Submitting request..."
                      : deleteStatus === "confirming"
                      ? "Click once more to confirm"
                      : "Delete my account"}
                  </button>
                  {deleteStatus === "confirming" && (
                    <button type="button" onClick={() => setDeleteStatus("idle")} className="sx-btn sx-btn-quiet sx-btn-sm">
                      Keep account
                    </button>
                  )}
                  {deleteStatus === "error" && <Status tone="danger">That did not work, please retry</Status>}
                </div>
              </>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}
