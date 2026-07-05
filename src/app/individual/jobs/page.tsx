import { requireRole } from "@/lib/auth";
import { JobBrowser } from "@/components/JobBrowser";

export default async function IndividualJobs({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole("individual");
  const sp = await searchParams;
  return <JobBrowser searchParams={sp} basePath="/individual/jobs" />;
}
