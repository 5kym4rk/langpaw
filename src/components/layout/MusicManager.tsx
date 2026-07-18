import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settings-store";
import { musicController } from "@/services/background/music";

/**
 * Đồng bộ thiết lập nhạc nền với bộ điều khiển. Không render gì.
 * Nhạc chỉ bắt đầu khi người dùng bật (musicEnabled) — không tự phát trước.
 */
export function MusicManager() {
  const musicEnabled = useSettingsStore((s) => s.settings.musicEnabled);
  const musicTrack = useSettingsStore((s) => s.settings.musicTrack);
  const musicVolume = useSettingsStore((s) => s.settings.musicVolume);

  useEffect(() => {
    if (!musicEnabled) {
      musicController.stop();
      return;
    }
    musicController.setTrack(musicTrack ?? "none", musicVolume);
  }, [musicEnabled, musicTrack, musicVolume]);

  useEffect(() => {
    musicController.setVolume(musicVolume);
  }, [musicVolume]);

  return null;
}
