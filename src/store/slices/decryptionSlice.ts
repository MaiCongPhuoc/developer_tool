import type { DecryptionState } from '@/util/interface/Interface';
import { decodeAndVerifyJwt, type JwtDecodeResult } from '@/util/jwt';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState: DecryptionState = {
  tokenInput: '',
  secret: '',
  decodedHeader: '',
  decodedPayload: '',
  rawSignature: '',
  signatureStatus: null,
  expiresAt: null,
  isExpired: null,
  error: null,
  copied: false,
};

type ThunkConfig = { state: { decryption: DecryptionState }; rejectValue: string };

// Giải mã token: chỉ 1 hành động duy nhất (không có mode encode/decode như
// trang Encryption), logic dùng chung ở decodeAndVerifyJwt (util/jwt.ts).
export const decodeToken = createAsyncThunk<JwtDecodeResult, void, ThunkConfig>(
  'decryption/decode',
  async (_, { getState, rejectWithValue }) => {
    const { tokenInput, secret } = getState().decryption;
    try {
      return await decodeAndVerifyJwt(tokenInput, secret);
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to decode token.'
      );
    }
  }
);

export const decryptionSlice = createSlice({
  name: 'decryption',
  initialState,
  reducers: {
    setTokenInput: (state, action: PayloadAction<string>) => {
      state.tokenInput = action.payload;
    },
    setSecret: (state, action: PayloadAction<string>) => {
      state.secret = action.payload;
    },
    setCopied: (state, action: PayloadAction<boolean>) => {
      state.copied = action.payload;
    },
    clearDecryption: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(decodeToken.fulfilled, (state, action) => {
        state.decodedHeader = action.payload.header;
        state.decodedPayload = action.payload.payload;
        state.rawSignature = action.payload.signature;
        state.signatureStatus = action.payload.signatureStatus;
        state.expiresAt = action.payload.expiresAt;
        state.isExpired = action.payload.isExpired;
        state.error = null;
      })
      .addCase(decodeToken.rejected, (state, action) => {
        state.decodedHeader = '';
        state.decodedPayload = '';
        state.rawSignature = '';
        state.signatureStatus = null;
        state.expiresAt = null;
        state.isExpired = null;
        state.error = action.payload ?? 'Failed to decode token.';
      });
  },
});

export const { setTokenInput, setSecret, setCopied, clearDecryption } =
  decryptionSlice.actions;

export default decryptionSlice.reducer;
