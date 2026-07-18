import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Đang tải…" }: LoadingStateProps) {
  return (
    <div
      className="flex items-center justify-center gap-3 py-16 text-ivory/80"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="animate-spin text-corgi" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
