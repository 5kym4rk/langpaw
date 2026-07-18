import { useCallback, useEffect, useRef, useState } from "react";
import type { VocabularyItem } from "@/types";
import { LANGUAGES, VIETNAMESE_SPEECH_LOCALE } from "@/config/languages";
import { speechService } from "@/services/speech/speech-service";
import { useSettingsStore } from "@/stores/settings-store";

export type AutoLearnStatus = "idle" | "playing" | "paused";

export interface AutoLearnState {
  status: AutoLearnStatus;
  index: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  next: () => void;
  previous: () => void;
}

/**
 * Chế độ học tự động (§11). Dùng một vòng lặp bất đồng bộ có cờ hủy thay vì
 * nhiều setTimeout không quản lý. Mọi timeout được lưu và hủy khi dừng/unmount;
 * gọi speechService.cancel() khi đổi từ, dừng hoặc unmount.
 */
export function useAutoLearn(
  items: VocabularyItem[],
  onIndexChange?: (index: number) => void,
): AutoLearnState {
  const settings = useSettingsStore((s) => s.settings);
  const [status, setStatus] = useState<AutoLearnStatus>("idle");
  const [index, setIndex] = useState(0);

  const runIdRef = useRef(0); // Tăng lên để hủy vòng lặp đang chạy.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const delay = (ms: number, runId: number) =>
    new Promise<void>((resolve) => {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        resolve();
      }, ms);
      void runId;
    });

  const stopInternal = useCallback(() => {
    runIdRef.current += 1;
    clearTimer();
    speechService.cancel();
  }, []);

  const runFrom = useCallback(
    async (startIndex: number) => {
      const runId = ++runIdRef.current;
      const alive = () => runId === runIdRef.current;

      for (let i = startIndex; i < itemsRef.current.length; i += 1) {
        if (!alive()) return;
        setIndex(i);
        onIndexChange?.(i);
        const item = itemsRef.current[i];
        const cfg = settingsRef.current;
        const locale = LANGUAGES[item.language].speechLocale;

        for (let rep = 0; rep < Math.max(1, cfg.repeatCount); rep += 1) {
          if (!alive()) return;
          speechService.cancel();
          if (cfg.speechEnabled) {
            await speechService.speak(item.term, {
              lang: locale,
              rate: cfg.speechRate,
              pitch: cfg.speechPitch,
              volume: cfg.speechVolume,
              voiceURI: cfg.speechVoiceURI,
            });
          }
          if (!alive()) return;
          await delay(cfg.pauseMs, runId);
          if (!alive()) return;

          if (cfg.speechEnabled && cfg.showExample && item.example) {
            await speechService.speak(item.term, {
              lang: locale,
              rate: cfg.speechRate * 0.9,
            });
            if (!alive()) return;
            await delay(Math.floor(cfg.pauseMs / 2), runId);
          }
        }

        // Đọc nghĩa tiếng Việt nếu bật (best-effort, có thể không có giọng vi).
        if (alive() && cfg.speechEnabled && cfg.showMeaning) {
          await speechService.speak(item.meaningVi, {
            lang: VIETNAMESE_SPEECH_LOCALE,
            rate: cfg.speechRate,
          });
          if (!alive()) return;
          await delay(Math.floor(cfg.pauseMs / 2), runId);
        }
      }

      if (alive()) setStatus("idle");
    },
    [onIndexChange],
  );

  const start = useCallback(() => {
    if (itemsRef.current.length === 0) return;
    setStatus("playing");
    void runFrom(0);
  }, [runFrom]);

  const stop = useCallback(() => {
    stopInternal();
    setStatus("idle");
    setIndex(0);
  }, [stopInternal]);

  const pause = useCallback(() => {
    stopInternal();
    setStatus("paused");
  }, [stopInternal]);

  const resume = useCallback(() => {
    setStatus("playing");
    void runFrom(index);
  }, [runFrom, index]);

  const next = useCallback(() => {
    const target = Math.min(index + 1, itemsRef.current.length - 1);
    stopInternal();
    if (status === "playing") {
      setStatus("playing");
      void runFrom(target);
    } else {
      setIndex(target);
      onIndexChange?.(target);
    }
  }, [index, status, runFrom, stopInternal, onIndexChange]);

  const previous = useCallback(() => {
    const target = Math.max(index - 1, 0);
    stopInternal();
    if (status === "playing") {
      setStatus("playing");
      void runFrom(target);
    } else {
      setIndex(target);
      onIndexChange?.(target);
    }
  }, [index, status, runFrom, stopInternal, onIndexChange]);

  // Tạm dừng khi tab bị ẩn (§11.3), không tạo nhiều timer.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        stopInternal();
        setStatus((s) => (s === "playing" ? "paused" : s));
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [stopInternal]);

  // Cleanup khi unmount: hủy timer và speech.
  useEffect(() => {
    return () => {
      stopInternal();
    };
  }, [stopInternal]);

  return { status, index, start, pause, resume, stop, next, previous };
}
