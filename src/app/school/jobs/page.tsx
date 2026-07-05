import { requireRole } from "@/lib/auth";
import { JobBrowser } from "@/components/JobBrowser";

export default async function SchoolJobs({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole("school");
  const sp = await searchParams;
  return <JobBrowser searchParams={sp} basePath="/school/jobs" />;
}
