import type { PasswordGeneratorState } from '@/util/interface/Interface';
import { calculatePasswordStrength, generatePassword } from '@/util/password';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState: PasswordGeneratorState = {
  length: '16',
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  password: '',
  strength: null,
  error: null,
  copied: false,
};

// Giới hạn độ dài hợp lý: quá ngắn thì không còn ý nghĩa bảo mật, quá dài
// (vd hàng chục nghìn ký tự) không mang lại lợi ích thực tế mà chỉ tốn công
// sinh/hiển thị.
const MIN_LENGTH = 4;
const MAX_LENGTH = 128;

export const passwordSlice = createSlice({
  name: 'password',
  initialState,
  reducers: {
    setLength: (state, action: PayloadAction<string>) => {
      state.length = action.payload;
      state.error = null;
    },
    setIncludeUppercase: (state, action: PayloadAction<boolean>) => {
      state.includeUppercase = action.payload;
    },
    setIncludeLowercase: (state, action: PayloadAction<boolean>) => {
      state.includeLowercase = action.payload;
    },
    setIncludeNumbers: (state, action: PayloadAction<boolean>) => {
      state.includeNumbers = action.payload;
    },
    setIncludeSymbols: (state, action: PayloadAction<boolean>) => {
      state.includeSymbols = action.payload;
    },
    generate: (state) => {
      const options = {
        uppercase: state.includeUppercase,
        lowercase: state.includeLowercase,
        numbers: state.includeNumbers,
        symbols: state.includeSymbols,
      };

      if (!Object.values(options).some(Boolean)) {
        state.error = 'Please select at least one character type.';
        state.password = '';
        state.strength = null;
        return;
      }

      const trimmed = state.length.trim();
      // Chỉ chấp nhận số nguyên dương thuần (giống UuidState.count) - không
      // cho qua các dạng JS hiểu là số nhưng người dùng không mong đợi ở đây.
      const isPlainInteger = /^\d+$/.test(trimmed);
      const length = Number(trimmed);

      if (!trimmed || !isPlainInteger || !Number.isInteger(length)) {
        state.error = 'Please enter a valid integer length.';
        state.password = '';
        state.strength = null;
        return;
      }
      if (length < MIN_LENGTH) {
        state.error = `Length must be at least ${MIN_LENGTH}.`;
        state.password = '';
        state.strength = null;
        return;
      }
      if (length > MAX_LENGTH) {
        state.error = `Length must not exceed ${MAX_LENGTH}.`;
        state.password = '';
        state.strength = null;
        return;
      }

      state.password = generatePassword(length, options);
      state.strength = calculatePasswordStrength(state.password, options);
      state.error = null;
    },
    clearPassword: () => initialState,
    setCopied: (state, action: PayloadAction<boolean>) => {
      state.copied = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setLength,
  setIncludeUppercase,
  setIncludeLowercase,
  setIncludeNumbers,
  setIncludeSymbols,
  generate,
  clearPassword,
  setCopied,
  setError,
} = passwordSlice.actions;

export default passwordSlice.reducer;
