import { useSettingsStore } from "@/stores/settings-store";
import { LANGUAGES, LANGUAGE_ORDER } from "@/config/languages";
import { cn } from "@/utils/cn";

export function LanguageSwitcher() {
  const targetLanguage = useSettingsStore((s) => s.settings.targetLanguage);
  const setTargetLanguage = useSettingsStore((s) => s.setTargetLanguage);

  return (
    <div
      className="glass flex gap-1 rounded-full p-1"
      role="group"
      aria-label="Chọn ngôn ngữ đang học"
    >
      {LANGUAGE_ORDER.map((code) => {
        const lang = LANGUAGES[code];
        const active = code === targetLanguage;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setTargetLanguage(code)}
            aria-pressed={active}
            title={lang.labelVi}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-corgi text-night" : "text-ivory/70 hover:text-ivory",
            )}
          >
            <span aria-hidden className="mr-1">
              {lang.flag}
            </span>
            <span className="hidden sm:inline">{lang.labelVi}</span>
          </button>
        );
      })}
    </div>
  );
}
