import { create } from "zustand";

export type ToastTone = "info" | "success" | "error";

export interface Toast {
  id: string;
  text: string;
  tone: ToastTone;
}

interface ToastState {
  toasts: Toast[];
  push: (text: string, tone?: ToastTone) => void;
  dismiss: (id: string) => void;
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  push: (text, tone = "info") =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        {
          id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : String(Date.now() + Math.random()),
          text,
          tone,
        },
      ],
    })),
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
