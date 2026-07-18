import type { ReactNode } from "react";
import { PageHeader } from "./PageHeader";
import { EmptyState } from "./EmptyState";

interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
  message: string;
  icon?: ReactNode;
}

/**
 * Trang placeholder dùng ở Giai đoạn 0. Mỗi feature sẽ được hiện thực hóa
 * ở các giai đoạn sau, thay thế nội dung EmptyState này.
 */
export function PlaceholderPage({
  title,
  subtitle,
  message,
  icon,
}: PlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <EmptyState title="Đang phát triển" description={message} icon={icon} />
    </div>
  );
}
