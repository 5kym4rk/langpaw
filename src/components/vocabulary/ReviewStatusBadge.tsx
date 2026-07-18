import type { ReviewStatus } from "@/types";
import { cn } from "@/utils/cn";

const CONFIG: Record<ReviewStatus, { label: string; className: string }> = {
  draft: {
    label: "Nháp",
    className: "bg-amber-500/20 text-amber-300",
  },
  reviewed: {
    label: "Đã rà soát",
    className: "bg-sky-500/20 text-sky-300",
  },
  verified: {
    label: "Đã xác minh",
    className: "bg-success/25 text-emerald-300",
  },
};

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const config = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        config.className,
      )}
      title={`Trạng thái kiểm duyệt: ${config.label}`}
    >
      {config.label}
    </span>
  );
}
