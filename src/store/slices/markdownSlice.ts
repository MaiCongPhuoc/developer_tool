import type { MarkdownPreviewState } from '@/util/interface/Interface';
import {
  DEFAULT_MARKDOWN,
  hasExcessiveNesting,
  MAX_MARKDOWN_LENGTH,
} from '@/util/markdown';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState: MarkdownPreviewState = {
  markdown: DEFAULT_MARKDOWN,
  copiedField: null,
  error: null,
};

export const markdownSlice = createSlice({
  name: 'markdown',
  initialState,
  reducers: {
    // Không có "generate"/"convert" riêng - đây LÀ hành động cập nhật kết
    // quả luôn (real-time preview), khác mọi trang trước phải bấm nút mới
    // tính. Vẫn chặn độ dài quá lớn để tránh giật khi gõ.
    setMarkdown: (state, action: PayloadAction<string>) => {
      // RÀO CHẮN AN TOÀN THẬT SỰ (không chỉ giới hạn cho đẹp) - markdown có
      // dòng lồng nhau quá sâu (nhiều dấu ">" hoặc thụt lề liên tiếp) đã
      // được kiểm chứng THỰC TẾ là làm CRASH HẲN TAB TRÌNH DUYỆT khi
      // react-markdown parse (không phải lỗi JS bắt được bằng error boundary
      // - xem util/markdown.ts). Phải chặn TỪ CHỐI HOÀN TOÀN ở đây (giữ
      // nguyên state.markdown cũ, không cắt/sửa gì) TRƯỚC KHI nội dung này
      // có cơ hội chạm tới react-markdown.
      if (hasExcessiveNesting(action.payload)) {
        state.error =
          'This content has an unusually deep nesting level (too many ">" or indented lines in a row) and was rejected to prevent the browser tab from crashing. Please reduce the nesting.';
        return;
      }
      // Cắt bớt (thay vì từ chối toàn bộ) khi vượt giới hạn ĐỘ DÀI - khác
      // với trường hợp lồng nhau ở trên, đây chỉ là giới hạn hiệu năng, cắt
      // bớt vẫn ra nội dung AN TOÀN để hiển thị, nên không cần từ chối hẳn.
      if (action.payload.length > MAX_MARKDOWN_LENGTH) {
        state.markdown = action.payload.slice(0, MAX_MARKDOWN_LENGTH);
        state.error = `Content was truncated to ${MAX_MARKDOWN_LENGTH.toLocaleString()} characters (maximum allowed).`;
        return;
      }
      state.markdown = action.payload;
      state.error = null;
    },
    setCopiedField: (
      state,
      action: PayloadAction<MarkdownPreviewState['copiedField']>
    ) => {
      state.copiedField = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    // Dùng lúc MỚI VÀO TRANG (useEffect mount) - luôn hiện sẵn nội dung mẫu
    // để người dùng thấy ngay công cụ hoạt động ra sao, giống mọi trang khác.
    resetMarkdown: () => initialState,
    // Dùng khi bấm nút "Clear" - XOÁ TRẮNG hẳn nội dung đang gõ (khác với
    // lúc mới vào trang ở trên) - đúng nghĩa "Clear" người dùng mong đợi cho
    // 1 khung soạn thảo tự do, không phải quay lại nội dung mẫu.
    clearMarkdown: (state) => {
      state.markdown = '';
      state.copiedField = null;
      state.error = null;
    },
  },
});

export const {
  setMarkdown,
  setCopiedField,
  setError,
  resetMarkdown,
  clearMarkdown,
} = markdownSlice.actions;

export default markdownSlice.reducer;
