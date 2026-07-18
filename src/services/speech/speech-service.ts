export interface SpeakOptions {
  lang: string;
  voiceURI?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface SpeechService {
  getVoices(): SpeechSynthesisVoice[];
  speak(text: string, options: SpeakOptions): Promise<void>;
  cancel(): void;
  pause(): void;
  resume(): void;
  isSupported(): boolean;
  /** Chờ danh sách giọng sẵn sàng (sự kiện voiceschanged). */
  ready(): Promise<SpeechSynthesisVoice[]>;
  /** Chọn giọng phù hợp nhất cho locale, hoặc null nếu không có. */
  pickVoice(locale: string, voiceURI?: string): SpeechSynthesisVoice | null;
}

function isSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
}

function normalizeLocale(locale: string): string {
  return locale.toLowerCase();
}

/** Chọn giọng khớp locale chính xác, rồi khớp phần ngôn ngữ (vd "en"). */
function pickVoice(
  locale: string,
  voiceURI?: string,
): SpeechSynthesisVoice | null {
  if (!isSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  if (voiceURI) {
    const exact = voices.find((v) => v.voiceURI === voiceURI);
    if (exact) return exact;
  }

  const target = normalizeLocale(locale);
  const lang = target.split("-")[0];

  // 1) Khớp chính xác locale.
  const exactLocale = voices.find((v) => normalizeLocale(v.lang) === target);
  if (exactLocale) return exactLocale;

  // 2) Khớp cùng ngôn ngữ (locale gần nhất).
  const sameLang = voices.find(
    (v) => normalizeLocale(v.lang).split("-")[0] === lang,
  );
  if (sameLang) return sameLang;

  return null;
}

function ready(): Promise<SpeechSynthesisVoice[]> {
  if (!isSupported()) return Promise.resolve([]);
  const synth = window.speechSynthesis;
  const current = synth.getVoices();
  if (current.length > 0) return Promise.resolve(current);

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve(synth.getVoices());
    };
    synth.addEventListener("voiceschanged", finish, { once: true });
    // Fallback nếu sự kiện không bắn (một số trình duyệt).
    setTimeout(finish, 1000);
  });
}

function speak(text: string, options: SpeakOptions): Promise<void> {
  if (!isSupported() || !text.trim()) return Promise.resolve();

  const synth = window.speechSynthesis;
  // Không phát chồng chéo: hủy phát âm hiện tại trước (yêu cầu §2.3, §11.3).
  synth.cancel();

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang;
    utterance.rate = options.rate ?? 1;
    utterance.pitch = options.pitch ?? 1;
    utterance.volume = options.volume ?? 1;

    const voice = pickVoice(options.lang, options.voiceURI);
    if (voice) utterance.voice = voice;

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve(); // Không reject để không làm vỡ luồng UI.

    synth.speak(utterance);
  });
}

export const speechService: SpeechService = {
  isSupported,
  getVoices: () => (isSupported() ? window.speechSynthesis.getVoices() : []),
  ready,
  pickVoice,
  speak,
  cancel: () => {
    if (isSupported()) window.speechSynthesis.cancel();
  },
  pause: () => {
    if (isSupported()) window.speechSynthesis.pause();
  },
  resume: () => {
    if (isSupported()) window.speechSynthesis.resume();
  },
};
