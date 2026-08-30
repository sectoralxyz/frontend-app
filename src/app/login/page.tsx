"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, AuthError } from "@/components/AuthShell";
import { Arrow } from "@/components/sx";

type Status = "idle" | "loading" | "error";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(
        error.message === "Invalid login credentials"
          ? "We couldn't find an account with that email and password. Check both fields and give it another go."
          : error.message
      );
      return;
    }

    router.push("/app");
    router.refresh();
  }

  const loading = status === "loading";

  return (
    <AuthShell
      eyebrow="Sign in"
      title="Good to see you again."
      subtitle="Everything is exactly where you left it."
      aside={{
        heading: (
          <>
            Your funds stay
            <br />
            <span className="sx-gleam">in your hands.</span>
          </>
        ),
        points: [
          "Every balance and transfer amount is encrypted from end to end.",
          "Keys live on your device and nowhere else. All we can see is ciphertext.",
          "Your agents run day and night, always inside the spend limits you chose.",
        ],
      }}
      footer={
        <>
          New to Sectoral? <Link href="/signup">Create an account</Link>
        </>
      }
    >
      {status === "error" && <AuthError>{errorMessage}</AuthError>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
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
          <div className="flex items-center justify-between" style={{ gap: 12 }}>
            <label htmlFor="password" className="sx-label">Password</label>
            <Link href="#" className="sx-link sx-small" style={{ color: "var(--sx-text-2)" }}>
              Reset password
            </Link>
          </div>
          <input
            id="password"
            type="password"
            className="sx-input"
            placeholder="••••••••"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading} className="sx-btn sx-btn-primary sx-btn-block" style={{ marginTop: 8 }}>
          {loading ? "Signing you in…" : <>Sign in <Arrow /></>}
        </button>
      </form>
    </AuthShell>
  );
}
