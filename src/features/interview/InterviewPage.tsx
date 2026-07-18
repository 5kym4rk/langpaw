import { useEffect, useMemo, useState } from "react";
import { Briefcase, MessageSquareText } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { GlassPanel } from "@/components/common/GlassPanel";
import { SpeechButton } from "@/components/vocabulary/SpeechButton";
import { ReviewStatusBadge } from "@/components/vocabulary/ReviewStatusBadge";
import { useLearningStore } from "@/stores/learning-store";
import { useSettingsStore } from "@/stores/settings-store";
import { LANGUAGES } from "@/config/languages";
import {
  INTERVIEW_GROUPS,
  INTERVIEW_ROLE_LABELS,
  INTERVIEW_ROLE_ORDER,
  SAMPLE_INTERVIEW_QUESTIONS,
} from "@/config/interview";
import { meetsReviewLevel } from "@/services/data/vocabulary-filters";
import type { InterviewRole, VocabularyItem } from "@/types";
import { cn } from "@/utils/cn";

export default function InterviewPage() {
  const targetLanguage = useSettingsStore((s) => s.settings.targetLanguage);
  const contentReviewLevel = useSettingsStore(
    (s) => s.settings.contentReviewLevel,
  );
  const { allItems, loading, loadLanguage } = useLearningStore();
  const lang = LANGUAGES[targetLanguage];

  const [role, setRole] = useState<InterviewRole | "">("");
  const [group, setGroup] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    void loadLanguage(targetLanguage);
  }, [targetLanguage, loadLanguage]);

  const interviewItems = useMemo(
    () =>
      allItems.filter(
        (i) =>
          i.isInterviewVocabulary && meetsReviewLevel(i, contentReviewLevel),
      ),
    [allItems, contentReviewLevel],
  );

  const availableRoles = useMemo(() => {
    const set = new Set<InterviewRole>();
    for (const item of interviewItems)
      for (const r of item.interviewRoles ?? []) set.add(r);
    return INTERVIEW_ROLE_ORDER.filter((r) => set.has(r));
  }, [interviewItems]);

  const filtered = useMemo(
    () =>
      interviewItems.filter((item) => {
        if (role && !(item.interviewRoles ?? []).includes(role)) return false;
        if (group && item.topic !== group) return false;
        return true;
      }),
    [interviewItems, role, group],
  );

  const selected = filtered.find((i) => i.id === selectedId) ?? filtered[0];

  if (loading) return <LoadingState label="Đang tải thuật ngữ…" />;

  return (
    <div>
      <PageHeader
        title="Phỏng vấn điện tử - viễn thông"
        subtitle={`${lang.labelVi} · ${interviewItems.length} thuật ngữ`}
      />

      {interviewItems.length === 0 ? (
        <EmptyState
          title="Chưa có thuật ngữ cho ngôn ngữ này"
          description="Bộ thuật ngữ phỏng vấn cho ngôn ngữ này đang được biên soạn."
          icon={<Briefcase size={40} />}
        />
      ) : (
        <>
          <div className="glass mb-6 flex flex-wrap items-end gap-3 rounded-xl2 p-4">
            <Field label="Vị trí ứng tuyển">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as InterviewRole | "")}
                className="rounded-lg bg-night/60 px-3 py-2 text-sm text-ivory"
              >
                <option value="">Tất cả vị trí</option>
                {availableRoles.map((r) => (
                  <option key={r} value={r}>
                    {INTERVIEW_ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nhóm kiến thức">
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="rounded-lg bg-night/60 px-3 py-2 text-sm text-ivory"
              >
                <option value="">Tất cả nhóm</option>
                {INTERVIEW_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>
            <span className="ml-auto text-sm text-ivory/50">
              {filtered.length} kết quả
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_1fr]">
            {/* Danh sách */}
            <ul className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto pr-1">
              {filtered.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      "flex w-full flex-col rounded-xl px-3 py-2 text-left",
                      selected?.id === item.id
                        ? "bg-corgi/20 text-corgi"
                        : "text-ivory/80 hover:bg-ivory/5",
                    )}
                  >
                    <span className="font-medium">{item.term}</span>
                    <span className="text-xs text-ivory/50">
                      {item.meaningVi}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {/* Chi tiết */}
            {selected ? <InterviewDetail item={selected} /> : null}
          </div>

          <SampleQuestions />
        </>
      )}
    </div>
  );
}

function InterviewDetail({ item }: { item: VocabularyItem }) {
  const lang = LANGUAGES[item.language];
  const reading = item.reading ?? item.ipa;
  return (
    <GlassPanel strong className="h-fit">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-3xl font-bold text-ivory">{item.term}</h2>
        {reading ? <span className="text-lg text-corgi">{reading}</span> : null}
        <SpeechButton text={item.term} locale={lang.speechLocale} />
        <ReviewStatusBadge status={item.reviewStatus} />
      </div>

      <p className="mt-3 text-lg text-ivory">{item.meaningVi}</p>
      {item.explanationVi ? (
        <p className="mt-1 text-sm text-ivory/70">{item.explanationVi}</p>
      ) : null}

      <dl className="mt-4 flex flex-col gap-3">
        <Detail label="Ví dụ kỹ thuật">
          <p className="text-ivory">{item.example}</p>
          <p className="text-sm text-ivory/60">{item.exampleVi}</p>
          <SpeechButton
            text={item.example}
            locale={lang.speechLocale}
            label="Nghe câu"
            className="mt-1"
          />
        </Detail>

        {item.interviewQuestion ? (
          <Detail label="Câu hỏi phỏng vấn liên quan">
            <p className="text-ivory">{item.interviewQuestion}</p>
          </Detail>
        ) : null}

        {item.interviewAnswerSample ? (
          <Detail label="Câu trả lời mẫu">
            <p className="text-ivory">{item.interviewAnswerSample}</p>
            <SpeechButton
              text={item.interviewAnswerSample}
              locale={lang.speechLocale}
              label="Nghe câu trả lời"
              className="mt-1"
            />
          </Detail>
        ) : null}

        {item.interviewRoles && item.interviewRoles.length > 0 ? (
          <Detail label="Vị trí liên quan">
            <div className="flex flex-wrap gap-1">
              {item.interviewRoles.map((r) => (
                <span
                  key={r}
                  className="rounded-full bg-ivory/10 px-2 py-0.5 text-xs text-ivory/80"
                >
                  {INTERVIEW_ROLE_LABELS[r]}
                </span>
              ))}
            </div>
          </Detail>
        ) : null}
      </dl>

      <p className="mt-4 border-t border-ivory/10 pt-2 text-xs text-ivory/40">
        Nhóm: {item.topic} · Mức độ: {item.level}
      </p>
    </GlassPanel>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-night/40 p-3">
      <dt className="mb-1 text-xs uppercase tracking-wide text-ivory/40">
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

function SampleQuestions() {
  return (
    <GlassPanel className="mt-6">
      <h2 className="mb-3 flex items-center gap-2 font-semibold">
        <MessageSquareText size={18} className="text-corgi" /> Câu hỏi phỏng vấn
        thường gặp
      </h2>
      <ul className="flex flex-col gap-3">
        {SAMPLE_INTERVIEW_QUESTIONS.map((q) => (
          <li key={q.id} className="rounded-xl bg-night/40 p-3">
            <p className="font-medium text-ivory">{q.questionVi}</p>
            <p className="mt-1 text-sm text-ivory/60">
              Gợi ý: {q.answerHintVi}
            </p>
          </li>
        ))}
      </ul>
    </GlassPanel>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-ivory/60">
      {label}
      {children}
    </label>
  );
}
