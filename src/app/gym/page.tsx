import { Nav, ContentShell } from "@/components/Nav";
import { ManifestoTicker } from "@/components/ManifestoTicker";
import { GymView } from "@/components/GymView";
import { getGymCompletions, getBlocksForDate } from "@/lib/data";
import { dateKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GymPage() {
  const today = dateKey(new Date());
  const [completions, blocks] = await Promise.all([
    getGymCompletions(today),
    getBlocksForDate(today),
  ]);

  const gymBlockCompletion = blocks.find((b) => b.block_key === "gym") ?? null;

  return (
    <>
      <Nav />
      <ContentShell>
        <ManifestoTicker variant="fullwidth" />
        <div className="mx-auto max-w-2xl px-5 sm:px-8 py-8 sm:py-12">
          <div className="mb-8">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-black/40">
              training
            </div>
            <h1 className="mt-1 text-[36px] font-bold tracking-tighter leading-[0.9] text-black">
              The Iron
            </h1>
          </div>
          <GymView
            date={today}
            initialCompletions={completions}
            initialBlockCompletion={gymBlockCompletion}
          />
        </div>
      </ContentShell>
    </>
  );
}
