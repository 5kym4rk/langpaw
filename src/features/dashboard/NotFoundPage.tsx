import { Link } from "react-router-dom";
import { EmptyState } from "@/components/common/EmptyState";
import { Compass } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="pt-8">
      <EmptyState
        title="Không tìm thấy trang"
        description="Đường dẫn bạn truy cập không tồn tại."
        icon={<Compass size={40} />}
        action={
          <Link
            to="/"
            className="mt-2 rounded-full bg-corgi px-5 py-2 font-medium text-night"
          >
            Về trang chủ
          </Link>
        }
      />
    </div>
  );
}
