import { useEffect, useRef, useState } from "react";
import { Mic, Square, Play, Trash2, Timer } from "lucide-react";
import { GlassPanel } from "@/components/common/GlassPanel";
import type { InterviewQuestion } from "@/config/interview";

type Stage = "idle" | "prep" | "answer" | "done";

const PREP_SECONDS = 30;
const ANSWER_SECONDS = 90;

interface Recording {
  id: string;
  url: string;
  createdAt: string;
}

function supportsRecording(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    typeof MediaRecorder !== "undefined"
  );
}

export function AnswerPractice({ question }: { question: InterviewQuestion }) {
  const [stage, setStage] = useState<Stage>("idle");
  const [seconds, setSeconds] = useState(0);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canRecord = supportsRecording();

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  };

  // Cleanup khi unmount hoặc đổi câu hỏi.
  useEffect(() => {
    return () => {
      clearTimer();
      stopRecording();
      stopStream();
    };
  }, [question.id]);

  // Đổi câu hỏi → về trạng thái đầu.
  useEffect(() => {
    setStage("idle");
    setSeconds(0);
    setError(null);
  }, [question.id]);

  const startAnswer = async () => {
    clearTimer();
    setStage("answer");
    setSeconds(ANSWER_SECONDS);

    if (canRecord) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream;
        chunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const url = URL.createObjectURL(blob);
          setRecordings((prev) => [
            {
              id: crypto.randomUUID(),
              url,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ]);
          stopStream();
        };
        recorderRef.current = recorder;
        recorder.start();
      } catch {
        setError(
          "Không truy cập được micro. Bạn vẫn có thể luyện theo đồng hồ.",
        );
      }
    }

    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          finishAnswer();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const startPrep = () => {
    setError(null);
    clearTimer();
    setStage("prep");
    setSeconds(PREP_SECONDS);
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          void startAnswer();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const finishAnswer = () => {
    clearTimer();
    stopRecording();
    setStage("done");
  };

  const removeRecording = (id: string) => {
    setRecordings((prev) => {
      const target = prev.find((r) => r.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((r) => r.id !== id);
    });
  };

  return (
    <GlassPanel strong>
      <p className="text-xs uppercase tracking-wide text-ivory/40">
        {question.category}
      </p>
      <h3 className="mt-1 text-lg font-semibold text-ivory">
        {question.questionEn}
      </h3>
      <p className="text-sm text-ivory/60">{question.questionVi}</p>

      <div className="mt-4 flex items-center gap-3">
        <Timer size={18} className="text-corgi" aria-hidden />
        <span
          className="text-2xl font-bold tabular-nums text-ivory"
          aria-live="polite"
        >
          {stage === "prep"
            ? `Chuẩn bị: ${seconds}s`
            : stage === "answer"
              ? `Trả lời: ${seconds}s`
              : "0s"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {stage === "idle" || stage === "done" ? (
          <button
            type="button"
            onClick={startPrep}
            className="rounded-full bg-corgi px-5 py-2.5 font-medium text-night"
          >
            Bắt đầu (chuẩn bị {PREP_SECONDS}s)
          </button>
        ) : null}
        {stage === "prep" ? (
          <button
            type="button"
            onClick={() => void startAnswer()}
            className="flex items-center gap-2 rounded-full bg-corgi px-5 py-2.5 font-medium text-night"
          >
            <Mic size={18} /> Trả lời ngay
          </button>
        ) : null}
        {stage === "answer" ? (
          <button
            type="button"
            onClick={finishAnswer}
            className="flex items-center gap-2 rounded-full bg-danger px-5 py-2.5 font-medium text-white"
          >
            <Square size={16} /> Dừng
          </button>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {!canRecord ? (
        <p className="mt-3 text-xs text-ivory/40">
          Trình duyệt không hỗ trợ ghi âm; bạn vẫn luyện được theo đồng hồ. Bản
          ghi (nếu có) chỉ lưu trên máy, không tải lên máy chủ.
        </p>
      ) : (
        <p className="mt-3 text-xs text-ivory/40">
          Bản ghi chỉ lưu tạm trên máy trong phiên này, không tải lên máy chủ.
        </p>
      )}

      {recordings.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {recordings.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-xl bg-night/40 p-2"
            >
              <Play size={16} className="text-corgi" aria-hidden />
              <audio controls src={r.url} className="h-8 flex-1" />
              <button
                type="button"
                onClick={() => removeRecording(r.id)}
                aria-label="Xóa bản ghi"
                className="rounded-full p-2 text-ivory/60 hover:bg-ivory/10"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-corgi">
          Xem gợi ý trả lời
        </summary>
        <div className="mt-2 rounded-xl bg-night/40 p-3 text-sm">
          <p className="mb-1 font-medium text-ivory/80">Ý chính:</p>
          <ul className="mb-2 list-inside list-disc text-ivory/70">
            {question.keyPointsVi.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
          <p className="text-ivory">{question.sampleAnswerEn}</p>
        </div>
      </details>
    </GlassPanel>
  );
}
