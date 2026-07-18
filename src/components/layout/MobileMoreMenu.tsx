import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { X } from "lucide-react";
import { SECONDARY_ROUTES } from "@/app/routes";
import { cn } from "@/utils/cn";

interface MobileMoreMenuProps {
  open: boolean;
  onClose: () => void;
  id: string;
}

export function MobileMoreMenu({ open, onClose, id }: MobileMoreMenuProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const sheet = sheetRef.current;
    // Focus phần tử đầu tiên trong sheet.
    const focusables = sheet?.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled])",
    );
    focusables?.[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:hidden"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" aria-hidden />
      <div
        ref={sheetRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label="Menu điều hướng thêm"
        onClick={(e) => e.stopPropagation()}
        className="glass-strong relative w-full rounded-t-xl2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ivory">Thêm</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-full p-2 text-ivory/70 hover:bg-ivory/10"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="grid grid-cols-2 gap-2" aria-label="Điều hướng thêm">
          {SECONDARY_ROUTES.map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              end={route.path === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex min-h-[44px] items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium",
                  isActive
                    ? "bg-corgi/20 text-corgi"
                    : "bg-ivory/5 text-ivory/85 hover:bg-ivory/10",
                )
              }
            >
              <route.icon size={18} aria-hidden />
              {route.labelVi}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
