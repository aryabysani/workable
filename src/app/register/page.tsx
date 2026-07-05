import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { Card } from "@/components/ui";
import { Logo } from "@/components/Logo";
import { getSessionProfile, dashboardPath } from "@/lib/auth";

export default async function RegisterPage() {
  const session = await getSessionProfile();
  if (session) redirect(dashboardPath(session.profile.role));

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex justify-center mb-6" aria-label="WorkAble home">
          <Logo textSize="text-[21px]" />
        </Link>
        <Card>
          <h1 className="text-xl font-semibold text-foreground mb-1">Create your account</h1>
          <p className="text-sm text-muted mb-6">Join the inclusive hiring network.</p>
          <RegisterForm />
        </Card>
        <p className="text-center text-sm text-muted mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-accent font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
