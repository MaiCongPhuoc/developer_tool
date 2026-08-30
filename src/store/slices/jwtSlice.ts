import type { JwtState } from '@/util/interface/Interface';
import type {
  JwtAlgorithm,
  JwtMode,
  JwtSignatureStatus,
} from '@/util/interface/Type';
import { base64UrlEncode, decodeAndVerifyJwt, signHmac } from '@/util/jwt';
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

const defaultHeaderInput = JSON.stringify(
  { alg: 'HS256', typ: 'JWT' },
  null,
  2
);
const defaultPayloadInput = JSON.stringify(
  { sub: '1234567890', name: 'John Doe', iat: 1516239022 },
  null,
  2
);

const initialState: JwtState = {
  mode: 'encode',
  algorithm: 'HS256',
  headerInput: defaultHeaderInput,
  payloadInput: defaultPayloadInput,
  secret: '',
  encodedToken: '',
  tokenInput: '',
  decodedHeader: '',
  decodedPayload: '',
  rawSignature: '',
  signatureStatus: null,
  expiresAt: null,
  isExpired: null,
  error: null,
  copiedField: null,
};

type ThunkConfig = { state: { jwt: JwtState }; rejectValue: string };

// Ký JWT mới: parse header/payload JSON -> base64url encode -> HMAC ký
// "header.payload" bằng secret -> ghép thành "header.payload.signature".
// `alg` trong header luôn bị ghi đè theo thuật toán đang chọn ở dropdown, để
// token sinh ra không bao giờ lệch với chữ ký thật (tránh trường hợp gõ tay
// alg khác nhưng vẫn ký bằng HS256).
export const encodeJwt = createAsyncThunk<string, void, ThunkConfig>(
  'jwt/encode',
  async (_, { getState, rejectWithValue }) => {
    const { headerInput, payloadInput, secret, algorithm } = getState().jwt;
    try {
      if (!secret) {
        throw new Error('Please enter a secret to sign the token.');
      }

      // Parse Header/Payload riêng từng ô, báo lỗi rõ ràng biết chính xác ô
      // nào sai thay vì để nguyên message thô của JS engine (vd "Unexpected
      // token } in JSON at position 12") vốn không cho biết đó là lỗi ở
      // Header hay Payload.
      let parsedHeader: Record<string, unknown>;
      try {
        parsedHeader = JSON.parse(headerInput);
      } catch {
        throw new Error('Header must be valid JSON.');
      }
      let payload: unknown;
      try {
        payload = JSON.parse(payloadInput);
      } catch {
        throw new Error('Payload must be valid JSON.');
      }

      const header = { ...parsedHeader, alg: algorithm };
      const signingInput = `${base64UrlEncode(
        JSON.stringify(header)
      )}.${base64UrlEncode(JSON.stringify(payload))}`;
      const signature = await signHmac(signingInput, secret, algorithm);
      return `${signingInput}.${signature}`;
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to encode JWT.'
      );
    }
  }
);

type DecodeResult = {
  header: string;
  payload: string;
  signature: string;
  signatureStatus: JwtSignatureStatus;
  expiresAt: string | null;
  isExpired: boolean | null;
};

// Giải mã JWT: tách 3 phần, decode header/payload (luôn làm được, không cần
// secret). Nếu có nhập secret thì verify luôn chữ ký theo đúng `alg` ghi
// trong header - alg lạ (vd RS256, chưa hỗ trợ) thì báo invalid thay vì crash.
// Claim "exp" (nếu có) được so với thời điểm decode ngay tại đây (trong thunk,
// không phải lúc component render) để tránh gọi Date.now() trong render.
// Logic thực sự nằm ở decodeAndVerifyJwt (util/jwt.ts).
export const decodeJwt = createAsyncThunk<DecodeResult, void, ThunkConfig>(
  'jwt/decode',
  async (_, { getState, rejectWithValue }) => {
    const { tokenInput, secret } = getState().jwt;
    try {
      return await decodeAndVerifyJwt(tokenInput, secret);
    } catch (err: unknown) {
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to decode JWT.'
      );
    }
  }
);

