import type { TextCompareState } from '@/util/interface/Interface';
import { compareTexts } from '@/util/textDiff';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState: TextCompareState = {
  leftText: '',
  rightText: '',
  rows: [],
  stats: null,
  error: null,
};

export const textCompareSlice = createSlice({
  name: 'textCompare',
  initialState,
  reducers: {
    setLeftText: (state, action: PayloadAction<string>) => {
      state.leftText = action.payload;
      state.error = null;
    },
    setRightText: (state, action: PayloadAction<string>) => {
      state.rightText = action.payload;
      state.error = null;
    },
    // So sánh 2 đoạn text hiện có trong state, kết quả lưu lại vào rows/stats
    compareText: (state) => {
      if (!state.leftText.trim() && !state.rightText.trim()) {
        state.error = 'Please enter text in at least one of the two boxes.';
        state.rows = [];
        state.stats = null;
        return;
      }

      try {
        const { rows, stats } = compareTexts(state.leftText, state.rightText);
        state.rows = rows;
        state.stats = stats;
        state.error = null;
      } catch (err: unknown) {
        state.error =
          err instanceof Error
            ? err.message
            : 'Unknown error while comparing text.';
        state.rows = [];
        state.stats = null;
      }
    },
    clearTextCompare: () => initialState,
  },
});

export const { setLeftText, setRightText, compareText, clearTextCompare } =
  textCompareSlice.actions;

export default textCompareSlice.reducer;
