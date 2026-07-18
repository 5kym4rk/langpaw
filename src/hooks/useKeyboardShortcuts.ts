import { useEffect } from "react";

export type ShortcutMap = Record<string, (event: KeyboardEvent) => void>;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

/**
 * Đăng ký phím tắt bàn phím. Không kích hoạt khi người dùng đang nhập trong
 * input/textarea (yêu cầu §9.3). `key` không phân biệt hoa thường.
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutMap,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;
    const handler = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      const action = shortcuts[event.key] ?? shortcuts[event.key.toLowerCase()];
      if (action) {
        event.preventDefault();
        action(event);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts, enabled]);
}
