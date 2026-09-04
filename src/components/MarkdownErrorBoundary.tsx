import { Component, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  fallback: ReactNode;
  onErrorChange: (hasError: boolean) => void;
  // Đổi giá trị này (vd chính nội dung markdown) để tự thử render lại sau
  // khi lỗi - React error boundary mặc định KHÔNG tự phục hồi khi props con
  // đổi, phải tự phát hiện qua componentDidUpdate.
  resetKey: string;
};

type State = { hasError: boolean };

// React chỉ hỗ trợ "error boundary" (bắt lỗi xảy ra lúc RENDER, không phải
// lúc build/type-check) qua class component - chưa có hook tương đương dù
// đây là component class DUY NHẤT trong codebase (còn lại toàn function
// component). Cần thiết vì markdown lồng nhau quá sâu/bất thường về lý
// thuyết có thể khiến bộ parser đệ quy (remark/unified bên trong
// react-markdown) ném lỗi ngay lúc render - nếu không chặn ở đây, lỗi đó sẽ
// làm SẬP TOÀN BỘ trang (React unmount cả cây), người dùng mất luôn nội
// dung đang gõ.
class MarkdownErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: Props) {
    // Chỉ gọi setState/onErrorChange ở lifecycle method (không phải trong
    // render()) - gọi trong render() sẽ vi phạm quy tắc "render phải thuần
    // khiết" của React, có thể gây warning hoặc vòng lặp cập nhật vô hạn.
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
      this.props.onErrorChange(false);
    }
  }

  componentDidCatch() {
    this.props.onErrorChange(true);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export default MarkdownErrorBoundary;
