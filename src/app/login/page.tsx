import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/LoginForm";
import { Card } from "@/components/ui";
import { Logo } from "@/components/Logo";
import { getSessionProfile, dashboardPath } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getSessionProfile();
  if (session) redirect(dashboardPath(session.profile.role));

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex justify-center mb-6" aria-label="WorkAble home">
          <Logo textSize="text-[21px]" />
        </Link>
        <Card>
          <h1 className="text-xl font-semibold text-foreground mb-1">Welcome back</h1>
          <p className="text-sm text-muted mb-6">Sign in to your account.</p>
          <LoginForm />
        </Card>
        <p className="text-center text-sm text-muted mt-5">
          New here?{" "}
          <Link href="/register" className="text-accent font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
