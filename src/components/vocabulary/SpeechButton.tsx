import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { speechService } from "@/services/speech/speech-service";
import { buildSpeakOptions } from "@/services/speech/speak-options";
import { useSettingsStore } from "@/stores/settings-store";
import type { LanguageCode } from "@/types";
import { cn } from "@/utils/cn";

const LOCALE_TO_LANG: Record<string, LanguageCode> = {
  en: "en",
  zh: "zh",
  ko: "ko",
  ja: "ja",
};

interface SpeechButtonProps {
  text: string;
  locale: string;
  /** Hệ số nhân tốc độ (vd 0.6 để phát chậm). */
  rateFactor?: number;
  label?: string;
  className?: string;
}

export function SpeechButton({
  text,
  locale,
  rateFactor = 1,
  label = "Phát âm",
  className,
}: SpeechButtonProps) {
  const settings = useSettingsStore((s) => s.settings);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(speechService.isSupported());
  }, []);

  const disabled = !supported || !settings.speechEnabled;

  const handleClick = () => {
    if (disabled) return;
    const langCode = LOCALE_TO_LANG[locale.toLowerCase().split("-")[0]];
    if (langCode) {
      void speechService.speak(
        text,
        buildSpeakOptions(settings, langCode, rateFactor),
      );
    } else {
      void speechService.speak(text, {
        lang: locale,
        voiceURI: settings.speechVoiceURI,
        rate: settings.speechRate * rateFactor,
        pitch: settings.speechPitch,
        volume: settings.speechVolume,
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={supported ? label : "Trình duyệt không hỗ trợ phát âm"}
      title={supported ? label : "Trình duyệt không hỗ trợ phát âm"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        disabled
          ? "cursor-not-allowed bg-ivory/10 text-ivory/40"
          : "bg-corgi/20 text-corgi-text hover:bg-corgi/30",
        className,
      )}
    >
      {supported ? (
        <Volume2 size={16} aria-hidden />
      ) : (
        <VolumeX size={16} aria-hidden />
      )}
      <span>{label}</span>
    </button>
  );
}
