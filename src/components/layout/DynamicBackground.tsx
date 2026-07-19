import { useEffect, useRef, useState } from "react";
import { assetUrl, APP_CONFIG } from "@/config/app";
import { useSettingsStore } from "@/stores/settings-store";
import { loadBackgroundManifest } from "@/services/background/background-manifest";
import {
  createBackgroundRotator,
  type BackgroundEntry,
  type BackgroundRotator,
} from "@/services/background/background-rotation";

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

/**
 * Nền Corgi động (§15). Khi không có tài nguyên video hợp lệ, hiển thị gradient
 * ấm áp làm nền tĩnh. Tôn trọng reduced motion, data saver và các thiết lập nền.
 */
export function DynamicBackground() {
  const settings = useSettingsStore((s) => s.settings);
  const [backgrounds, setBackgrounds] = useState<BackgroundEntry[]>([]);
  const [current, setCurrent] = useState<BackgroundEntry | null>(null);
  const rotatorRef = useRef<BackgroundRotator | null>(null);

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
  const allowVideo =
    settings.dynamicBackgroundEnabled &&
    !settings.staticBackgroundMode &&
    !reducedMotion &&
    !dataSaver;

  // Khởi tạo / dừng bộ đổi nền theo thiết lập.
  useEffect(() => {
    rotatorRef.current?.stop();
    rotatorRef.current = null;
    setCurrent(null);

    const pool = backgrounds.filter((b) => b.enabled);
    if (pool.length === 0) return;

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

    // Chỉ chạy vòng đổi (timer) khi được phép phát video động.
    if (allowVideo) {
      rotator.start();
    } else {
      // Chế độ tĩnh: chỉ hiển thị một nền (poster), không tạo timer.
      rotator.advance();
    }

    return () => {
      rotator.stop();
    };
  }, [backgrounds, allowVideo, settings.backgroundCycleMinutes]);

  // Tạm dừng khi tab ẩn, tiếp tục khi hiện lại (không tạo nhiều timer).
  useEffect(() => {
    const onVisibility = () => {
      if (!rotatorRef.current) return;
      if (document.hidden) rotatorRef.current.stop();
      else if (allowVideo) rotatorRef.current.start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [allowVideo]);

  const overlayStyle: React.CSSProperties = {
    backgroundColor: `rgba(10, 14, 24, ${settings.backgroundDarkness})`,
    backdropFilter: settings.backgroundBlurPx
      ? `blur(${settings.backgroundBlurPx}px)`
      : undefined,
  };

  const showVideo = allowVideo && current;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient ấm áp làm nền cơ bản / fallback */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2a1e14] via-night to-[#0d1526]" />

      {current ? (
        <img
          src={assetUrl(current.posterSrc)}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}

      {showVideo ? (
        <video
          key={current.id}
          src={assetUrl(current.videoSrc)}
          poster={assetUrl(current.posterSrc)}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
        />
      ) : null}

      <div className="absolute inset-0" style={overlayStyle} aria-hidden />
    </div>
  );
}
