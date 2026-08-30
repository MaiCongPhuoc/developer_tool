import type { SqlFormatterState } from '@/util/interface/Interface';
import { prettifySql } from '@/util/sql';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState: SqlFormatterState = {
  inputSql: '',
  formattedSql: '',
  error: null,
  copied: false,
};

export const sqlFormatterSlice = createSlice({
  name: 'sqlFormatter',
  initialState,
  reducers: {
    setInputSql: (state, action: PayloadAction<string>) => {
      state.inputSql = action.payload;
    },
    formatSql: (state) => {
      if (!state.inputSql.trim()) {
        state.error = 'Please enter a SQL statement.';
        state.formattedSql = '';
        return;
      }

      try {
        state.formattedSql = prettifySql(state.inputSql);
        state.error = null;
      } catch (err: unknown) {
        state.error =
          err instanceof Error
            ? `SQL formatting error: ${err.message}`
            : 'Unknown SQL formatting error.';
        state.formattedSql = '';
      }
    },
    clearSql: (state) => {
      state.inputSql = '';
      state.formattedSql = '';
      state.error = null;
    },
    setCopied: (state, action: PayloadAction<boolean>) => {
      state.copied = action.payload;
    },
  },
});

export const { setInputSql, formatSql, clearSql, setCopied } =
  sqlFormatterSlice.actions;

export default sqlFormatterSlice.reducer;
