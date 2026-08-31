import type { TimeConverterState } from '@/util/interface/Interface';
import type { TimestampUnit } from '@/util/interface/Type';
import { convertTimestamp, getLocalTimezone } from '@/util/time';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState: TimeConverterState = {
  timestamp: '',
  unit: 'seconds',
  timezone: getLocalTimezone(),
  formatted: '',
  isoUtc: '',
  error: null,
  copiedField: null,
};

export const timeConverterSlice = createSlice({
  name: 'timeConverter',
  initialState,
  reducers: {
    setTimestamp: (state, action: PayloadAction<string>) => {
      state.timestamp = action.payload;
      state.error = null;
    },
    setUnit: (state, action: PayloadAction<TimestampUnit>) => {
      state.unit = action.payload;
    },
    setTimezone: (state, action: PayloadAction<string>) => {
      state.timezone = action.payload;
    },
    convert: (state) => {
      const trimmed = state.timestamp.trim();
      // Cho phép số âm (timestamp trước mốc 1970 vẫn hợp lệ) - chỉ chặn các
      // dạng JS hiểu là số nhưng người dùng không mong đợi ở đây (vd "1e9").
      const isPlainInteger = /^-?\d+$/.test(trimmed);

      if (!trimmed || !isPlainInteger) {
        state.error = 'Please enter a valid integer Unix timestamp.';
        state.formatted = '';
        state.isoUtc = '';
        return;
      }

      try {
        const { formatted, isoUtc } = convertTimestamp(
          Number(trimmed),
          state.unit,
          state.timezone
        );
        state.formatted = formatted;
        state.isoUtc = isoUtc;
        state.error = null;
      } catch (err: unknown) {
        state.error =
          err instanceof Error
            ? err.message
            : 'Could not convert this timestamp.';
        state.formatted = '';
        state.isoUtc = '';
      }
    },
    clearTimeConverter: () => initialState,
    setCopiedField: (
      state,
      action: PayloadAction<TimeConverterState['copiedField']>
    ) => {
      state.copiedField = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setTimestamp,
  setUnit,
  setTimezone,
  convert,
  clearTimeConverter,
  setCopiedField,
  setError,
} = timeConverterSlice.actions;

export default timeConverterSlice.reducer;
