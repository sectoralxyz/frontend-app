import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { ResendForm } from "./ResendForm";

/* Where a confirmation link lands when it can't be used: expired, already
   used, or malformed. Explains what happened and offers a fresh email. */
export default async function LinkExpiredPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const expired = reason === "expired";

  return (
    <AuthShell
      eyebrow="Confirmation link"
      title={expired ? "This link has expired." : "This link didn't work."}
      subtitle={
        expired
          ? "Confirmation links only stay valid for a short while. Send yourself a new one below."
          : "It may have been used already, or copied only in part. If you've already confirmed, just sign in. Otherwise, request a new link."
      }
      width={440}
      footer={
        <>
          Already confirmed? <Link href="/login">Sign in</Link>
        </>
      }
    >
      <ResendForm />
    </AuthShell>
  );
}
