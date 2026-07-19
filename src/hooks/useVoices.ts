import { useEffect, useState } from "react";
import { speechService } from "@/services/speech/speech-service";

/**
 * Trả về danh sách giọng đọc, chờ sự kiện voiceschanged nếu cần.
 * Nếu truyền `locale`, lọc theo phần ngôn ngữ (vd "en" khớp "en-US", "en-GB").
 */
export function useVoices(locale?: string): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    let active = true;
    void speechService.ready().then((all) => {
      if (active) setVoices(all);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!locale) return voices;
  const lang = locale.toLowerCase().split("-")[0];
  return voices.filter((v) => v.lang.toLowerCase().split("-")[0] === lang);
}
