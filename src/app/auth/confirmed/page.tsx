import Link from "next/link";
import { AuthShell, AuthSuccessMark } from "@/components/AuthShell";
import { Arrow } from "@/components/sx";

export default function EmailConfirmedPage() {
  return (
    <AuthShell eyebrow="Email verified" title="Your account is ready." width={440}>
      <AuthSuccessMark />
      <p className="sx-body" style={{ margin: 0 }}>
        Your address checks out, the account is active and you're signed in. Head to the app to start banking where your affairs stay your own.
      </p>
      <div className="flex flex-col" style={{ gap: 10, marginTop: 28 }}>
        <Link href="/app" className="sx-btn sx-btn-primary sx-btn-block">
          Go to the app <Arrow />
        </Link>
        <Link href="/" className="sx-btn sx-btn-secondary sx-btn-block">
          Return to the site
        </Link>
      </div>
    </AuthShell>
  );
}
