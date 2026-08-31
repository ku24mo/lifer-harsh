import { Nav, ContentShell } from "@/components/Nav";
import { ManifestoTicker } from "@/components/ManifestoTicker";
import { JournalBook } from "@/components/JournalBook";
import { getDay, getJournalEntries } from "@/lib/data";
import { dateKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const today = dateKey(new Date());
  const [todayDay, pastEntries] = await Promise.all([
    getDay(today),
    getJournalEntries(),
  ]);

  return (
    <>
      <Nav />
      <ContentShell>
        <ManifestoTicker variant="fullwidth" />
        <div className="mx-auto max-w-2xl px-5 sm:px-8 py-8 sm:py-12">
          <div className="mb-8">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-black/40">
              journal
            </div>
            <h1 className="mt-1 text-[36px] font-bold tracking-tighter leading-[0.9] text-black">
              The Book
            </h1>
          </div>
          <JournalBook
            today={today}
            todayDay={todayDay}
            pastEntries={pastEntries}
          />
        </div>
      </ContentShell>
    </>
  );
}
