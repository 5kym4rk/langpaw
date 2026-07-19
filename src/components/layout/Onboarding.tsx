import { useState } from "react";
import { PawPrint } from "lucide-react";
import { useSettingsStore } from "@/stores/settings-store";
import { LANGUAGES, LANGUAGE_ORDER } from "@/config/languages";
import { DAILY_GOALS, type DailyGoal } from "@/config/learning";
import { cn } from "@/utils/cn";

/**
 * Hướng dẫn lần đầu (P2.1): chọn ngôn ngữ, mục tiêu, giải thích dữ liệu lưu trên
 * máy. Có thể bỏ qua. Chỉ hiển thị khi onboardingDone = false.
 */
export function Onboarding() {
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const setTargetLanguage = useSettingsStore((s) => s.setTargetLanguage);
  const [step, setStep] = useState(0);

  if (settings.onboardingDone) return null;

  const finish = () => update({ onboardingDone: true });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Hướng dẫn bắt đầu"
        className="glass-strong w-full max-w-md rounded-xl2 p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PawPrint className="text-corgi-text" aria-hidden />
            <span className="text-xl font-bold text-ivory">LangPaw</span>
          </div>
          <button
            type="button"
            onClick={finish}
            className="text-sm text-ivory/50 hover:text-ivory"
          >
            Bỏ qua
          </button>
        </div>

        {step === 0 ? (
          <div>
            <h2 className="text-lg font-semibold text-ivory">
              Bạn muốn học ngôn ngữ nào?
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {LANGUAGE_ORDER.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setTargetLanguage(code)}
                  aria-pressed={settings.targetLanguage === code}
                  className={cn(
                    "rounded-xl px-4 py-3 text-sm font-medium",
                    settings.targetLanguage === code
                      ? "bg-corgi text-night"
                      : "glass text-ivory/80",
                  )}
                >
                  {LANGUAGES[code].flag} {LANGUAGES[code].labelVi}
                </button>
              ))}
            </div>
          </div>
        ) : step === 1 ? (
          <div>
            <h2 className="text-lg font-semibold text-ivory">
              Mục tiêu mỗi ngày?
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {DAILY_GOALS.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => update({ dailyGoal: goal as DailyGoal })}
                  aria-pressed={settings.dailyGoal === goal}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium",
                    settings.dailyGoal === goal
                      ? "bg-corgi text-night"
                      : "glass text-ivory/80",
                  )}
                >
                  {goal} từ/ngày
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold text-ivory">Sẵn sàng học!</h2>
            <p className="mt-2 text-sm text-ivory/70">
              Toàn bộ tiến độ được lưu ngay trên thiết bị của bạn (không cần tài
              khoản). Bạn có thể xuất/nhập bản sao lưu trong Cài đặt bất cứ lúc
              nào.
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <span className="text-xs text-ivory/40">Bước {step + 1} / 3</span>
          <div className="flex gap-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-full px-4 py-2 text-sm text-ivory/80"
              >
                Quay lại
              </button>
            ) : null}
            {step < 2 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="rounded-full bg-corgi px-5 py-2 text-sm font-medium text-night"
              >
                Tiếp tục
              </button>
            ) : (
              <button
                type="button"
                onClick={finish}
                className="rounded-full bg-corgi px-5 py-2 text-sm font-medium text-night"
              >
                Bắt đầu học
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
