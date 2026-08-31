import { Nav, ContentShell } from "@/components/Nav";
import { ReviewView } from "@/components/ReviewView";
import { getWeeklyReview } from "@/lib/data";
import { dateKey, parseDateKey, startOfWeek } from "@/lib/utils";

export const dynamic = "force-dynamic";

function resolveWeekStart(param: string | undefined): string {
  if (!param) return dateKey(startOfWeek(new Date()));
  const d = parseDateKey(param);
  if (isNaN(d.getTime())) return dateKey(startOfWeek(new Date()));
  return dateKey(startOfWeek(d));
}

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const weekStart = resolveWeekStart(
    typeof params.week === "string" ? params.week : undefined
  );
  const review = await getWeeklyReview(weekStart);

  return (
    <>
      <Nav />
      <ContentShell>
        <ReviewView weekStart={weekStart} review={review} />
      </ContentShell>
    </>
  );
}
