import { useEffect, useMemo, useRef, useState } from "react";
import { assetUrl, APP_CONFIG } from "@/config/app";
import { useSettingsStore } from "@/stores/settings-store";
import { loadBackgroundManifest } from "@/services/background/background-manifest";
import {
  createBackgroundRotator,
  type BackgroundEntry,
  type BackgroundRotator,
} from "@/services/background/background-rotation";
import {
  selectBackgroundAssets,
  detectDeviceCapability,
  type SelectedAssets,
} from "@/services/background/background-capability";

const RESTORE_KEY = "langpaw.background.current";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

function isDataSaver(): boolean {
  const conn = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  return Boolean(conn?.saveData);
}

interface Layer {
  key: string;
  assets: SelectedAssets;
}

/**
 * Nền Corgi động (§13, §20–24). Chọn tài nguyên theo năng lực thiết bị, đổi nền
 * bằng crossfade hai lớp (§21), tôn trọng reduced motion / data saver / khóa
 * scene. Khi chưa có tài nguyên hợp lệ, hiển thị gradient ấm áp làm nền tĩnh.
 */
export function DynamicBackground() {
  const settings = useSettingsStore((s) => s.settings);
  const [backgrounds, setBackgrounds] = useState<BackgroundEntry[]>([]);
  const [current, setCurrent] = useState<BackgroundEntry | null>(null);
  const rotatorRef = useRef<BackgroundRotator | null>(null);

  // Hai lớp cho crossfade; `front` là lớp đang hiển thị.
  const [layers, setLayers] = useState<{ a: Layer | null; b: Layer | null }>({
    a: null,
    b: null,
  });
  const [front, setFront] = useState<"a" | "b">("a");

  useEffect(() => {
    let active = true;
    void loadBackgroundManifest().then((list) => {
      if (active) setBackgrounds(list);
    });
    return () => {
      active = false;
    };
  }, []);

  const reducedMotion = settings.reducedMotion || prefersReducedMotion();
  const dataSaver = settings.dataSaver || isDataSaver();

  // Chế độ "chỉ ảnh tĩnh" tắt video như reduced motion (§20, §23).
  const noVideo = reducedMotion || settings.staticBackgroundMode;
  const capability = useMemo(
    () =>
      detectDeviceCapability(settings.backgroundQuality, noVideo, dataSaver),
    [settings.backgroundQuality, noVideo, dataSaver],
  );

  // Đổi scene → nạp vào lớp sau rồi crossfade sang (§21).
  useEffect(() => {
    if (!current) return;
    const assets = selectBackgroundAssets(current, capability);
    const next: Layer = { key: current.id, assets };
    setLayers((prev) =>
      front === "a" ? { ...prev, b: next } : { ...prev, a: next },
    );
    setFront((f) => (f === "a" ? "b" : "a"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, capability]);

  const shouldRotate =
    settings.dynamicBackgroundEnabled && !settings.backgroundLocked;

  // Khởi tạo / dừng bộ đổi nền theo thiết lập.
  useEffect(() => {
    rotatorRef.current?.stop();
    rotatorRef.current = null;

    const pool = backgrounds.filter((b) => b.enabled);
    if (!settings.dynamicBackgroundEnabled || pool.length === 0) {
      setCurrent(null);
      return;
    }

    const initialId =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(RESTORE_KEY)
        : null;

    const rotator = createBackgroundRotator({
      backgrounds,
      intervalMs:
        (settings.backgroundCycleMinutes || 10) * 60_000 ||
        APP_CONFIG.backgroundRotationMs,
      initialId,
      onChange: (entry) => {
        setCurrent(entry);
        try {
          localStorage.setItem(RESTORE_KEY, entry.id);
        } catch {
          /* bỏ qua */
        }
      },
    });
    rotatorRef.current = rotator;

    if (shouldRotate && pool.length >= 2) {
      rotator.start();
    } else {
      rotator.advance(); // Hiển thị một scene, không tạo timer (khóa/1 scene).
    }

    return () => rotator.stop();
  }, [
    backgrounds,
    shouldRotate,
    settings.dynamicBackgroundEnabled,
    settings.backgroundCycleMinutes,
  ]);

  // Nút "Đổi nền ngay" từ Settings (§22 — manual next, không tạo timer mới).
  useEffect(() => {
    const onManualNext = () => rotatorRef.current?.advance();
    window.addEventListener("langpaw:bg-next", onManualNext);
    return () => window.removeEventListener("langpaw:bg-next", onManualNext);
  }, []);

  // Tạm dừng khi tab ẩn, tiếp tục khi hiện lại (không tạo nhiều timer).
  useEffect(() => {
    const onVisibility = () => {
      if (!rotatorRef.current) return;
      if (document.hidden) rotatorRef.current.stop();
      else if (shouldRotate) rotatorRef.current.start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [shouldRotate]);

  const overlayStyle: React.CSSProperties = {
    backgroundColor: `rgba(10, 14, 24, ${settings.backgroundDarkness})`,
    backdropFilter: settings.backgroundBlurPx
      ? `blur(${settings.backgroundBlurPx}px)`
      : undefined,
  };

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient ấm áp làm nền cơ bản / fallback cuối cùng (§21). */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2a1e14] via-night to-[#0d1526]" />

      <BackgroundLayer layer={layers.a} visible={front === "a"} />
      <BackgroundLayer layer={layers.b} visible={front === "b"} />

      <div className="absolute inset-0" style={overlayStyle} aria-hidden />
    </div>
  );
}

function BackgroundLayer({
  layer,
  visible,
}: {
  layer: Layer | null;
  visible: boolean;
}) {
  if (!layer) return null;
  const { poster, video } = layer.assets;
  return (
    <div
      aria-hidden
      className="absolute inset-0 transition-opacity duration-[1600ms] ease-in-out"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {poster ? (
        <img
          src={assetUrl(poster)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      {video ? (
        <video
          key={layer.key}
          src={assetUrl(video)}
          poster={poster ? assetUrl(poster) : undefined}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
    </div>
  );
}
