import type { ImageFormatConverterState } from '@/util/interface/Interface';
import type { ImageOutputFormat } from '@/util/interface/Type';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// 90% quality - trang này ưu tiên ĐỔI ĐỊNH DẠNG (jpg/png/webp) hơn là nén
// mạnh tay như Image Compressor (mặc định 80%), nên chọn mốc quality cao hơn
// một chút để giữ chất lượng ảnh, WebP vẫn nhẹ hơn JPEG/PNG đáng kể ở cùng
// mức quality này nhờ thuật toán nén tốt hơn.
const DEFAULT_QUALITY = '90';
// 20% - ngưỡng vừa phải: đủ bắt các biến thiên nhỏ của nền phẳng (nhiễu ảnh,
// bóng mờ) mà không lẹm quá sâu vào chủ thể nếu chủ thể có màu gần nền.
const DEFAULT_BG_TOLERANCE = '20';
const DEFAULT_BG_COLOR = '#FFFFFF';

const initialState: ImageFormatConverterState = {
  originalName: null,
  originalType: null,
  originalSize: null,
  originalDataUrl: null,
  originalWidth: null,
  originalHeight: null,
  targetFormat: 'image/png',
  quality: DEFAULT_QUALITY,
  removeBackground: false,
  bgColor: DEFAULT_BG_COLOR,
  bgTolerance: DEFAULT_BG_TOLERANCE,
  convertedDataUrl: null,
  convertedSize: null,
  convertedWidth: null,
  convertedHeight: null,
  convertedFormat: null,
  error: null,
};

type OriginalImagePayload = {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  width: number;
  height: number;
};

type ConvertedResultPayload = {
  dataUrl: string;
  size: number;
  width: number;
  height: number;
  format: ImageOutputFormat;
};

export const imageFormatConverterSlice = createSlice({
  name: 'imageFormatConverter',
  initialState,
  reducers: {
    setOriginalImage: (state, action: PayloadAction<OriginalImagePayload>) => {
      state.originalName = action.payload.name;
      state.originalType = action.payload.type;
      state.originalSize = action.payload.size;
      state.originalDataUrl = action.payload.dataUrl;
      state.originalWidth = action.payload.width;
      state.originalHeight = action.payload.height;
      // Ảnh mới -> kết quả convert cũ (nếu có) không còn khớp với ảnh đang
      // hiển thị, xoá để tránh hiểu nhầm đang xem kết quả của ảnh vừa tải lên.
      state.convertedDataUrl = null;
      state.convertedSize = null;
      state.convertedWidth = null;
      state.convertedHeight = null;
      state.convertedFormat = null;
      state.error = null;
    },
    setTargetFormat: (state, action: PayloadAction<ImageOutputFormat>) => {
      state.targetFormat = action.payload;
      // JPEG không có kênh alpha - tắt luôn tuỳ chọn xoá nền để tránh trạng
      // thái "đã tick nhưng vô nghĩa" (xem comment ImageFormatConverterState).
      if (action.payload === 'image/jpeg') {
        state.removeBackground = false;
      }
      state.error = null;
    },
    setQuality: (state, action: PayloadAction<string>) => {
      state.quality = action.payload;
      state.error = null;
    },
    setRemoveBackground: (state, action: PayloadAction<boolean>) => {
      state.removeBackground = action.payload;
      state.error = null;
    },
    setBgColor: (state, action: PayloadAction<string>) => {
      state.bgColor = action.payload;
      state.error = null;
    },
    setBgTolerance: (state, action: PayloadAction<string>) => {
      state.bgTolerance = action.payload;
      state.error = null;
    },
    setConvertedResult: (state, action: PayloadAction<ConvertedResultPayload>) => {
      state.convertedDataUrl = action.payload.dataUrl;
      state.convertedSize = action.payload.size;
      state.convertedWidth = action.payload.width;
      state.convertedHeight = action.payload.height;
      state.convertedFormat = action.payload.format;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearImageFormatConverter: () => initialState,
  },
});

export const {
  setOriginalImage,
  setTargetFormat,
  setQuality,
  setRemoveBackground,
  setBgColor,
  setBgTolerance,
  setConvertedResult,
  setError,
  clearImageFormatConverter,
} = imageFormatConverterSlice.actions;

export default imageFormatConverterSlice.reducer;
