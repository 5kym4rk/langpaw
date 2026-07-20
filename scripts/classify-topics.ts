/**
 * Gán chủ đề taxonomy cho toàn bộ dataset (spec P1-V):
 *   npm run classify:topics
 * Ghi topicIds/topicStatus/topicConfidence; cập nhật topic hiển thị = nhãn VN
 * của chủ đề đầu (hoặc "Chưa phân loại chủ đề"). Cấm topic "Từ điển".
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { VocabularyItem } from "../src/types/vocabulary.ts";
import { classifyTopics } from "../src/services/classification/topic-classifier.ts";
import { topicLabelVi } from "../src/config/curriculum/topics.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(ROOT, "src/data");

function findJsonFiles(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "certification") continue;
      out.push(...findJsonFiles(full));
    } else if (e.name.endsWith(".json")) out.push(full);
  }
  return out;
}

const byTopic = new Map<string, number>();
let total = 0;
let classified = 0;

for (const file of findJsonFiles(dataDir)) {
  const doc = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(doc.items)) continue;
  for (const item of doc.items as VocabularyItem[]) {
    total += 1;
    const r = classifyTopics(item);
    item.topicIds = r.topicIds;
    item.topicStatus = r.topicStatus;
    item.topicConfidence = r.topicConfidence;
    if (r.topicIds.length > 0) {
      classified += 1;
      item.topic = topicLabelVi(r.topicIds[0]);
      for (const id of r.topicIds) byTopic.set(id, (byTopic.get(id) ?? 0) + 1);
    } else {
      item.topic = "Chưa phân loại chủ đề";
    }
  }
  writeFileSync(file, JSON.stringify(doc, null, 2) + "\n", "utf8");
}

console.log(`Chủ đề: ${classified}/${total} mục được phân loại.`);
for (const [id, n] of [...byTopic].sort((a, b) => b[1] - a[1]).slice(0, 30)) {
  console.log(`  ${topicLabelVi(id)}: ${n}`);
}
