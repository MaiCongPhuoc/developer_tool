import type { DocumentConverterState } from '@/util/interface/Interface';
import type { DocumentFormat } from '@/util/interface/Type';
import { getDefaultTargetFormat } from '@/util/documentConverter';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState: DocumentConverterState = {
  originalName: null,
  originalType: null,
  originalSize: null,
  originalDataUrl: null,
  originalFormat: null,
  previewHtml: null,
  previewImageDataUrl: null,
  targetFormat: 'pdf',
  convertedDataUrl: null,
  convertedSize: null,
  convertedFileName: null,
  error: null,
};

type OriginalFilePayload = {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  format: DocumentFormat;
};

type PreviewPayload = {
  html: string | null;
  imageDataUrl: string | null;
};

type ConvertedResultPayload = {
  dataUrl: string;
  size: number;
  fileName: string;
};

export const documentConverterSlice = createSlice({
  name: 'documentConverter',
  initialState,
  reducers: {
    setOriginalFile: (state, action: PayloadAction<OriginalFilePayload>) => {
      state.originalName = action.payload.name;
      state.originalType = action.payload.type;
      state.originalSize = action.payload.size;
      state.originalDataUrl = action.payload.dataUrl;
      state.originalFormat = action.payload.format;
      // File mới -> preview/kết quả cũ (nếu có) không còn khớp, xoá để tránh
      // hiểu nhầm đang xem preview/kết quả của file vừa tải lên.
      state.previewHtml = null;
      state.previewImageDataUrl = null;
      state.convertedDataUrl = null;
      state.convertedSize = null;
      state.convertedFileName = null;
      state.error = null;
      // Tự chọn 1 định dạng đích hợp lý khác với chính định dạng nguồn -
      // convert file sang chính nó là vô nghĩa (xem getDefaultTargetFormat).
      state.targetFormat = getDefaultTargetFormat(action.payload.format);
    },
    setPreview: (state, action: PayloadAction<PreviewPayload>) => {
      state.previewHtml = action.payload.html;
      state.previewImageDataUrl = action.payload.imageDataUrl;
    },
    setTargetFormat: (state, action: PayloadAction<DocumentFormat>) => {
      state.targetFormat = action.payload;
      // Kết quả cũ (nếu có) là của ĐỊNH DẠNG CŨ - đổi tab đích mà vẫn giữ
      // nguyên convertedFileName/convertedDataUrl sẽ ra tình trạng tên file
      // vẫn là "...pdf" nhưng nhãn hiển thị lại đọc theo targetFormat MỚI
      // (vd "Word"), gây sai lệch tên/nhãn dù bấm Download vẫn ra đúng file
      // CŨ (bug đã gặp 2026-09-14). Xoá kết quả cũ để bắt buộc bấm Convert
      // lại - vừa hết sai lệch, vừa đúng mong muốn "đổi tab thì kết quả cũ
      // biến mất" của người dùng.
      state.convertedDataUrl = null;
      state.convertedSize = null;
      state.convertedFileName = null;
      state.error = null;
    },
    setConvertedResult: (state, action: PayloadAction<ConvertedResultPayload>) => {
      state.convertedDataUrl = action.payload.dataUrl;
      state.convertedSize = action.payload.size;
      state.convertedFileName = action.payload.fileName;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearDocumentConverter: () => initialState,
  },
});

export const {
  setOriginalFile,
  setPreview,
  setTargetFormat,
  setConvertedResult,
  setError,
  clearDocumentConverter,
} = documentConverterSlice.actions;

export default documentConverterSlice.reducer;
