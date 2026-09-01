import { Nav, ContentShell } from "@/components/Nav";
import { MonthView } from "@/components/MonthView";
import { getDayBundleRange, getStickyNotesRange } from "@/lib/data";
import { dateKey, parseDateKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

function resolveYearMonth(
  yParam: string | undefined,
  mParam: string | undefined
): { year: number; month: number } {
  const today = parseDateKey(dateKey(new Date())); // IST date
  const y = yParam ? parseInt(yParam, 10) : today.getFullYear();
  const m = mParam ? parseInt(mParam, 10) - 1 : today.getMonth();
  if (isNaN(y) || y < 2000 || y > 2100) return { year: today.getFullYear(), month: today.getMonth() };
  if (isNaN(m) || m < 0 || m > 11) return { year: y, month: today.getMonth() };
  return { year: y, month: m };
}

export default async function MonthPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { year, month } = resolveYearMonth(
    typeof params.y === "string" ? params.y : undefined,
    typeof params.m === "string" ? params.m : undefined
  );
  const start = dateKey(new Date(year, month, 1));
  const end = dateKey(new Date(year, month + 1, 0));
  const [bundle, stickyNotes] = await Promise.all([
    getDayBundleRange(start, end),
    getStickyNotesRange(start, end),
  ]);

  return (
    <>
      <Nav />
      <ContentShell>
        <MonthView year={year} month={month} bundle={bundle} stickyNotes={stickyNotes} />
      </ContentShell>
    </>
  );
}
