import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassPanel } from "@/components/common/GlassPanel";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useSettingsStore } from "@/stores/settings-store";
import { LANGUAGES, LANGUAGE_ORDER } from "@/config/languages";
import { DAILY_GOALS, type DailyGoal } from "@/config/learning";
import { MUSIC_TRACKS, MUSIC_AVAILABLE } from "@/services/background/music";
import { loadBackgroundManifest } from "@/services/background/background-manifest";
import {
  buildBackup,
  downloadBackup,
  parseBackup,
  applyBackup,
  type ImportMode,
} from "@/services/backup/backup-service";
import type { BackupInput } from "@/services/backup/backup-schema";
import { clearAllProgress } from "@/db/repositories/progress-repository";
import { clearAllStats } from "@/db/repositories/stats-repository";
import { cn } from "@/utils/cn";

type ConfirmKind = "clear" | "reset" | null;

export default function SettingsPage() {
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const reset = useSettingsStore((s) => s.reset);
  const setTargetLanguage = useSettingsStore((s) => s.setTargetLanguage);

  const [hasBackgroundResource, setHasBackgroundResource] = useState(false);
  useEffect(() => {
    let active = true;
    void loadBackgroundManifest().then((list) => {
      if (active) setHasBackgroundResource(list.some((b) => b.enabled));
    });
    return () => {
      active = false;
    };
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importPreview, setImportPreview] = useState<BackupInput | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null);

  const handleExport = async () => {
    const backup = await buildBackup(settings);
    downloadBackup(backup);
    setMessage("Đã xuất file backup.");
  };

  const handleFile = async (file: File) => {
    setImportError(null);
    setImportPreview(null);
    const text = await file.text();
    const result = parseBackup(text);
    if (!result.ok) {
      setImportError(result.error);
      return;
    }
    setImportPreview(result.data);
  };

  const doImport = async (mode: ImportMode) => {
    if (!importPreview) return;
    await applyBackup(importPreview, mode);
    if (importPreview.settings) {
      update(importPreview.settings as Partial<typeof settings>);
    }
    setImportPreview(null);
    setMessage("Đã nhập dữ liệu. Tải lại trang để cập nhật thống kê.");
  };

  const doClear = async () => {
    await clearAllProgress();
    await clearAllStats();
    setConfirmKind(null);
    setMessage("Đã xóa toàn bộ tiến độ.");
  };

  const doReset = () => {
    reset();
    setConfirmKind(null);
    setMessage("Đã khôi phục thiết lập mặc định.");
  };

  return (
    <div>
      <PageHeader
        title="Cài đặt"
        subtitle="Tùy chỉnh trải nghiệm học của bạn"
      />

      <div className="grid gap-4">
        <GlassPanel>
          <h2 className="mb-3 text-lg font-semibold">Ngôn ngữ đang học</h2>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_ORDER.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setTargetLanguage(code)}
                aria-pressed={settings.targetLanguage === code}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium",
                  settings.targetLanguage === code
                    ? "bg-corgi text-night"
                    : "glass text-ivory/80",
                )}
              >
                {LANGUAGES[code].flag} {LANGUAGES[code].labelVi}
              </button>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel>
          <h2 className="mb-3 text-lg font-semibold">Mục tiêu hằng ngày</h2>
          <div className="flex flex-wrap gap-2">
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
        </GlassPanel>

        <GlassPanel>
          <h2 className="mb-3 text-lg font-semibold">Hiển thị và phát âm</h2>
          <div className="flex flex-col gap-3">
            <Toggle
              label="Phát âm (Text-to-Speech)"
              checked={settings.speechEnabled}
              onChange={(v) => update({ speechEnabled: v })}
            />
            <Toggle
              label="Hiển thị cách đọc"
              checked={settings.showReading}
              onChange={(v) => update({ showReading: v })}
            />
            <Toggle
              label="Hiển thị ví dụ"
              checked={settings.showExample}
              onChange={(v) => update({ showExample: v })}
            />
            <Toggle
              label="Giảm chuyển động"
              checked={settings.reducedMotion}
              onChange={(v) => update({ reducedMotion: v })}
            />
            <Toggle
              label="Tiết kiệm dữ liệu"
              checked={settings.dataSaver}
              onChange={(v) => update({ dataSaver: v })}
            />
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Hình nền</h2>
            {!hasBackgroundResource ? (
              <span className="rounded-full bg-ivory/10 px-2 py-0.5 text-xs text-ivory/60">
                Chưa cài tài nguyên nền
              </span>
            ) : null}
          </div>
          <div className="flex flex-col gap-3">
            <Toggle
              label="Bật nền động (video)"
              checked={
                hasBackgroundResource && settings.dynamicBackgroundEnabled
              }
              disabled={!hasBackgroundResource}
              onChange={(v) => update({ dynamicBackgroundEnabled: v })}
            />
            <Slider
              label="Độ tối nền"
              min={0}
              max={0.85}
              step={0.05}
              value={settings.backgroundDarkness}
              onChange={(v) => update({ backgroundDarkness: v })}
            />
            <Slider
              label="Độ mờ (blur)"
              min={0}
              max={12}
              step={1}
              value={settings.backgroundBlurPx}
              onChange={(v) => update({ backgroundBlurPx: v })}
              unit="px"
            />
          </div>
          {!hasBackgroundResource ? (
            <p className="mt-2 text-xs text-ivory/40">
              Hiện dùng nền gradient ấm áp. Thêm video/ảnh có giấy phép vào
              public/backgrounds và manifest để bật nền động.
            </p>
          ) : null}
        </GlassPanel>

        <GlassPanel>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Nhạc nền</h2>
            {!MUSIC_AVAILABLE ? (
              <span className="rounded-full bg-ivory/10 px-2 py-0.5 text-xs text-ivory/60">
                Chưa cài gói âm thanh
              </span>
            ) : null}
          </div>
          {MUSIC_AVAILABLE ? (
            <div className="flex flex-col gap-3">
              <Toggle
                label="Bật nhạc nền"
                checked={settings.musicEnabled}
                onChange={(v) => update({ musicEnabled: v })}
              />
              <div className="flex flex-wrap gap-2">
                {MUSIC_TRACKS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={!settings.musicEnabled}
                    onClick={() => update({ musicTrack: t.id })}
                    aria-pressed={(settings.musicTrack ?? "none") === t.id}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium disabled:opacity-40",
                      (settings.musicTrack ?? "none") === t.id
                        ? "bg-corgi text-night"
                        : "glass text-ivory/80",
                    )}
                  >
                    {t.labelVi}
                  </button>
                ))}
              </div>
              <Slider
                label="Âm lượng nhạc"
                min={0}
                max={1}
                step={0.05}
                value={settings.musicVolume}
                onChange={(v) => update({ musicVolume: v })}
              />
            </div>
          ) : (
            <p className="text-xs text-ivory/40">
              Thêm file nhạc có giấy phép vào public/audio và bật cờ trong mã
              nguồn để kích hoạt nhạc nền.
            </p>
          )}
        </GlassPanel>

        <GlassPanel>
          <h2 className="mb-3 text-lg font-semibold">Dữ liệu</h2>
          {message ? (
            <p className="mb-3 rounded-lg bg-success/20 px-3 py-2 text-sm text-emerald-200">
              {message}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleExport()}
              className="rounded-full bg-corgi px-4 py-2 text-sm font-medium text-night"
            >
              Xuất dữ liệu (JSON)
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="glass rounded-full px-4 py-2 text-sm font-medium text-ivory/85"
            >
              Nhập dữ liệu
            </button>
            <button
              type="button"
              onClick={() => setConfirmKind("clear")}
              className="rounded-full bg-danger/80 px-4 py-2 text-sm font-medium text-white"
            >
              Xóa tiến độ
            </button>
            <button
              type="button"
              onClick={() => setConfirmKind("reset")}
              className="glass rounded-full px-4 py-2 text-sm font-medium text-ivory/85"
            >
              Khôi phục mặc định
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = "";
            }}
          />
          {importError ? (
            <p className="mt-3 text-sm text-danger">{importError}</p>
          ) : null}
          {importPreview ? (
            <div className="mt-3 rounded-xl bg-night/40 p-3 text-sm">
              <p className="text-ivory">
                Xem trước: {importPreview.progress.length} mục tiến độ · xuất
                ngày {importPreview.exportedAt.slice(0, 10)} · phiên bản{" "}
                {importPreview.schemaVersion}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => void doImport("merge")}
                  className="rounded-full bg-corgi px-4 py-1.5 text-xs font-medium text-night"
                >
                  Hợp nhất
                </button>
                <button
                  type="button"
                  onClick={() => void doImport("replace")}
                  className="rounded-full bg-danger/80 px-4 py-1.5 text-xs font-medium text-white"
                >
                  Thay thế
                </button>
                <button
                  type="button"
                  onClick={() => setImportPreview(null)}
                  className="rounded-full px-4 py-1.5 text-xs text-ivory/70"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : null}
        </GlassPanel>
      </div>

      <ConfirmDialog
        open={confirmKind === "clear"}
        title="Xóa toàn bộ tiến độ?"
        message="Toàn bộ tiến độ học và thống kê sẽ bị xóa vĩnh viễn khỏi thiết bị này. Hãy xuất backup trước nếu cần."
        confirmLabel="Xóa"
        danger
        onConfirm={() => void doClear()}
        onCancel={() => setConfirmKind(null)}
      />
      <ConfirmDialog
        open={confirmKind === "reset"}
        title="Khôi phục thiết lập mặc định?"
        message="Các tùy chọn sẽ trở về mặc định. Tiến độ học không bị ảnh hưởng."
        confirmLabel="Khôi phục"
        onConfirm={doReset}
        onCancel={() => setConfirmKind(null)}
      />
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  unit,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
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
          className="w-32 accent-corgi"
        />
        <span className="w-10 text-right text-xs text-ivory/50">
          {value}
          {unit ?? ""}
        </span>
      </span>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-center justify-between gap-4",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      )}
    >
      <span className="text-sm text-ivory/85">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-corgi" : "bg-ivory/20",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-ivory transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </label>
  );
}
