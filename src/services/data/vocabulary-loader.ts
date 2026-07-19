import type { LanguageCode, VocabularyDataset, VocabularyItem } from "@/types";

/**
 * Tải động dataset từ vựng theo ngôn ngữ. Mỗi file JSON được code-split riêng
 * nhờ import.meta.glob (không bundle toàn bộ dữ liệu lúc khởi động — §23.2).
 */
const datasetModules = import.meta.glob<{ default: VocabularyDataset }>(
  "@/data/**/*.json",
);

// Map: "en" -> danh sách đường dẫn glob của ngôn ngữ đó.
function pathsForLanguage(language: LanguageCode): string[] {
  return Object.keys(datasetModules).filter((path) =>
    path.includes(`/data/${language}/`),
  );
}

const cache = new Map<LanguageCode, VocabularyItem[]>();

export async function loadVocabulary(
  language: LanguageCode,
): Promise<VocabularyItem[]> {
  const cached = cache.get(language);
  if (cached) return cached;

  const paths = pathsForLanguage(language);
  const datasets = await Promise.all(
    paths.map((path) => datasetModules[path]()),
  );

  const items = datasets.flatMap((mod) => mod.default.items);
  cache.set(language, items);
  return items;
}

export async function loadSources(
  language: LanguageCode,
): Promise<VocabularyDataset["sources"]> {
  const paths = pathsForLanguage(language);
  const datasets = await Promise.all(
    paths.map((path) => datasetModules[path]()),
  );
  const byId = new Map<string, VocabularyDataset["sources"][number]>();
  for (const mod of datasets) {
    for (const source of mod.default.sources) byId.set(source.id, source);
  }
  return Array.from(byId.values());
}

/** Chỉ dùng trong test để reset cache. */
export function _clearVocabularyCache(): void {
  cache.clear();
}
