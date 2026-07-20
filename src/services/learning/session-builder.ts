/**
 * Bộ dựng phiên học (spec P1-VII). Thứ tự ưu tiên: đến hạn ôn → từ yếu →
 * từ mới → đang học → đã học. Trong cùng nhóm: confidence cao trước, tránh
 * trùng term liền kề, phân bố đều chủ đề. "Ngẫu nhiên" chỉ xáo trong từng
 * nhóm ưu tiên — không phá thứ tự SRS.
 */
import type { VocabularyItem, VocabularyProgress } from "@/types";
import { shuffle } from "@/services/data/vocabulary-filters";

type Group = 0 | 1 | 2 | 3 | 4; // 0 = ưu tiên cao nhất

function groupOf(
  _item: VocabularyItem,
  progress: VocabularyProgress | undefined,
  nowMs: number,
): Group {
  if (
    progress?.nextReviewAt &&
    new Date(progress.nextReviewAt).getTime() <= nowMs
  ) {
    return 0; // đến hạn ôn
  }
  if (progress?.markedWeak) return 1; // từ yếu
  if (!progress || progress.state === "new") return 2; // từ mới
  if (progress.state === "learning") return 3; // đang học
  return 4; // đã học/thuộc
}

/** Sắp trong nhóm: confidence cao trước, rồi theo id để ổn định. */
function inGroupCompare(a: VocabularyItem, b: VocabularyItem): number {
  const ca = a.topicConfidence ?? 0;
  const cb = b.topicConfidence ?? 0;
  if (cb !== ca) return cb - ca;
  return a.id.localeCompare(b.id);
}

/**
 * Đa dạng hóa: tránh hai mục cùng term (hai sense của cùng headword) trong
 * một phiên, và phân bố đều chủ đề bằng round-robin theo topic.
 */
export function diversifySession(
  ranked: VocabularyItem[],
  size: number,
): VocabularyItem[] {
  const seenTerms = new Set<string>();
  const byTopic = new Map<string, VocabularyItem[]>();
  const order: string[] = [];
  for (const item of ranked) {
    if (seenTerms.has(item.term)) continue; // không 2 sense cùng headword
    seenTerms.add(item.term);
    const t = item.topicIds?.[0] ?? item.topic ?? "";
    if (!byTopic.has(t)) {
      byTopic.set(t, []);
      order.push(t);
    }
    byTopic.get(t)!.push(item);
  }
  const out: VocabularyItem[] = [];
  let added = true;
  while (out.length < size && added) {
    added = false;
    for (const t of order) {
      const q = byTopic.get(t)!;
      if (q.length > 0 && out.length < size) {
        out.push(q.shift()!);
        added = true;
      }
    }
  }
  return out;
}

export interface BuildSessionOptions {
  size: number;
  /** Xáo trộn TRONG từng nhóm ưu tiên (không phá SRS). */
  shuffleWithinGroups?: boolean;
  nowMs?: number;
  random?: () => number;
}

/**
 * Dựng phiên học theo ưu tiên SRS. `candidates` đã qua filterVocabulary
 * (route/level/topic/scope/review) — hàm này chỉ xếp hạng + đa dạng hóa.
 */
export function buildLearningSession(
  candidates: VocabularyItem[],
  progressMap: Map<string, VocabularyProgress>,
  options: BuildSessionOptions,
): VocabularyItem[] {
  const { size, shuffleWithinGroups = false, nowMs = Date.now() } = options;
  const groups: VocabularyItem[][] = [[], [], [], [], []];
  for (const item of candidates) {
    groups[groupOf(item, progressMap.get(item.id), nowMs)].push(item);
  }
  const ranked: VocabularyItem[] = [];
  for (const g of groups) {
    g.sort(inGroupCompare);
    ranked.push(...(shuffleWithinGroups ? shuffle(g, options.random) : g));
  }
  return diversifySession(ranked, size);
}
