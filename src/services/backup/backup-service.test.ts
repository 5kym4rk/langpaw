import { describe, it, expect } from "vitest";
import {
  parseBackup,
  serializeBackup,
  mergeProgressLists,
  computeImportSummary,
  backupFileName,
  type LangPawBackup,
} from "./backup-service";
import { createInitialProgress } from "@/services/srs/progress-factory";
import { DEFAULT_SETTINGS } from "@/stores/settings-store";

function sampleBackup(): LangPawBackup {
  return {
    app: "LangPaw",
    schemaVersion: 1,
    exportedAt: "2026-07-18T00:00:00.000Z",
    settings: DEFAULT_SETTINGS,
    progress: [createInitialProgress("en-0001")],
    dailyStats: [],
  };
}

describe("parseBackup", () => {
  it("chấp nhận backup hợp lệ", () => {
    const text = serializeBackup(sampleBackup());
    const result = parseBackup(text);
    expect(result.ok).toBe(true);
  });

  it("từ chối JSON sai định dạng", () => {
    const result = parseBackup("{ not json");
    expect(result).toEqual({
      ok: false,
      error: "File không phải JSON hợp lệ.",
    });
  });

  it("từ chối cấu trúc không hợp lệ", () => {
    const result = parseBackup(JSON.stringify({ app: "Other" }));
    expect(result.ok).toBe(false);
  });

  it("báo lỗi rõ khi phiên bản không hỗ trợ", () => {
    const bad = { ...sampleBackup(), schemaVersion: 99 };
    const result = parseBackup(JSON.stringify(bad));
    expect(result).toEqual({
      ok: false,
      error: "Phiên bản backup không được hỗ trợ.",
    });
  });

  it("export rồi import khôi phục dữ liệu tương đương", () => {
    const backup = sampleBackup();
    const result = parseBackup(serializeBackup(backup));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.progress).toEqual(backup.progress);
      expect(result.data.settings.targetLanguage).toBe(
        backup.settings.targetLanguage,
      );
    }
  });
});

describe("mergeProgressLists", () => {
  it("bản nhập ghi đè theo id, giữ các id khác", () => {
    const existing = [
      { ...createInitialProgress("a"), correctCount: 1 },
      { ...createInitialProgress("b"), correctCount: 2 },
    ];
    const incoming = [{ ...createInitialProgress("a"), correctCount: 9 }];
    const merged = mergeProgressLists(existing, incoming);
    expect(merged).toHaveLength(2);
    expect(merged.find((p) => p.vocabularyId === "a")?.correctCount).toBe(9);
    expect(merged.find((p) => p.vocabularyId === "b")?.correctCount).toBe(2);
  });
});

describe("computeImportSummary", () => {
  it("đếm bản ghi thêm mới và ghi đè", () => {
    const existing = [createInitialProgress("a"), createInitialProgress("b")];
    const incoming = [
      createInitialProgress("b"), // ghi đè
      createInitialProgress("c"), // thêm mới
    ];
    const summary = computeImportSummary(existing, incoming);
    expect(summary).toEqual({ added: 1, overwritten: 1, total: 2 });
  });

  it("chế độ thay thế (existing rỗng) coi mọi bản ghi là thêm mới", () => {
    const incoming = [createInitialProgress("a"), createInitialProgress("b")];
    expect(computeImportSummary([], incoming)).toEqual({
      added: 2,
      overwritten: 0,
      total: 2,
    });
  });
});

describe("backupFileName", () => {
  it("có định dạng ngày", () => {
    expect(backupFileName(new Date("2026-07-18T10:00:00"))).toBe(
      "langpaw-backup-2026-07-18.json",
    );
  });
});
