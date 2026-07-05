"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { unlockContactAction } from "@/app/recruiter/actions";
import { buttonClass } from "@/components/ui";

export function UnlockButton({ studentId }: { studentId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const router = useRouter();

  return (
    <div className="space-y-2">
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await unlockContactAction(studentId);
            if (res?.error) setError(res.error);
            else router.refresh();
          })
        }
        className={buttonClass("primary")}
      >
        {pending ? "Unlocking…" : "Unlock contact details"}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
