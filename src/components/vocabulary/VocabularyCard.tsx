import type { VocabularyItem } from "@/types";
import { LANGUAGES } from "@/config/languages";
import { useSettingsStore } from "@/stores/settings-store";
import { SpeechButton } from "./SpeechButton";
import { ReviewStatusBadge } from "./ReviewStatusBadge";
import { GlassPanel } from "@/components/common/GlassPanel";

interface VocabularyCardProps {
  item: VocabularyItem;
  flipped: boolean;
  onFlip: () => void;
}

export function VocabularyCard({ item, flipped, onFlip }: VocabularyCardProps) {
  const settings = useSettingsStore((s) => s.settings);
  const lang = LANGUAGES[item.language];
  const reading = item.reading ?? item.ipa;

  return (
    <GlassPanel
      strong
      className="flex min-h-[18rem] cursor-pointer flex-col justify-between"
    >
      <button
        type="button"
        onClick={onFlip}
        aria-pressed={flipped}
        aria-label={flipped ? "Xem mặt trước" : "Lật thẻ để xem nghĩa"}
        className="flex flex-1 flex-col items-center justify-center gap-2 text-center"
      >
        {!flipped ? (
          <>
            <span className="text-4xl font-bold text-ivory sm:text-5xl">
              {item.term}
            </span>
            {settings.showReading && reading ? (
              <span className="text-lg text-corgi">{reading}</span>
            ) : null}
            {settings.showRomanization &&
            lang.hasRomanization &&
            item.romanization ? (
              <span className="text-sm text-ivory/60">{item.romanization}</span>
            ) : null}
            <span className="mt-2 text-xs text-ivory/50">Nhấn để lật thẻ</span>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {item.partOfSpeech ? (
              <span className="text-xs uppercase tracking-wide text-ivory/50">
                {item.partOfSpeech}
              </span>
            ) : null}
            <span className="text-2xl font-semibold text-ivory">
              {item.meaningVi}
            </span>
            {item.explanationVi ? (
              <p className="max-w-md text-sm text-ivory/70">
                {item.explanationVi}
              </p>
            ) : null}
            {settings.showExample ? (
              <div className="mt-2 max-w-md rounded-xl bg-night/40 p-3 text-left">
                <p className="text-base text-ivory">{item.example}</p>
                {settings.showExampleTranslation ? (
                  <p className="mt-1 text-sm text-ivory/60">{item.exampleVi}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </button>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-ivory/10 pt-3">
        <div className="flex items-center gap-2">
          <SpeechButton text={item.term} locale={lang.speechLocale} />
          <SpeechButton
            text={item.term}
            locale={lang.speechLocale}
            rateFactor={0.6}
            label="Chậm"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-ivory/50">
          <span>{item.level}</span>
          <span aria-hidden>·</span>
          <span>{item.topic}</span>
          <ReviewStatusBadge status={item.reviewStatus} />
        </div>
      </div>
    </GlassPanel>
  );
}
