import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { Card, Badge } from "@/components/ui";
import { ApprovalButtons } from "@/components/admin/ApprovalButtons";
import type { Profile } from "@/lib/types";

const statusTone = { approved: "accent", pending: "clay", rejected: "danger" } as const;

export default async function AdminUsers() {
  await requireRole("admin");
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("role", { ascending: true })
    .order("created_at", { ascending: true });
  const profiles = (data ?? []) as Profile[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Accounts &amp; approvals</h1>
        <p className="text-muted">Approve or reject schools and recruiters.</p>
      </div>

      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-border/30 text-muted text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-foreground">{p.full_name}</td>
                <td className="px-4 py-3 text-muted">{p.contact_email}</td>
                <td className="px-4 py-3"><Badge tone="neutral">{p.role}</Badge></td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone[p.approval_status]}>{p.approval_status}</Badge>
                </td>
                <td className="px-4 py-3">
                  {p.role === "admin" ? (
                    <span className="text-xs text-muted">—</span>
                  ) : (
                    <ApprovalButtons profileId={p.id} status={p.approval_status} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
