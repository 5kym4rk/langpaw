import { BookMarked } from "lucide-react";

export function SourceBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-ivory/10 px-2 py-0.5 text-xs text-ivory/70">
      <BookMarked size={12} aria-hidden />
      {count} nguồn
    </span>
  );
}
