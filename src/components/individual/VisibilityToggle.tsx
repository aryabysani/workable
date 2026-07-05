"use client";

import { useTransition } from "react";
import { Badge, buttonClass } from "@/components/ui";
import { toggleMyVisibilityAction } from "@/app/individual/actions";

export function VisibilityToggle({
  studentId,
  isVisible,
}: {
  studentId: string;
  isVisible: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm text-muted">Status:</span>
      {isVisible ? <Badge tone="accent">Visible to recruiters</Badge> : <Badge tone="neutral">Hidden</Badge>}
      <button
        disabled={pending}
        onClick={() => startTransition(() => toggleMyVisibilityAction(studentId, !isVisible))}
        className={`${buttonClass("secondary")} ml-auto`}
      >
        {isVisible ? "Hide my profile" : "Make me visible"}
      </button>
    </div>
  );
}
