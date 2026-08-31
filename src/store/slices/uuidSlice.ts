import type { UuidState } from '@/util/interface/Interface';
import { formatUuid, generateUuidV4 } from '@/util/uuid';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState: UuidState = {
  count: '1',
  uppercase: false,
  hyphens: true,
  braces: false,
  uuids: [],
  error: null,
  copiedIndex: null,
  copiedAll: false,
};

// Chặn sinh quá nhiều UUID cùng lúc để tránh treo trình duyệt khi render danh sách.
const MAX_COUNT = 1000;

export const uuidSlice = createSlice({
  name: 'uuid',
  initialState,
  reducers: {
    setCount: (state, action: PayloadAction<string>) => {
      state.count = action.payload;
      state.error = null;
    },
    setUppercase: (state, action: PayloadAction<boolean>) => {
      state.uppercase = action.payload;
    },
    setHyphens: (state, action: PayloadAction<boolean>) => {
      state.hyphens = action.payload;
    },
    setBraces: (state, action: PayloadAction<boolean>) => {
      state.braces = action.payload;
    },
    generateUuids: (state) => {
      const trimmed = state.count.trim();
      // Chỉ chấp nhận số nguyên dương thuần (giống DummyText) - không cho
      // qua các dạng JS hiểu là số nhưng người dùng không mong đợi ở đây
      // (vd "1e2", "0x10").
      const isPlainInteger = /^\d+$/.test(trimmed);
      const count = Number(trimmed);

      if (!trimmed || !isPlainInteger || !Number.isInteger(count)) {
        state.error = 'Please enter a valid integer quantity.';
        state.uuids = [];
        return;
      }
      if (count <= 0) {
        state.error = 'Quantity must be greater than 0.';
        state.uuids = [];
        return;
      }
      if (count > MAX_COUNT) {
        state.error = `Quantity must not exceed ${MAX_COUNT}.`;
        state.uuids = [];
        return;
      }

      const options = {
        uppercase: state.uppercase,
        hyphens: state.hyphens,
        braces: state.braces,
      };
      state.uuids = Array.from({ length: count }, () =>
        formatUuid(generateUuidV4(), options)
      );
      state.error = null;
    },
    clearUuid: () => initialState,
    setCopiedIndex: (state, action: PayloadAction<number | null>) => {
      state.copiedIndex = action.payload;
    },
    setCopiedAll: (state, action: PayloadAction<boolean>) => {
      state.copiedAll = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setCount,
  setUppercase,
  setHyphens,
  setBraces,
  generateUuids,
  clearUuid,
  setCopiedIndex,
  setCopiedAll,
  setError,
} = uuidSlice.actions;

export default uuidSlice.reducer;
