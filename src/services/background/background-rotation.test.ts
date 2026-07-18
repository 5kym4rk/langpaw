import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  pickNextBackground,
  createBackgroundRotator,
  type BackgroundEntry,
} from "./background-rotation";
import { APP_CONFIG } from "@/config/app";

function bg(id: string, enabled = true): BackgroundEntry {
  return {
    id,
    title: id,
    videoSrc: `${id}.webm`,
    posterSrc: `${id}.jpg`,
    author: "test",
    sourceUrl: "",
    license: "test",
    enabled,
  };
}

describe("pickNextBackground", () => {
  it("trả null khi không có nền bật", () => {
    expect(pickNextBackground(null, [bg("a", false)])).toBeNull();
  });

  it("không lặp lại nền hiện tại khi có ≥2 nền", () => {
    const list = [bg("a"), bg("b"), bg("c")];
    for (let i = 0; i < 20; i += 1) {
      const next = pickNextBackground("a", list, Math.random);
      expect(next?.id).not.toBe("a");
    }
  });

  it("trả về chính nó khi chỉ có một nền", () => {
    expect(pickNextBackground("a", [bg("a")])?.id).toBe("a");
  });
});

describe("createBackgroundRotator (fake timers)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const list = [bg("a"), bg("b"), bg("c")];

  it("đổi nền sau đúng 600.000 ms, không đổi trước đó", () => {
    const onChange = vi.fn();
    const rotator = createBackgroundRotator({
      backgrounds: list,
      intervalMs: APP_CONFIG.backgroundRotationMs,
      onChange,
      random: () => 0,
      initialId: "a",
    });
    rotator.start();
    onChange.mockClear(); // bỏ qua lần hiển thị ban đầu (nếu có)

    vi.advanceTimersByTime(APP_CONFIG.backgroundRotationMs - 1);
    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("không lặp ngay nền hiện tại khi đổi", () => {
    const changes: string[] = [];
    const rotator = createBackgroundRotator({
      backgrounds: list,
      intervalMs: 1000,
      onChange: (e) => changes.push(e.id),
      random: () => 0,
      initialId: "a",
    });
    rotator.start();
    vi.advanceTimersByTime(3000);
    for (let i = 1; i < changes.length; i += 1) {
      expect(changes[i]).not.toBe(changes[i - 1]);
    }
  });

  it("chỉ có một timer hoạt động dù gọi start nhiều lần", () => {
    const onChange = vi.fn();
    const rotator = createBackgroundRotator({
      backgrounds: list,
      intervalMs: 1000,
      onChange,
      random: () => 0,
      initialId: "a",
    });
    rotator.start();
    rotator.start();
    rotator.start();
    onChange.mockClear();
    vi.advanceTimersByTime(1000);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("dừng timer khi stop()", () => {
    const onChange = vi.fn();
    const rotator = createBackgroundRotator({
      backgrounds: list,
      intervalMs: 1000,
      onChange,
      random: () => 0,
      initialId: "a",
    });
    rotator.start();
    expect(rotator.isRunning()).toBe(true);
    rotator.stop();
    expect(rotator.isRunning()).toBe(false);
    onChange.mockClear();
    vi.advanceTimersByTime(5000);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("không tạo timer khi chỉ có một nền", () => {
    const rotator = createBackgroundRotator({
      backgrounds: [bg("a")],
      intervalMs: 1000,
      onChange: vi.fn(),
      random: () => 0,
    });
    rotator.start();
    expect(rotator.isRunning()).toBe(false);
  });
});
