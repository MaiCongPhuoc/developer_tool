import type { HtmlPreviewState } from '@/util/interface/Interface';
import { DEFAULT_HTML, MAX_HTML_LENGTH } from '@/util/htmlPreview';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState: HtmlPreviewState = {
  html: DEFAULT_HTML,
  copiedField: null,
  error: null,
};

export const htmlPreviewSlice = createSlice({
  name: 'htmlPreview',
  initialState,
  reducers: {
    // Không có "generate"/"render" riêng - đây LÀ hành động cập nhật kết quả
    // luôn (real-time preview, giống markdownSlice.setMarkdown). Chỉ cắt bớt
    // khi vượt giới hạn độ dài (không có rào chắn "lồng nhau" như markdown vì
    // bộ parser HTML gốc của trình duyệt không đệ quy kiểu remark/rehype -
    // không có rủi ro crash tab đã biết với input lồng sâu).
    setHtml: (state, action: PayloadAction<string>) => {
      if (action.payload.length > MAX_HTML_LENGTH) {
        state.html = action.payload.slice(0, MAX_HTML_LENGTH);
        state.error = `Content was truncated to ${MAX_HTML_LENGTH.toLocaleString()} characters (maximum allowed).`;
        return;
      }
      state.html = action.payload;
      state.error = null;
    },
    setCopiedField: (
      state,
      action: PayloadAction<HtmlPreviewState['copiedField']>
    ) => {
      state.copiedField = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    // Dùng lúc MỚI VÀO TRANG (useEffect mount) - luôn hiện sẵn nội dung mẫu.
    resetHtmlPreview: () => initialState,
    // Dùng khi bấm nút "Clear" - XOÁ TRẮNG hẳn nội dung đang gõ (khác lúc mới
    // vào trang), đúng nghĩa "Clear" cho 1 khung soạn thảo tự do.
    clearHtmlPreview: (state) => {
      state.html = '';
      state.copiedField = null;
      state.error = null;
    },
  },
});

export const {
  setHtml,
  setCopiedField,
  setError,
  resetHtmlPreview,
  clearHtmlPreview,
} = htmlPreviewSlice.actions;

export default htmlPreviewSlice.reducer;
