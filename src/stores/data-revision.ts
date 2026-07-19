import { create } from "zustand";

interface DataRevisionState {
  /** Tăng lên mỗi khi dữ liệu tiến độ/thống kê thay đổi ngoài luồng thường
   *  (nhập backup, xóa tiến độ) để các trang tải lại ngay. */
  revision: number;
  bump: () => void;
}

export const useDataRevision = create<DataRevisionState>((set) => ({
  revision: 0,
  bump: () => set((s) => ({ revision: s.revision + 1 })),
}));
