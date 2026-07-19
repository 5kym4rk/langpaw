import type { VocabularyItem, VocabularyProgress } from "@/types";

export type LibraryStatus =
  | "all"
  | "new"
  | "learning"
  | "review"
  | "mastered"
  | "favorite"
  | "weak"
  | "due";

export interface LibraryFilter {
  query?: string;
  status?: LibraryStatus;
}

function matchesQuery(item: VocabularyItem, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return (
    item.term.toLowerCase().includes(needle) ||
    item.meaningVi.toLowerCase().includes(needle) ||
    (item.reading ?? "").toLowerCase().includes(needle) ||
    (item.romanization ?? "").toLowerCase().includes(needle) ||
    item.topic.toLowerCase().includes(needle)
  );
}

function matchesStatus(
  progress: VocabularyProgress | undefined,
  status: LibraryStatus,
  nowMs: number,
): boolean {
  switch (status) {
    case "all":
      return true;
    case "favorite":
      return Boolean(progress?.favorite);
    case "weak":
      return Boolean(progress?.markedWeak);
    case "due":
      return Boolean(
        progress?.nextReviewAt &&
        new Date(progress.nextReviewAt).getTime() <= nowMs,
      );
    case "new":
      return !progress || progress.state === "new";
    default:
      return progress?.state === status;
  }
}

/**
 * Lọc từ vựng cho trang Kho từ theo từ khóa và trạng thái. Pure function.
 */
export function filterLibrary(
  items: VocabularyItem[],
  progressMap: Map<string, VocabularyProgress>,
  filter: LibraryFilter,
  now: Date = new Date(),
): VocabularyItem[] {
  const nowMs = now.getTime();
  const status = filter.status ?? "all";
  const query = filter.query ?? "";
  return items.filter(
    (item) =>
      matchesQuery(item, query) &&
      matchesStatus(progressMap.get(item.id), status, nowMs),
  );
}
