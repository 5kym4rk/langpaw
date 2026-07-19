import { Volume2 } from "lucide-react";
import { GlassPanel } from "@/components/common/GlassPanel";
import { useSettingsStore } from "@/stores/settings-store";
import { useVoices } from "@/hooks/useVoices";
import { speechService } from "@/services/speech/speech-service";
import { buildSpeakOptions } from "@/services/speech/speak-options";
import { LANGUAGES } from "@/config/languages";
import type { LanguageCode } from "@/types";

const SAMPLE_TEXT: Record<LanguageCode, string> = {
  en: "Hello, this is a voice test.",
  zh: "你好，这是一段语音测试。",
  ko: "안녕하세요, 음성 테스트입니다.",
  ja: "こんにちは、音声テストです。",
};

export function VoiceSettings() {
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const language = settings.targetLanguage;
  const lang = LANGUAGES[language];
  const voices = useVoices(lang.speechLocale);
  const selectedVoice = settings.speechVoiceByLanguage[language] ?? "";

  const supported = speechService.isSupported();
  const noVoice = supported && voices.length === 0;

  const setVoice = (voiceURI: string) => {
    update({
      speechVoiceByLanguage: {
        ...settings.speechVoiceByLanguage,
        [language]: voiceURI || undefined,
      },
    });
  };

  const testVoice = () => {
    void speechService.speak(
      SAMPLE_TEXT[language],
      buildSpeakOptions(
        { ...settings, speechVoiceByLanguage: settings.speechVoiceByLanguage },
        language,
      ),
    );
  };

  return (
    <GlassPanel>
      <h2 className="mb-1 text-lg font-semibold">Giọng đọc · {lang.labelVi}</h2>
      <p className="mb-3 text-sm text-ivory/60">
        Cấu hình giọng riêng cho từng ngôn ngữ. Danh sách giọng phụ thuộc hệ
        điều hành và trình duyệt.
      </p>

      {!supported ? (
        <p className="text-sm text-danger-text">
          Trình duyệt không hỗ trợ phát âm (Speech Synthesis).
        </p>
      ) : noVoice ? (
        <p className="text-sm text-danger-text">
          Không tìm thấy giọng {lang.labelVi} trên thiết bị này. Cài thêm gói
          giọng đọc của hệ điều hành để dùng.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-ivory/80">
            Giọng đọc
            <select
              value={selectedVoice}
              onChange={(e) => setVoice(e.target.value)}
              className="rounded-lg bg-night px-3 py-2 text-sm text-ivory"
            >
              <option value="">Giọng mặc định của trình duyệt</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang}){v.localService ? " · máy" : " · mạng"}
                </option>
              ))}
            </select>
          </label>

          <Slider
            label="Tốc độ"
            min={0.5}
            max={1.5}
            step={0.05}
            value={settings.speechRate}
            onChange={(v) => update({ speechRate: v })}
          />
          <Slider
            label="Cao độ"
            min={0.5}
            max={1.5}
            step={0.05}
            value={settings.speechPitch}
            onChange={(v) => update({ speechPitch: v })}
          />
          <Slider
            label="Âm lượng"
            min={0}
            max={1}
            step={0.05}
            value={settings.speechVolume}
            onChange={(v) => update({ speechVolume: v })}
          />
          <Slider
            label="Số lần lặp (tự động)"
            min={1}
            max={5}
            step={1}
            value={settings.repeatCount}
            onChange={(v) => update({ repeatCount: v })}
          />
          <Slider
            label="Khoảng nghỉ (ms)"
            min={0}
            max={2000}
            step={100}
            value={settings.pauseMs}
            onChange={(v) => update({ pauseMs: v })}
          />

          <button
            type="button"
            onClick={testVoice}
            className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-corgi px-4 py-2 text-sm font-medium text-night"
          >
            <Volume2 size={16} /> Nghe thử
          </button>
        </div>
      )}
    </GlassPanel>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span className="text-sm text-ivory/85">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-36 accent-corgi"
        />
        <span className="w-12 text-right text-xs text-ivory/50">{value}</span>
      </span>
    </label>
  );
}
