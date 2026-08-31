import type { FileCompareState } from '@/util/interface/Interface';
import type { FileCompareFile } from '@/util/interface/Type';
import { compareTexts } from '@/util/textDiff';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState: FileCompareState = {
  leftFile: null,
  rightFile: null,
  rows: [],
  stats: null,
  error: null,
};

export const fileCompareSlice = createSlice({
  name: 'fileCompare',
  initialState,
  reducers: {
    setLeftFile: (state, action: PayloadAction<FileCompareFile | null>) => {
      state.leftFile = action.payload;
      state.error = null;
    },
    setRightFile: (state, action: PayloadAction<FileCompareFile | null>) => {
      state.rightFile = action.payload;
      state.error = null;
    },
    setFileCompareError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    // So sánh nội dung 2 file hiện có trong state, kết quả lưu lại vào
    // rows/stats - dùng chung thuật toán compareTexts với Text Compare vì
    // nội dung file đã được đọc sẵn thành text (FileReader) trước đó.
    compareFiles: (state) => {
      if (!state.leftFile || !state.rightFile) {
        state.error = 'Please select both files to compare.';
        state.rows = [];
        state.stats = null;
        return;
      }

      try {
        const { rows, stats } = compareTexts(
          state.leftFile.content,
          state.rightFile.content
        );
        state.rows = rows;
        state.stats = stats;
        state.error = null;
      } catch (err: unknown) {
        state.error =
          err instanceof Error
            ? err.message
            : 'Unknown error while comparing files.';
        state.rows = [];
        state.stats = null;
      }
    },
    clearFileCompare: () => initialState,
  },
});

export const {
  setLeftFile,
  setRightFile,
  setFileCompareError,
  compareFiles,
  clearFileCompare,
} = fileCompareSlice.actions;

export default fileCompareSlice.reducer;
