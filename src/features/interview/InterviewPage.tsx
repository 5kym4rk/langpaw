import { useEffect, useMemo, useState } from "react";
import { Briefcase, Star, AlertTriangle, Search } from "lucide-react";
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
  INTERVIEW_QUESTIONS,
  INTERVIEW_QUESTION_CATEGORIES,
  type InterviewQuestion,
} from "@/config/interview";
import { meetsReviewLevel } from "@/services/data/vocabulary-filters";
import type {
  InterviewRole,
  VocabularyItem,
  VocabularyProgress,
} from "@/types";
import { AnswerPractice } from "./AnswerPractice";
import { cn } from "@/utils/cn";

type Tab = "terms" | "questions" | "practice";

const TABS: { id: Tab; label: string }[] = [
  { id: "terms", label: "Thuật ngữ" },
  { id: "questions", label: "Câu hỏi phỏng vấn" },
  { id: "practice", label: "Luyện trả lời" },
];

export default function InterviewPage() {
  const targetLanguage = useSettingsStore((s) => s.settings.targetLanguage);
  const contentReviewLevel = useSettingsStore(
    (s) => s.settings.contentReviewLevel,
  );
  const {
    allItems,
    progressMap,
    loading,
    loadLanguage,
    toggleFavorite,
    toggleWeak,
  } = useLearningStore();
  const lang = LANGUAGES[targetLanguage];

  const [tab, setTab] = useState<Tab>("terms");

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

  if (loading) return <LoadingState label="Đang tải…" />;

  return (
    <div>
      <PageHeader
        title="Phỏng vấn điện tử - viễn thông"
        subtitle={`${lang.labelVi} · ${interviewItems.length} thuật ngữ`}
      />

      <div className="mb-5 flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium",
              tab === t.id ? "bg-corgi text-night" : "glass text-ivory/80",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "terms" ? (
        <TermsTab
          items={interviewItems}
          progressMap={progressMap}
          onFavorite={toggleFavorite}
          onWeak={toggleWeak}
        />
      ) : null}
      {tab === "questions" ? <QuestionsTab /> : null}
      {tab === "practice" ? <PracticeTab /> : null}
    </div>
  );
}

// ---- Tab 1: Thuật ngữ ----
function TermsTab({
  items,
  progressMap,
  onFavorite,
  onWeak,
}: {
  items: VocabularyItem[];
  progressMap: Map<string, VocabularyProgress>;
  onFavorite: (id: string) => Promise<void>;
  onWeak: (id: string) => Promise<void>;
}) {
  const [role, setRole] = useState<InterviewRole | "">("");
  const [group, setGroup] = useState<string>("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const availableRoles = useMemo(() => {
    const set = new Set<InterviewRole>();
    for (const item of items)
      for (const r of item.interviewRoles ?? []) set.add(r);
    return INTERVIEW_ROLE_ORDER.filter((r) => set.has(r));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (role && !(item.interviewRoles ?? []).includes(role)) return false;
      if (group && item.topic !== group) return false;
      if (
        q &&
        !item.term.toLowerCase().includes(q) &&
        !item.meaningVi.toLowerCase().includes(q) &&
        !(item.romanization ?? "").toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [items, role, group, query]);

  const selected = filtered.find((i) => i.id === selectedId) ?? filtered[0];

  if (items.length === 0) {
    return (
      <EmptyState
        title="Chưa có thuật ngữ cho ngôn ngữ này"
        description="Bộ thuật ngữ phỏng vấn cho ngôn ngữ này đang được biên soạn hoặc bị lọc theo mức kiểm duyệt."
        icon={<Briefcase size={40} />}
      />
    );
  }

  return (
    <>
      <div className="glass mb-6 flex flex-wrap items-end gap-3 rounded-xl2 p-4">
        <label className="flex flex-1 items-center gap-2 rounded-lg bg-night px-3 py-2">
          <Search size={16} className="text-ivory/40" aria-hidden />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm thuật ngữ hoặc nghĩa…"
            aria-label="Tìm kiếm thuật ngữ"
            className="w-full bg-transparent text-sm text-ivory outline-none"
          />
        </label>
        <Field label="Vị trí ứng tuyển">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as InterviewRole | "")}
            className="rounded-lg bg-night px-3 py-2 text-sm text-ivory"
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
            className="rounded-lg bg-night px-3 py-2 text-sm text-ivory"
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
        <ul className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto pr-1">
          {filtered.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={cn(
                  "flex w-full flex-col rounded-xl px-3 py-2 text-left",
                  selected?.id === item.id
                    ? "bg-corgi/20 text-corgi-text"
                    : "text-ivory/80 hover:bg-ivory/5",
                )}
              >
                <span className="font-medium">{item.term}</span>
                <span className="text-xs text-ivory/50">{item.meaningVi}</span>
              </button>
            </li>
          ))}
        </ul>

        {selected ? (
          <InterviewDetail
            item={selected}
            progress={progressMap.get(selected.id)}
            onFavorite={onFavorite}
            onWeak={onWeak}
          />
        ) : (
          <EmptyState title="Không tìm thấy" description="Thử từ khóa khác." />
        )}
      </div>
    </>
  );
}

