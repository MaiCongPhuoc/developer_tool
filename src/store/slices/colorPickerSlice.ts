import type { ColorPickerState } from '@/util/interface/Interface';
import type { ColorPickerTab } from '@/util/interface/Type';
import { getColorPreviewHex } from '@/util/color';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Màu mặc định khi mới vào trang VÀ khi bấm Clear ở CẢ 2 tab - đen tuyền,
// không phải màu ngẫu nhiên nào khác.
const DEFAULT_HEX = '#000000';

const initialState: ColorPickerState = {
  tab: 'palette',
  hex: DEFAULT_HEX,
  hexInput: DEFAULT_HEX,
  copiedField: null,
  error: null,
  uploadedImage: null,
};

export const colorPickerSlice = createSlice({
  name: 'colorPicker',
  initialState,
  reducers: {
    setTab: (state, action: PayloadAction<ColorPickerTab>) => {
      state.tab = action.payload;
      state.error = null;
    },
    // Dùng chung cho input[type=color], preset swatch, VÀ ống hút màu trên
    // ảnh (canvas) - cả 3 nguồn này luôn cho ra hex hợp lệ sẵn, không cần
    // validate lại như ô gõ tay.
    setColor: (state, action: PayloadAction<string>) => {
      state.hex = action.payload;
      state.hexInput = action.payload;
      state.error = null;
    },
    setHexInput: (state, action: PayloadAction<string>) => {
      state.hexInput = action.payload;
      state.error = null;
    },
    applyHexInput: (state) => {
      const preview = getColorPreviewHex(state.hexInput, 'hex');
      if (!preview) {
        state.error = `"${state.hexInput}" is not a valid HEX color. Expected format: #RRGGBB or #RGB.`;
        return;
      }
      state.hex = preview;
      state.hexInput = preview;
      state.error = null;
    },
    setCopiedField: (
      state,
      action: PayloadAction<ColorPickerState['copiedField']>
    ) => {
      state.copiedField = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    setUploadedImage: (state, action: PayloadAction<string | null>) => {
      state.uploadedImage = action.payload;
      state.error = null;
    },
    // 2 hành động Clear TÁCH RIÊNG theo tab (không dùng chung 1
    // clearColorPicker cho nút Clear) - cả 2 đều đưa màu về DEFAULT_HEX như
    // nhau, nhưng Eyedropper có thêm bước xoá ảnh đã tải lên (Palette không
    // có khái niệm "ảnh" nên không cần). Cả 2 đều KHÔNG đổi `tab` - ở lại
    // đúng tab đang bấm Clear.
    clearPalette: (state) => {
      state.hex = DEFAULT_HEX;
      state.hexInput = DEFAULT_HEX;
      state.copiedField = null;
      state.error = null;
    },
    clearEyedropper: (state) => {
      state.uploadedImage = null;
      state.hex = DEFAULT_HEX;
      state.hexInput = DEFAULT_HEX;
      state.copiedField = null;
      state.error = null;
    },
    // Chỉ dùng lúc MỚI VÀO trang (useEffect mount) - reset về trạng thái ban
    // đầu hoàn toàn (kể cả tab), khác 2 hành động Clear ở trên vốn giữ
    // nguyên tab hiện tại.
    clearColorPicker: () => initialState,
  },
});

export const {
  setTab,
  setColor,
  setHexInput,
  applyHexInput,
  setCopiedField,
  setError,
  setUploadedImage,
  clearPalette,
  clearEyedropper,
  clearColorPicker,
} = colorPickerSlice.actions;

export default colorPickerSlice.reducer;
