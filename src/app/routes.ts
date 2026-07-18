import type { LucideIcon } from "lucide-react";
import {
  Home,
  GraduationCap,
  Headphones,
  ListChecks,
  RefreshCw,
  Briefcase,
  BarChart3,
  BookMarked,
  Settings,
} from "lucide-react";

export interface RouteMeta {
  path: string;
  labelVi: string;
  icon: LucideIcon;
  /** Hiển thị trong bottom navigation trên mobile. */
  primary: boolean;
}

export const ROUTES: RouteMeta[] = [
  { path: "/", labelVi: "Trang chủ", icon: Home, primary: true },
  { path: "/learn", labelVi: "Học từ", icon: GraduationCap, primary: true },
  { path: "/review", labelVi: "Ôn tập", icon: RefreshCw, primary: true },
  { path: "/interview", labelVi: "Phỏng vấn", icon: Briefcase, primary: true },
  { path: "/listen", labelVi: "Luyện nghe", icon: Headphones, primary: false },
  { path: "/quiz", labelVi: "Kiểm tra", icon: ListChecks, primary: false },
  { path: "/progress", labelVi: "Tiến độ", icon: BarChart3, primary: false },
  {
    path: "/sources",
    labelVi: "Nguồn dữ liệu",
    icon: BookMarked,
    primary: false,
  },
  { path: "/settings", labelVi: "Cài đặt", icon: Settings, primary: false },
];

/** Các route hiển thị trực tiếp trên bottom navigation mobile. */
export const PRIMARY_ROUTES = ROUTES.filter((r) => r.primary);

/** Các route phụ, truy cập qua nút "Thêm" trên mobile. */
export const SECONDARY_ROUTES = ROUTES.filter((r) => !r.primary);
