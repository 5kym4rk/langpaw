import { useEffect } from "react";
import { X } from "lucide-react";
import { useToast, type Toast } from "@/stores/toast";
import { cn } from "@/utils/cn";

const TONE_CLASS: Record<Toast["tone"], string> = {
  info: "border-ivory/20",
  success: "border-success/50",
  error: "border-danger/60",
};

/** Vùng hiển thị toast, tự đóng sau 4s, có thể đóng thủ công. */
export function Toaster() {
  const toasts = useToast((s) => s.toasts);
  const dismiss = useToast((s) => s.dismiss);

  return (
    <div
      className="fixed bottom-24 left-1/2 z-[70] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 lg:bottom-6"
      role="region"
      aria-label="Thông báo"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={cn(
        "glass-strong flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg",
        TONE_CLASS[toast.tone],
      )}
    >
      <span className="flex-1 text-sm text-ivory">{toast.text}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Đóng thông báo"
        className="text-ivory/60 hover:text-ivory"
      >
        <X size={16} />
      </button>
    </div>
  );
}
