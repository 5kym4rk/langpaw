import { assetUrl } from "@/config/app";

export interface MusicTrack {
  id: string;
  labelVi: string;
  /** Đường dẫn tương đối trong public/audio, rỗng nghĩa là không có nhạc. */
  src: string;
}

export const MUSIC_TRACKS: MusicTrack[] = [
  { id: "none", labelVi: "Không có nhạc", src: "" },
  { id: "rain", labelVi: "Tiếng mưa", src: "audio/rain.mp3" },
  { id: "waves", labelVi: "Tiếng sóng", src: "audio/waves.mp3" },
  { id: "forest", labelVi: "Rừng thu", src: "audio/forest.mp3" },
  { id: "water", labelVi: "Dưới nước", src: "audio/water.mp3" },
];

/**
 * Có gói âm thanh hợp lệ hay chưa. Đã kèm nhạc nền ASMR (tách từ video của
 * tác giả 도기코기, được cho phép) — xem ATTRIBUTIONS.md.
 */
export const MUSIC_AVAILABLE = true;

/**
 * Bộ điều khiển nhạc nền. Chỉ phát sau tương tác người dùng (gọi play()).
 * Xử lý lỗi im lặng nếu file nhạc chưa tồn tại (MVP chưa kèm tài nguyên âm thanh).
 */
class MusicController {
  private audio: HTMLAudioElement | null = null;
  private currentTrackId = "none";

  private ensureAudio(): HTMLAudioElement | null {
    if (typeof Audio === "undefined") return null;
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.loop = true;
    }
    return this.audio;
  }

  setTrack(trackId: string, volume: number): void {
    const track = MUSIC_TRACKS.find((t) => t.id === trackId);
    this.currentTrackId = trackId;
    const audio = this.ensureAudio();
    if (!audio) return;

    if (!track || !track.src) {
      audio.pause();
      audio.removeAttribute("src");
      return;
    }
    audio.src = assetUrl(track.src);
    audio.volume = volume;
    void audio.play().catch(() => {
      // Bỏ qua: chưa có file nhạc hoặc trình duyệt chặn tự phát.
    });
  }

  setVolume(volume: number): void {
    if (this.audio) this.audio.volume = volume;
  }

  /** Giảm nhẹ âm lượng khi TTS đang đọc (ducking), sau đó khôi phục. */
  duck(active: boolean, baseVolume: number): void {
    if (this.audio) this.audio.volume = active ? baseVolume * 0.3 : baseVolume;
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute("src");
    }
    this.currentTrackId = "none";
  }

  getCurrentTrackId(): string {
    return this.currentTrackId;
  }
}

export const musicController = new MusicController();
