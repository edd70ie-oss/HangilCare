import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    const { hasError, error } = this.state;
    if (hasError) {
      let errorMessage = "알 수 없는 오류가 발생했습니다.";
      try {
        const parsed = JSON.parse(error?.message || "{}");
        if (parsed.error && parsed.error.includes("insufficient permissions")) {
          errorMessage = "권한이 없습니다. 관리자 계정으로 로그인했는지 확인해주세요.";
        }
      } catch {
        errorMessage = error?.message || errorMessage;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-zinc-50">
          <div className="p-8 bg-white rounded-2xl shadow-sm border border-zinc-200 max-w-md w-full">
            <h2 className="text-2xl font-bold text-zinc-900 mb-4">문제가 발생했습니다</h2>
            <p className="text-zinc-600 mb-6">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors"
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
