import { Nav, ContentShell } from "@/components/Nav";
import { DayView } from "@/components/DayView";
import { getDayBundle, getStickyNotes, getHealthAverages } from "@/lib/data";
import { dateKey, parseDateKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

function resolveDate(param: string | undefined): string {
  if (!param) return dateKey(new Date());
  const d = parseDateKey(param);
  if (isNaN(d.getTime())) return dateKey(new Date());
  return param;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const date = resolveDate(
    typeof params.date === "string" ? params.date : undefined
  );
  const [{ day, blocks }, stickyNotes, healthAverages] = await Promise.all([
    getDayBundle(date),
    getStickyNotes(date),
    getHealthAverages(date),
  ]);

  return (
    <>
      <Nav />
      <ContentShell>
        <DayView
          date={date}
          day={day}
          blocks={blocks}
          stickyNotes={stickyNotes}
          healthAverages={healthAverages}
        />
      </ContentShell>
    </>
  );
}
