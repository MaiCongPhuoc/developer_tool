import type { ImageCompressorState } from '@/util/interface/Interface';
import type { ImageOutputFormat } from '@/util/interface/Type';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// 1920px (chiều dài cạnh dài nhất) - ảnh Full HD trên màn hình vẫn sắc nét,
// trong khi hầu hết ảnh chụp điện thoại/máy ảnh hiện đại (3000-6000px+) sẽ bị
// co nhỏ đáng kể, cắt giảm dung lượng rõ rệt mà mắt thường khó nhận ra khác
// biệt khi xem trên màn hình. 80% quality là mức cân bằng phổ biến giữa dung
// lượng và chất lượng cho JPEG/WebP.
const DEFAULT_QUALITY = '80';
const DEFAULT_MAX_DIMENSION = '1920';

const initialState: ImageCompressorState = {
  originalName: null,
  originalType: null,
  originalSize: null,
  originalDataUrl: null,
  originalWidth: null,
  originalHeight: null,
  format: 'image/jpeg',
  quality: DEFAULT_QUALITY,
  maxDimension: DEFAULT_MAX_DIMENSION,
  compressedDataUrl: null,
  compressedSize: null,
  compressedWidth: null,
  compressedHeight: null,
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

type CompressedResultPayload = {
  dataUrl: string;
  size: number;
  width: number;
  height: number;
};

export const imageCompressorSlice = createSlice({
  name: 'imageCompressor',
  initialState,
  reducers: {
    setOriginalImage: (state, action: PayloadAction<OriginalImagePayload>) => {
      state.originalName = action.payload.name;
      state.originalType = action.payload.type;
      state.originalSize = action.payload.size;
      state.originalDataUrl = action.payload.dataUrl;
      state.originalWidth = action.payload.width;
      state.originalHeight = action.payload.height;
      // Ảnh mới -> kết quả nén cũ (nếu có) không còn khớp với ảnh đang hiển
      // thị, xoá để tránh hiểu nhầm đang xem kết quả nén của ảnh vừa tải lên.
      state.compressedDataUrl = null;
      state.compressedSize = null;
      state.compressedWidth = null;
      state.compressedHeight = null;
      state.error = null;
    },
    setFormat: (state, action: PayloadAction<ImageOutputFormat>) => {
      state.format = action.payload;
      state.error = null;
    },
    setQuality: (state, action: PayloadAction<string>) => {
      state.quality = action.payload;
      state.error = null;
    },
    setMaxDimension: (state, action: PayloadAction<string>) => {
      state.maxDimension = action.payload;
      state.error = null;
    },
    setCompressedResult: (
      state,
      action: PayloadAction<CompressedResultPayload>
    ) => {
      state.compressedDataUrl = action.payload.dataUrl;
      state.compressedSize = action.payload.size;
      state.compressedWidth = action.payload.width;
      state.compressedHeight = action.payload.height;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearImageCompressor: () => initialState,
  },
});

export const {
  setOriginalImage,
  setFormat,
  setQuality,
  setMaxDimension,
  setCompressedResult,
  setError,
  clearImageCompressor,
} = imageCompressorSlice.actions;

export default imageCompressorSlice.reducer;
