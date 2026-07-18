import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Không hiển thị stack trace cho người dùng cuối, chỉ log để phát triển.
    console.error("LangPaw ErrorBoundary:", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="glass mx-auto mt-16 max-w-md rounded-xl2 p-6 text-center">
            <h2 className="text-lg font-semibold text-danger">Đã xảy ra lỗi</h2>
            <p className="mt-2 text-sm text-ivory/70">
              Ứng dụng gặp sự cố không mong muốn. Vui lòng tải lại trang.
            </p>
            <button
              type="button"
              className="mt-4 rounded-full bg-corgi px-5 py-2 font-medium text-night"
              onClick={() => window.location.reload()}
            >
              Tải lại
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
