import { Card } from "@/components/ui";
import { JobForm } from "@/components/recruiter/JobForm";
import { requireRole } from "@/lib/auth";

export default async function NewJobPage() {
  const { profile } = await requireRole("recruiter");
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Post a job</h1>
      {profile.approval_status !== "approved" && (
        <p className="text-sm text-amber bg-amber-soft rounded-xl px-3.5 py-2.5">
          Your account must be approved before listings go live.
        </p>
      )}
      <Card>
        <JobForm />
      </Card>
    </div>
  );
}
