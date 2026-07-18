import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { PawPrint } from "lucide-react";
import { ROUTES } from "@/app/routes";
import { APP_CONFIG } from "@/config/app";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { cn } from "@/utils/cn";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const primaryRoutes = ROUTES.filter((r) => r.primary);

  return (
    <div className="min-h-full">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-corgi focus:px-4 focus:py-2 focus:text-night"
      >
        Bỏ qua đến nội dung chính
      </a>

      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar desktop */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-2 p-4 lg:flex">
          <div className="mb-4 flex items-center gap-2 px-2">
            <PawPrint className="text-corgi" aria-hidden />
            <span className="text-xl font-bold text-ivory">
              {APP_CONFIG.name}
            </span>
          </div>
          <nav aria-label="Điều hướng chính" className="flex flex-col gap-1">
            {ROUTES.map((route) => (
              <NavItem key={route.path} to={route.path}>
                <route.icon size={18} aria-hidden />
                {route.labelVi}
              </NavItem>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 p-4 lg:justify-end">
            <div className="flex items-center gap-2 lg:hidden">
              <PawPrint className="text-corgi" aria-hidden />
              <span className="text-lg font-bold text-ivory">
                {APP_CONFIG.name}
              </span>
            </div>
            <LanguageSwitcher />
          </header>

          <main
            id="main-content"
            className="flex-1 px-4 pb-28 pt-2 lg:pb-8"
            tabIndex={-1}
          >
            {children}
          </main>
        </div>
      </div>

      {/* Bottom navigation mobile */}
      <nav
        aria-label="Điều hướng chính"
        className="glass-strong fixed inset-x-0 bottom-0 z-40 flex justify-around px-1 py-1.5 lg:hidden"
      >
        {primaryRoutes.map((route) => (
          <NavLink
            key={route.path}
            to={route.path}
            className={({ isActive }) =>
              cn(
                "flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[11px]",
                isActive ? "text-corgi" : "text-ivory/70",
              )
            }
          >
            <route.icon size={20} aria-hidden />
            <span className="truncate">{route.labelVi}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function NavItem({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-corgi/20 text-corgi"
            : "text-ivory/75 hover:bg-ivory/5 hover:text-ivory",
        )
      }
    >
      {children}
    </NavLink>
  );
}
