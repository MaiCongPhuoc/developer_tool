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
    },
    generateText: (state) => {
      const trimmed = state.charCount.trim();
      const length = Number(trimmed);

      if (!trimmed || !Number.isInteger(length)) {
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
  },
});

export const { setCharCount, generateText, clearDummyText, setCopied } =
  dummyTextSlice.actions;

export default dummyTextSlice.reducer;
