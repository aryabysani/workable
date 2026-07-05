import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card, Badge, buttonClass } from "@/components/ui";
import { UnlockButton } from "@/components/recruiter/UnlockButton";
import type { Student, StudentContact } from "@/lib/types";

export default async function StudentDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId, profile } = await requireRole("recruiter");
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .single();
  if (!student) notFound();
  const s = student as Student;

  // School name (public-ish to recruiters)
  const { data: school } = await supabase
    .from("schools")
    .select("name, location")
    .eq("id", s.school_id)
    .single();

  // Already unlocked?
  const { data: unlock } = await supabase
    .from("contact_unlocks")
    .select("id")
    .eq("recruiter_id", userId)
    .eq("student_id", id)
    .maybeSingle();

  // RLS lets us read the contact only when an unlock exists.
  let contact: StudentContact | null = null;
  if (unlock) {
    const { data } = await supabase
      .from("student_contacts")
      .select("*")
      .eq("student_id", id)
      .maybeSingle();
    contact = (data as StudentContact) ?? null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Link href="/recruiter" className={buttonClass("ghost")}>← Back to search</Link>

      <Card>
        <div className="flex items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.photo_url ?? `https://api.dicebear.com/9.x/thumbs/svg?seed=${s.id}`}
            alt=""
            className="w-20 h-20 rounded-2xl bg-border object-cover"
          />
          <div>
            <h1 className="text-2xl font-bold text-foreground">{s.name}</h1>
            <p className="text-muted">
              {s.age ? `${s.age} yrs` : "Age —"}
              {s.preferred_location ? ` · prefers ${s.preferred_location}` : ""}
              {s.preferred_timing ? ` · ${s.preferred_timing}` : ""}
            </p>
            {school && (
              <p className="text-sm text-muted mt-1">
                From <span className="font-medium text-foreground">{school.name}</span>
                {school.location ? `, ${school.location}` : ""}
              </p>
            )}
          </div>
        </div>

        {s.bio && <p className="mt-5 text-foreground leading-relaxed">{s.bio}</p>}

        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted mb-2">Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {s.skills.map((sk) => <Badge key={sk}>{sk}</Badge>)}
            </div>
          </div>
          {s.training_completed && (
            <div>
              <h3 className="text-sm font-medium text-muted mb-2">Training completed</h3>
              <p className="text-foreground">{s.training_completed}</p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-foreground mb-1">Contact details</h2>
        {contact ? (
          <div className="mt-3 space-y-2 text-foreground">
            <Badge tone="accent">Unlocked</Badge>
            <p><span className="text-muted">Source:</span> {school?.name ?? "Self-registered candidate"}</p>
            <p><span className="text-muted">Guardian / contact:</span> {contact.guardian_name ?? "—"}</p>
            <p><span className="text-muted">Phone:</span> {contact.contact_phone ?? "—"}</p>
            <p><span className="text-muted">Email:</span> {contact.contact_email ?? "—"}</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted mb-4">
              Unlock to reveal the school and guardian contact details. The school
              will see that you viewed this candidate.
            </p>
            {profile.approval_status === "approved" ? (
              <UnlockButton studentId={s.id} />
            ) : (
              <p className="text-sm text-amber bg-amber-soft rounded-xl px-3.5 py-2.5">
                Your account must be approved by a Rotary admin before you can unlock contacts.
              </p>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
