"use client";

import { useTransition } from "react";
import { buttonClass } from "@/components/ui";
import { setApprovalAction } from "@/app/admin/actions";
import type { ApprovalStatus } from "@/lib/types";

export function ApprovalButtons({
  profileId,
  status,
}: {
  profileId: string;
  status: ApprovalStatus;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      {status !== "approved" && (
        <button
          disabled={pending}
          onClick={() => startTransition(() => setApprovalAction(profileId, "approved"))}
          className={buttonClass("secondary")}
        >
          Approve
        </button>
      )}
      {status !== "rejected" && (
        <button
          disabled={pending}
          onClick={() => startTransition(() => setApprovalAction(profileId, "rejected"))}
          className={buttonClass("danger")}
        >
          Reject
        </button>
      )}
      {status === "rejected" && (
        <button
          disabled={pending}
          onClick={() => startTransition(() => setApprovalAction(profileId, "pending"))}
          className={buttonClass("ghost")}
        >
          Reset
        </button>
      )}
    </div>
  );
}
