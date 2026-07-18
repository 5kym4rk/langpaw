import { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";
import type { VocabularyItem, VocabularySource } from "@/types";
import { loadSources } from "@/services/data/vocabulary-loader";
import { ReviewStatusBadge } from "./ReviewStatusBadge";

interface SourceDrawerProps {
  item: VocabularyItem;
  open: boolean;
  onClose: () => void;
}

export function SourceDrawer({ item, open, onClose }: SourceDrawerProps) {
  const [sources, setSources] = useState<VocabularySource[]>([]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    void loadSources(item.language).then((all) => {
      if (active) setSources(all.filter((s) => item.sourceIds.includes(s.id)));
    });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      active = false;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, item, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Nguồn của từ ${item.term}`}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong relative w-full max-w-lg rounded-t-xl2 p-5 sm:rounded-xl2"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ivory">
            Nguồn · {item.term}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-full p-2 text-ivory/70 hover:bg-ivory/10"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-3 flex items-center gap-2 text-sm">
          <span className="text-ivory/60">Trạng thái:</span>
          <ReviewStatusBadge status={item.reviewStatus} />
          {item.reviewedBy ? (
            <span className="text-ivory/50">
              · {item.reviewedBy}
              {item.reviewedAt ? ` (${item.reviewedAt.slice(0, 10)})` : ""}
            </span>
          ) : null}
        </div>

        {item.verificationNote ? (
          <p className="mb-3 rounded-lg bg-night/40 p-2 text-sm text-ivory/70">
            {item.verificationNote}
          </p>
        ) : null}

        <ul className="flex flex-col gap-3">
          {sources.map((s) => (
            <li key={s.id} className="rounded-xl bg-night/40 p-3 text-sm">
              <p className="font-medium text-ivory">{s.title}</p>
              <p className="text-ivory/60">{s.authority}</p>
              <dl className="mt-1 grid grid-cols-2 gap-x-3 text-xs text-ivory/60">
                <Row label="Giấy phép" value={s.license ?? "—"} />
                <Row label="Ngày truy cập" value={s.retrievedAt} />
              </dl>
              {item.sourceEntryUrl || s.url ? (
                <a
                  href={item.sourceEntryUrl || s.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-2 inline-flex items-center gap-1 text-corgi underline"
                >
                  <ExternalLink size={12} />
                  {item.sourceEntryUrl ? "Xem entry cụ thể" : "Xem nguồn"}
                </a>
              ) : null}
            </li>
          ))}
        </ul>

        <p className="mt-3 text-xs text-ivory/40">
          {item.exampleSelfAuthored !== false
            ? "Câu ví dụ và nghĩa tiếng Việt do dự án tự biên soạn, cần kiểm duyệt."
            : "Nội dung đối chiếu theo nguồn đã dẫn."}
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1">
      <dt className="text-ivory/40">{label}:</dt>
      <dd>{value}</dd>
    </div>
  );
}
