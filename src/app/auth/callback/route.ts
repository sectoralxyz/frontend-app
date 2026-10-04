import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

/**
 * PKCE return path (the `emailRedirectTo` passed at sign-up). Supabase sends
 * the visitor here with `?code=` after verifying the email, or with
 * `?error_code=` when the link was expired or already used. The confirmation
 * email itself links to /auth/confirm, which also works across devices; this
 * route stays for links issued through the default flow.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorCode = searchParams.get("error_code");

  if (errorCode) {
    const reason = errorCode === "otp_expired" ? "expired" : "invalid";
    return NextResponse.redirect(`${origin}/auth/link-expired?reason=${reason}`);
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}/auth/confirmed`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/link-expired?reason=invalid`);
}
