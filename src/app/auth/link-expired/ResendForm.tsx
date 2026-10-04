"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthError, AuthSuccessMark } from "@/components/AuthShell";
import { Arrow } from "@/components/sx";

type Status = "idle" | "sending" | "sent" | "error";

/** Asks Supabase to send the sign-up confirmation email again. */
export function ResendForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(
        error.status === 429
          ? "Too many requests in a short time. Wait a minute, then try again."
          : error.message
      );
      return;
    }
    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div role="status">
        <AuthSuccessMark />
        <p className="sx-body" style={{ margin: 0 }}>
          A fresh link is on its way to <span style={{ color: "var(--sx-text)" }}>{email.trim()}</span>. Open it on any
          device to finish setting up your account.
        </p>
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <>
      {status === "error" && <AuthError>{errorMessage}</AuthError>}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="sx-field">
          <label htmlFor="resend-email" className="sx-label">Email you signed up with</label>
          <input
            id="resend-email"
            type="email"
            className="sx-input"
            placeholder="you@example.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={sending}
          />
        </div>
        <button type="submit" disabled={sending} className="sx-btn sx-btn-primary sx-btn-block" style={{ marginTop: 8 }}>
          {sending ? "Sending…" : <>Send a new link <Arrow /></>}
        </button>
      </form>
    </>
  );
}
