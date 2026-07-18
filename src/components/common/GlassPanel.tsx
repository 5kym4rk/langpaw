import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
  strong?: boolean;
}

export function GlassPanel({
  children,
  className,
  as: Tag = "div",
  strong = false,
}: GlassPanelProps) {
  return (
    <Tag
      className={cn(
        strong ? "glass-strong" : "glass",
        "rounded-xl2 p-5 shadow-lg",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