export const jwtSlice = createSlice({
  name: 'jwt',
  initialState,
  reducers: {
    setMode: (state, action: PayloadAction<JwtMode>) => {
      state.mode = action.payload;
      state.error = null;
    },
    setAlgorithm: (state, action: PayloadAction<JwtAlgorithm>) => {
      state.algorithm = action.payload;
      // Token đã sinh trước đó không còn khớp với thuật toán mới chọn -> xoá
      // để tránh hiển thị 1 token trông như "kết quả hiện tại" trong khi
      // thực ra là kết quả của lựa chọn cũ.
      state.encodedToken = '';
      state.error = null;
    },
    setHeaderInput: (state, action: PayloadAction<string>) => {
      state.headerInput = action.payload;
      state.encodedToken = '';
      state.error = null;
    },
    setPayloadInput: (state, action: PayloadAction<string>) => {
      state.payloadInput = action.payload;
      state.encodedToken = '';
      state.error = null;
    },
    setSecret: (state, action: PayloadAction<string>) => {
      state.secret = action.payload;
      // Secret dùng chung cho cả Encode lẫn Decode - đổi secret thì cả token
      // vừa sinh (Encode) lẫn kết quả verify chữ ký vừa decode (Decode) đều
      // không còn phản ánh đúng secret hiện tại nữa, nên xoá cả 2 phía. Nếu
      // không, badge "Signature valid/invalid" cũ có thể tiếp tục hiển thị
      // dù chưa hề được verify lại với secret mới - dễ gây hiểu nhầm về độ
      // tin cậy của chữ ký.
      state.encodedToken = '';
      state.decodedHeader = '';
      state.decodedPayload = '';
      state.rawSignature = '';
      state.signatureStatus = null;
      state.expiresAt = null;
      state.isExpired = null;
      state.error = null;
    },
    setTokenInput: (state, action: PayloadAction<string>) => {
      state.tokenInput = action.payload;
      // Token vừa gõ lại chưa được decode - kết quả decode cũ (đặc biệt là
      // badge signature) không còn mô tả đúng token hiện tại trong ô nữa nên
      // phải xoá đi, buộc người dùng bấm Decode lại để thấy kết quả mới.
      state.decodedHeader = '';
      state.decodedPayload = '';
      state.rawSignature = '';
      state.signatureStatus = null;
      state.expiresAt = null;
      state.isExpired = null;
      state.error = null;
    },
    setCopiedField: (
      state,
      action: PayloadAction<JwtState['copiedField']>
    ) => {
      state.copiedField = action.payload;
    },
    // Đặt thông báo lỗi trực tiếp - dùng cho các lỗi phát sinh NGOÀI luồng
    // encode/decode chính (vd Copy vào clipboard thất bại) nhưng vẫn cần
    // hiện lên cùng 1 banner đỏ để người dùng luôn thấy lỗi, không bị "nuốt"
    // âm thầm.
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearJwt: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(encodeJwt.fulfilled, (state, action) => {
        state.encodedToken = action.payload;
        state.error = null;
      })
      .addCase(encodeJwt.rejected, (state, action) => {
        state.encodedToken = '';
        state.error = action.payload ?? 'Failed to encode JWT.';
      })
      .addCase(decodeJwt.fulfilled, (state, action) => {
        state.decodedHeader = action.payload.header;
        state.decodedPayload = action.payload.payload;
        state.rawSignature = action.payload.signature;
        state.signatureStatus = action.payload.signatureStatus;
        state.expiresAt = action.payload.expiresAt;
        state.isExpired = action.payload.isExpired;
        state.error = null;
      })
      .addCase(decodeJwt.rejected, (state, action) => {
        state.decodedHeader = '';
        state.decodedPayload = '';
        state.rawSignature = '';
        state.signatureStatus = null;
        state.expiresAt = null;
        state.isExpired = null;
        state.error = action.payload ?? 'Failed to decode JWT.';
      });
  },
});

export const {
  setMode,
  setAlgorithm,
  setHeaderInput,
  setPayloadInput,
  setSecret,
  setTokenInput,
  setCopiedField,
  setError,
  clearJwt,
} = jwtSlice.actions;

export default jwtSlice.reducer;
