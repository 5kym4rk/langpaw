import { useEffect, useState } from "react";
import { registerSW } from "virtual:pwa-register";

/**
 * Hiển thị toast khi có service worker mới (§21.3). Không tự reload giữa phiên.
 */
export function PwaUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateSW, setUpdateSW] = useState<
    ((reload?: boolean) => Promise<void>) | null
  >(null);

  useEffect(() => {
    const update = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
    });
    setUpdateSW(() => update);
  }, []);

  if (!needRefresh) return null;

  return (
    <div className="glass-strong fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full px-4 py-2 shadow-lg lg:bottom-6">
      <span className="text-sm text-ivory">Có phiên bản mới</span>
      <button
        type="button"
        onClick={() => void updateSW?.(true)}
        className="rounded-full bg-corgi px-3 py-1 text-sm font-medium text-night"
      >
        Cập nhật ngay
      </button>
      <button
        type="button"
        onClick={() => setNeedRefresh(false)}
        aria-label="Đóng"
        className="text-ivory/60 hover:text-ivory"
      >
        ✕
      </button>
    </div>
  );
}
