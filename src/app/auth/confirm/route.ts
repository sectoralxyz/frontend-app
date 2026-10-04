import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for the link in the confirmation email:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
 *
 * Verifying the token hash on the server works whichever device or browser
 * opens the email (unlike the PKCE code exchange in /auth/callback, which only
 * succeeds in the browser that started the sign-up). On success the session
 * cookies are set and the visitor lands on /auth/confirmed; anything else goes
 * to /auth/link-expired, which explains what happened and can resend the email.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error) {
      return NextResponse.redirect(`${origin}/auth/confirmed`);
    }

    const reason = error.code === "otp_expired" ? "expired" : "invalid";
    return NextResponse.redirect(`${origin}/auth/link-expired?reason=${reason}`);
  }

  return NextResponse.redirect(`${origin}/auth/link-expired?reason=invalid`);
}
