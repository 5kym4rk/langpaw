import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassPanel } from "@/components/common/GlassPanel";
import { LoadingState } from "@/components/common/LoadingState";
import { ReviewStatusBadge } from "@/components/vocabulary/ReviewStatusBadge";
import { loadVocabulary, loadSources } from "@/services/data/vocabulary-loader";
import { LANGUAGE_ORDER, LANGUAGES } from "@/config/languages";
import type { VocabularySource } from "@/types";

interface SourceWithCount extends VocabularySource {
  itemCount: number;
}

export default function SourcesPage() {
  const [sources, setSources] = useState<SourceWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      const counts = new Map<string, number>();
      const byId = new Map<string, VocabularySource>();
      for (const code of LANGUAGE_ORDER) {
        const [items, srcs] = await Promise.all([
          loadVocabulary(code),
          loadSources(code),
        ]);
        for (const s of srcs) byId.set(s.id, s);
        for (const item of items) {
          for (const sid of item.sourceIds) {
            counts.set(sid, (counts.get(sid) ?? 0) + 1);
          }
        }
      }
      if (!active) return;
      setSources(
        Array.from(byId.values()).map((s) => ({
          ...s,
          itemCount: counts.get(s.id) ?? 0,
        })),
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <LoadingState label="Đang tải nguồn dữ liệu…" />;

  return (
    <div>
      <PageHeader
        title="Nguồn dữ liệu"
        subtitle="Nguồn tham khảo, giấy phép và trạng thái kiểm duyệt"
      />

      <GlassPanel className="mb-6">
        <h2 className="mb-2 font-semibold">Trạng thái kiểm duyệt</h2>
        <ul className="flex flex-col gap-2 text-sm text-ivory/80">
          <li className="flex items-center gap-2">
            <ReviewStatusBadge status="draft" /> Nội dung tự biên soạn, chưa đối
            chiếu nguồn.
          </li>
          <li className="flex items-center gap-2">
            <ReviewStatusBadge status="reviewed" /> Đã có người rà soát.
          </li>
          <li className="flex items-center gap-2">
            <ReviewStatusBadge status="verified" /> Đã đối chiếu nguồn, có người
            và thời điểm kiểm duyệt.
          </li>
        </ul>
      </GlassPanel>

      <div className="flex flex-col gap-4">
        {sources.map((s) => (
          <GlassPanel key={s.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-lg font-semibold text-ivory">{s.title}</h3>
              <span className="text-sm text-corgi">{s.itemCount} mục</span>
            </div>
            <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <Row label="Đơn vị phát hành" value={s.authority} />
              <Row label="Giấy phép" value={s.license ?? "—"} />
              <Row label="Ngày truy cập" value={s.retrievedAt} />
              <Row label="Phiên bản" value={s.sourceVersion ?? "—"} />
            </dl>
            {s.usageNote ? (
              <p className="mt-2 text-sm text-ivory/60">{s.usageNote}</p>
            ) : null}
            {s.url ? (
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-block text-sm text-corgi underline"
              >
                {s.url}
              </a>
            ) : null}
          </GlassPanel>
        ))}
      </div>

      <p className="mt-6 text-xs text-ivory/40">
        Ứng dụng hỗ trợ{" "}
        {LANGUAGE_ORDER.map((c) => LANGUAGES[c].labelVi).join(", ")}. Xem thêm
        DATA_SOURCES.md và docs/DATA_POLICY.md trong mã nguồn.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-ivory/50">{label}:</dt>
      <dd className="text-ivory/85">{value}</dd>
    </div>
  );
}
