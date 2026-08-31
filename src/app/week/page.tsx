import { Nav, ContentShell } from "@/components/Nav";
import { WeekView } from "@/components/WeekView";
import { getDayBundleRange, getStickyNotesRange } from "@/lib/data";
import { dateKey, parseDateKey, startOfWeek, addDays } from "@/lib/utils";

export const dynamic = "force-dynamic";

function resolveWeekStart(param: string | undefined): string {
  if (!param) return dateKey(startOfWeek(new Date()));
  const d = parseDateKey(param);
  if (isNaN(d.getTime())) return dateKey(startOfWeek(new Date()));
  return dateKey(startOfWeek(d));
}

export default async function WeekPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const weekStart = resolveWeekStart(
    typeof params.week === "string" ? params.week : undefined
  );
  const weekEnd = dateKey(addDays(parseDateKey(weekStart), 6));
  const [bundle, stickyNotes] = await Promise.all([
    getDayBundleRange(weekStart, weekEnd),
    getStickyNotesRange(weekStart, weekEnd),
  ]);

  return (
    <>
      <Nav />
      <ContentShell>
        <WeekView weekStart={weekStart} bundle={bundle} stickyNotes={stickyNotes} />
      </ContentShell>
    </>
  );
}
