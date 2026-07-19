import { useCallback, useEffect, useRef } from "react";

/**
 * Đo thời gian học thực (§3.6): chỉ cộng dồn khoảng thời gian tab đang hiển thị
 * và phiên đang chạy. Tự loại trừ lúc tab ẩn / app ở background. Không tính khi
 * chưa `start()` hoặc đã `stop()`.
 *
 * Trả về hàm điều khiển và `elapsed()` đọc tổng ms hoạt động tới hiện tại.
 */
export function useStudyTimer() {
  const activeMsRef = useRef(0);
  const segmentStartRef = useRef<number | null>(null); // null = đang không đếm

  const flush = useCallback(() => {
    if (segmentStartRef.current !== null) {
      activeMsRef.current += Date.now() - segmentStartRef.current;
      segmentStartRef.current = null;
    }
  }, []);

  const resume = useCallback(() => {
    if (segmentStartRef.current === null && !document.hidden) {
      segmentStartRef.current = Date.now();
    }
  }, []);

  /** Bắt đầu đo lại từ 0. */
  const start = useCallback(() => {
    activeMsRef.current = 0;
    segmentStartRef.current = document.hidden ? null : Date.now();
  }, []);

  /** Dừng hẳn và trả về tổng ms hoạt động. */
  const stop = useCallback(() => {
    flush();
    return activeMsRef.current;
  }, [flush]);

  /** Đọc tổng ms hoạt động mà không dừng. */
  const elapsed = useCallback(() => {
    const pending =
      segmentStartRef.current !== null
        ? Date.now() - segmentStartRef.current
        : 0;
    return activeMsRef.current + pending;
  }, []);

  // Tạm dừng đếm khi tab ẩn, tiếp tục khi hiện lại.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) flush();
      else resume();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [flush, resume]);

  return { start, stop, elapsed, pause: flush, resume };
}
