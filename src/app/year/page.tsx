import { Nav, ContentShell } from "@/components/Nav";
import { YearView } from "@/components/YearView";
import { getDayBundleRange, getStickyNotesRange } from "@/lib/data";
import { dateKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function YearPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const now = new Date();
  const yParam = typeof params.y === "string" ? params.y : undefined;
  const year = yParam ? parseInt(yParam, 10) : now.getFullYear();
  const safeYear = isNaN(year) || year < 2000 || year > 2100 ? now.getFullYear() : year;

  const start = dateKey(new Date(safeYear, 0, 1));
  const end = dateKey(new Date(safeYear, 11, 31));
  const [bundle, stickyNotes] = await Promise.all([
    getDayBundleRange(start, end),
    getStickyNotesRange(start, end),
  ]);

  return (
    <>
      <Nav />
      <ContentShell>
        <YearView year={safeYear} bundle={bundle} stickyNotes={stickyNotes} />
      </ContentShell>
    </>
  );
}
