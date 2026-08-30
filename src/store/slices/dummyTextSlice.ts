import type { DummyTextState } from '@/util/interface/Interface';
import { generateLoremIpsum } from '@/util/loremIpsum';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState: DummyTextState = {
  charCount: '',
  generatedText: '',
  error: null,
  copied: false,
};

// Chặn số quá lớn để tránh treo trình duyệt khi build chuỗi.
const MAX_CHAR_COUNT = 100000;

export const dummyTextSlice = createSlice({
  name: 'dummyText',
  initialState,
  reducers: {
    setCharCount: (state, action: PayloadAction<string>) => {
      state.charCount = action.payload;
      state.error = null;
    },
    generateText: (state) => {
      const trimmed = state.charCount.trim();
      // Chỉ chấp nhận chuỗi số nguyên thuần (chữ số thập phân, có thể có dấu
      // trừ) - dùng thẳng `Number(trimmed)` sẽ vô tình chấp nhận cả các dạng
      // JS hiểu là số nhưng người dùng phổ thông không mong đợi ở 1 ô nhập
      // "số ký tự" đơn giản, vd "0x10" (hex, ra 16) hay "1e2" (khoa học, ra
      // 100) - những giá trị này lẽ ra phải bị coi là input không hợp lệ.
      const isPlainInteger = /^-?\d+$/.test(trimmed);
      const length = Number(trimmed);

      if (!trimmed || !isPlainInteger || !Number.isInteger(length)) {
        state.error = 'Please enter a valid integer number of characters.';
        state.generatedText = '';
        return;
      }
      if (length <= 0) {
        state.error = 'Number of characters must be greater than 0.';
        state.generatedText = '';
        return;
      }
      if (length > MAX_CHAR_COUNT) {
        state.error = `Number of characters must not exceed ${MAX_CHAR_COUNT}.`;
        state.generatedText = '';
        return;
      }

      state.generatedText = generateLoremIpsum(length);
      state.error = null;
    },
    clearDummyText: () => initialState,
    setCopied: (state, action: PayloadAction<boolean>) => {
      state.copied = action.payload;
    },
    // Đặt thông báo lỗi trực tiếp - dùng cho các lỗi phát sinh NGOÀI luồng
    // generate chính (vd Copy vào clipboard thất bại) nhưng vẫn cần hiện lên
    // cùng 1 banner đỏ để người dùng luôn thấy lỗi, không bị "nuốt" âm thầm.
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const { setCharCount, generateText, clearDummyText, setCopied, setError } =
  dummyTextSlice.actions;

export default dummyTextSlice.reducer;