function InterviewDetail({
  item,
  progress,
  onFavorite,
  onWeak,
}: {
  item: VocabularyItem;
  progress?: VocabularyProgress;
  onFavorite: (id: string) => Promise<void>;
  onWeak: (id: string) => Promise<void>;
}) {
  const lang = LANGUAGES[item.language];
  const reading = item.reading ?? item.ipa;
  return (
    <GlassPanel strong className="h-fit">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-3xl font-bold text-ivory">{item.term}</h2>
        {reading ? (
          <span className="text-lg text-corgi-text">{reading}</span>
        ) : null}
        <SpeechButton text={item.term} locale={lang.speechLocale} />
        <ReviewStatusBadge status={item.reviewStatus} />
      </div>

      <div className="mt-2 flex gap-2">
        <Chip
          active={Boolean(progress?.favorite)}
          onClick={() => void onFavorite(item.id)}
          icon={<Star size={14} />}
          label="Yêu thích"
        />
        <Chip
          active={Boolean(progress?.markedWeak)}
          onClick={() => void onWeak(item.id)}
          icon={<AlertTriangle size={14} />}
          label="Từ yếu"
        />
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

// ---- Tab 2: Câu hỏi phỏng vấn ----
function QuestionsTab() {
  const [category, setCategory] = useState<string>("");
  const questions = useMemo(
    () =>
      category
        ? INTERVIEW_QUESTIONS.filter((q) => q.category === category)
        : INTERVIEW_QUESTIONS,
    [category],
  );

  return (
    <div>
      <div className="glass mb-4 flex flex-wrap gap-2 rounded-xl2 p-3">
        <button
          type="button"
          onClick={() => setCategory("")}
          aria-pressed={category === ""}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm",
            category === "" ? "bg-corgi text-night" : "text-ivory/80",
          )}
        >
          Tất cả
        </button>
        {INTERVIEW_QUESTION_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm",
              category === c ? "bg-corgi text-night" : "text-ivory/80",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-3">
        {questions.map((q) => (
          <QuestionCard key={q.id} q={q} />
        ))}
      </ul>
    </div>
  );
}

function QuestionCard({ q }: { q: InterviewQuestion }) {
  return (
    <GlassPanel as="article">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-semibold text-ivory">{q.questionEn}</h3>
        <SpeechButton text={q.questionEn} locale="en-US" label="Nghe" />
        <span className="text-xs text-ivory/40">{q.level}</span>
      </div>
      <p className="mt-1 text-sm text-ivory/60">{q.questionVi}</p>

      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ivory/40">
        Ý chính cần có
      </p>
      <ul className="mt-1 list-inside list-disc text-sm text-ivory/75">
        {q.keyPointsVi.map((k) => (
          <li key={k}>{k}</li>
        ))}
      </ul>

      <div className="mt-3 rounded-xl bg-night/40 p-3">
        <div className="flex items-center gap-2">
          <p className="flex-1 text-ivory">{q.sampleAnswerEn}</p>
          <SpeechButton
            text={q.sampleAnswerEn}
            locale="en-US"
            label="Nghe mẫu"
          />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {q.keywords.map((k) => (
          <span
            key={k}
            className="rounded-full bg-ivory/10 px-2 py-0.5 text-xs text-ivory/70"
          >
            {k}
          </span>
        ))}
      </div>
    </GlassPanel>
  );
}

// ---- Tab 3: Luyện trả lời ----
function PracticeTab() {
  const [questionId, setQuestionId] = useState(INTERVIEW_QUESTIONS[0].id);
  const question =
    INTERVIEW_QUESTIONS.find((q) => q.id === questionId) ??
    INTERVIEW_QUESTIONS[0];

  return (
    <div>
      <label className="mb-4 flex flex-col gap-1 text-xs text-ivory/60">
        Chọn câu hỏi
        <select
          value={questionId}
          onChange={(e) => setQuestionId(e.target.value)}
          className="rounded-lg bg-night px-3 py-2 text-sm text-ivory"
        >
          {INTERVIEW_QUESTIONS.map((q) => (
            <option key={q.id} value={q.id}>
              {q.questionVi}
            </option>
          ))}
        </select>
      </label>
      <AnswerPractice question={question} />
    </div>
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

function Chip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs",
        active ? "bg-corgi text-night" : "glass text-ivory/70",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
