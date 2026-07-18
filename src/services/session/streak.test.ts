import { describe, it, expect } from "vitest";
import { computeStreak } from "./streak";
import { recentDateKeys } from "@/utils/date";

const today = new Date("2026-07-18T12:00:00");

describe("computeStreak", () => {
  it("trả 0 khi chưa học ngày nào", () => {
    expect(computeStreak([], today)).toBe(0);
  });

  it("đếm chuỗi ngày liên tiếp gồm hôm nay", () => {
    const keys = recentDateKeys(3, today); // 3 ngày liên tiếp tới hôm nay
    expect(computeStreak(keys, today)).toBe(3);
  });

  it("không tính streak nếu có khoảng trống", () => {
    const keys = recentDateKeys(5, today);
    // Bỏ ngày hôm qua (index cuối - 1) để tạo khoảng trống.
    keys.splice(3, 1);
    expect(computeStreak(keys, today)).toBe(1); // chỉ còn hôm nay
  });

  it("giữ streak khi hôm nay chưa học nhưng hôm qua có", () => {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const keys = recentDateKeys(3, yesterday); // liên tiếp tới hôm qua
    expect(computeStreak(keys, today)).toBe(3);
  });
});
