import type { RegexTesterState } from '@/util/interface/Interface';
import {
  buildFlags,
  explainRegex,
  findMatches,
  MAX_PATTERN_LENGTH,
  MAX_TEST_TEXT_LENGTH,
} from '@/util/regex';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState: RegexTesterState = {
  pattern: '',
  flagGlobal: true,
  flagIgnoreCase: false,
  flagMultiline: false,
  flagDotAll: false,
  flagUnicode: false,
  flagSticky: false,
  testText: '',
  isMatch: false,
  matches: [],
  tokens: [],
  error: null,
};

const resetResult = (state: RegexTesterState) => {
  state.isMatch = false;
  state.matches = [];
  state.tokens = [];
};

export const regexSlice = createSlice({
  name: 'regex',
  initialState,
  reducers: {
    setPattern: (state, action: PayloadAction<string>) => {
      state.pattern = action.payload;
      state.error = null;
    },
    setTestText: (state, action: PayloadAction<string>) => {
      state.testText = action.payload;
      state.error = null;
    },
    setFlagGlobal: (state, action: PayloadAction<boolean>) => {
      state.flagGlobal = action.payload;
    },
    setFlagIgnoreCase: (state, action: PayloadAction<boolean>) => {
      state.flagIgnoreCase = action.payload;
    },
    setFlagMultiline: (state, action: PayloadAction<boolean>) => {
      state.flagMultiline = action.payload;
    },
    setFlagDotAll: (state, action: PayloadAction<boolean>) => {
      state.flagDotAll = action.payload;
    },
    setFlagUnicode: (state, action: PayloadAction<boolean>) => {
      state.flagUnicode = action.payload;
    },
    setFlagSticky: (state, action: PayloadAction<boolean>) => {
      state.flagSticky = action.payload;
    },
    test: (state) => {
      if (!state.pattern) {
        state.error = 'Please enter a regular expression pattern.';
        resetResult(state);
        return;
      }
      if (state.pattern.length > MAX_PATTERN_LENGTH) {
        state.error = `Pattern must not exceed ${MAX_PATTERN_LENGTH} characters.`;
        resetResult(state);
        return;
      }
      if (state.testText.length > MAX_TEST_TEXT_LENGTH) {
        state.error = `Test text must not exceed ${MAX_TEST_TEXT_LENGTH} characters.`;
        resetResult(state);
        return;
      }

      const flags = buildFlags({
        global: state.flagGlobal,
        ignoreCase: state.flagIgnoreCase,
        multiline: state.flagMultiline,
        dotAll: state.flagDotAll,
        unicode: state.flagUnicode,
        sticky: state.flagSticky,
      });

      // new RegExp() bên trong findMatches sẽ ném lỗi nếu pattern sai cú
      // pháp (vd thiếu dấu đóng ngoặc) - bắt lỗi ở đây để hiện message gốc
      // của JS engine (khá rõ ràng, vd "Invalid regular expression: /(/:
      // Unterminated group") thay vì tự bịa 1 thông báo chung chung.
      try {
        state.matches = findMatches(state.pattern, flags, state.testText);
        state.tokens = explainRegex(state.pattern);
        state.isMatch = state.matches.length > 0;
        state.error = null;
      } catch (err: unknown) {
        state.error =
          err instanceof Error ? err.message : 'Invalid regular expression.';
        resetResult(state);
      }
    },
    clearRegex: () => initialState,
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setPattern,
  setTestText,
  setFlagGlobal,
  setFlagIgnoreCase,
  setFlagMultiline,
  setFlagDotAll,
  setFlagUnicode,
  setFlagSticky,
  test,
  clearRegex,
  setError,
} = regexSlice.actions;

export default regexSlice.reducer;
