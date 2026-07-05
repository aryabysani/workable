import type { ApprovalStatus } from "@/lib/types";

export function PendingBanner({ status }: { status: ApprovalStatus }) {
  if (status === "approved") return null;
  const rejected = status === "rejected";
  return (
    <div
      className={`rounded-2xl px-4 py-3 text-sm ${
        rejected ? "bg-danger-soft text-danger" : "bg-amber-soft text-amber"
      }`}
      role="status"
    >
      {rejected ? (
        <>Your account was not approved. Please contact the Rotary admin team.</>
      ) : (
        <>
          <strong>Awaiting approval.</strong> A Rotary admin is reviewing your
          account. You can set things up now — full access unlocks once approved.
        </>
      )}
    </div>
  );
}
