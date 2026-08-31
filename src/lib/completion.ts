import { blocksForDay } from "@/lib/rhythm";
import { parseDateKey } from "@/lib/utils";
import type { BlockCompletionRow } from "@/lib/types";

/**
 * Completion percentage for a single date, accounting for blocks that apply
 * to that weekday (gym hidden on weekends, not counted as missed).
 *
 * Pure function — safe to import from client or server.
 */
export function completionPctForDate(
  date: string,
  blocks: BlockCompletionRow[]
): number {
  const d = parseDateKey(date);
  const applicable = blocksForDay(d.getDay());
  if (applicable.length === 0) return 100;
  const completedKeys = new Set(
    blocks.filter((b) => b.completed).map((b) => b.block_key)
  );
  const done = applicable.filter((b) => completedKeys.has(b.key)).length;
  return Math.round((done / applicable.length) * 100);
}
