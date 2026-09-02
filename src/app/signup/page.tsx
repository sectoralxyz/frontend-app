"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, AuthError, AuthSuccessMark } from "@/components/AuthShell";
import { Arrow } from "@/components/sx";

type Status = "idle" | "loading" | "error" | "success";

const ROLES = [
  { value: "human", label: "Myself" },
  { value: "agent", label: "My agents" },
  { value: "both", label: "Both" },
];

export default function SignupPage() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [role, setRole] = useState("both");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const supabase = createClient();
    const name = [form.firstName, form.lastName].filter(Boolean).join(" ");

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: name, role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("success");
  }

  const loading = status === "loading";

  if (status === "success") {
    return (
      <AuthShell eyebrow="Almost there" title="Look in your inbox." width={440}>
        <AuthSuccessMark />
        <p className="sx-body" style={{ margin: 0 }}>
          A confirmation link is on its way to{" "}
          <span style={{ color: "var(--sx-text)", overflowWrap: "anywhere" }}>{form.email}</span>. Click it to activate your account.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 28 }}>
          <Link href="/" className="sx-btn sx-btn-secondary sx-btn-block">
            Return home
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Get started"
      title="Set up a private account in minutes."
      subtitle="All you need is an email and a password. Your keys are created locally on your device."
      width={480}
      aside={{
        heading: (
          <>
            Private banking for people <span className="sx-gleam">and the AI agents they run.</span>
          </>
        ),
        points: [
          "Amounts are encrypted out of the box and checked with zero-knowledge proofs.",
          "Each agent gets its own account, bound by spending policies enforced on-chain.",
          "Share activity only when you choose, through view keys, while keeping custody.",
          "Completely non-custodial. Your keys and your funds never leave your device.",
        ],
      }}
      footer={
        <>
          Have an account already? <Link href="/login">Sign in</Link>
        </>
      }
    >
      {status === "error" && <AuthError>{errorMessage}</AuthError>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
          <div className="sx-field">
            <label htmlFor="first-name" className="sx-label">Given name</label>
            <input
              id="first-name"
              type="text"
              className="sx-input"
              placeholder="Ada"
              autoComplete="given-name"
              required
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              disabled={loading}
            />
          </div>
          <div className="sx-field">
            <label htmlFor="last-name" className="sx-label">Family name</label>
            <input
              id="last-name"
              type="text"
              className="sx-input"
              placeholder="Lovelace"
              autoComplete="family-name"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              disabled={loading}
            />
          </div>
        </div>

        <div className="sx-field">
          <label htmlFor="email" className="sx-label">Email</label>
          <input
            id="email"
            type="email"
            className="sx-input"
            placeholder="you@example.com"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            disabled={loading}
          />
        </div>

        <div className="sx-field">
          <label htmlFor="password" className="sx-label">Password</label>
          <input
            id="password"
            type="password"
            className="sx-input"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            disabled={loading}
          />
        </div>

        <div className="sx-field">
          <span className="sx-label">This account is for</span>
          <div
            className="grid grid-cols-3"
            role="radiogroup"
            aria-label="Who the account is for"
            style={{
              gap: 4,
              padding: 4,
              borderRadius: "var(--sx-r-md)",
              background: "rgba(255, 255, 255, 0.025)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            {ROLES.map((opt) => {
              const active = role === opt.value;
              return (
                <label
                  key={opt.value}
                  className="relative flex items-center justify-center transition-colors hover:!text-[var(--sx-text)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--sx-accent)]"
                  style={{
                    height: 36,
                    borderRadius: 7,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: "var(--sx-display)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: active ? "var(--sx-accent)" : "var(--sx-text-3)",
                    background: active ? "var(--sx-accent-bg)" : "transparent",
                    boxShadow: active ? "inset 0 0 0 1px var(--sx-accent-line)" : "none",
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value={opt.value}
                    checked={active}
                    onChange={() => setRole(opt.value)}
                    disabled={loading}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </div>

        <button type="submit" disabled={loading} className="sx-btn sx-btn-primary sx-btn-block" style={{ marginTop: 8 }}>
          {loading ? "Setting things up…" : <>Open my account <Arrow /></>}
        </button>

        <p className="sx-caption" style={{ margin: 0, textAlign: "center", color: "var(--sx-text-4)" }}>
          No cost while in beta. We verify your identity a single time and never pass it on.
        </p>
      </form>
    </AuthShell>
  );
}
