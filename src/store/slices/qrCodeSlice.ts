import type { QrCodeState } from '@/util/interface/Interface';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState: QrCodeState = {
  text: '',
  qrCodeDataUrl: '',
  qrCodeSvg: '',
  error: null,
};

export const qrCodeSlice = createSlice({
  name: 'qrCode',
  initialState,
  reducers: {
    setText: (state, action: PayloadAction<string>) => {
      state.text = action.payload;
      state.error = null;
    },
    // Thư viện `qrcode` mã hoá bất đồng bộ (trả Promise) nên không thể chạy
    // thẳng trong 1 reducer đồng bộ - việc validate + gọi thư viện nằm ở
    // component (giống cách FileCompare đọc file bằng FileReader ở component
    // rồi mới dispatch kết quả cuối cùng vào đây).
    setQrCode: (
      state,
      action: PayloadAction<{ dataUrl: string; svg: string }>
    ) => {
      state.qrCodeDataUrl = action.payload.dataUrl;
      state.qrCodeSvg = action.payload.svg;
      state.error = null;
    },
    clearQrCode: () => initialState,
    // Khác setError ở các slice khác (chỉ báo lỗi, giữ nguyên kết quả cũ) -
    // ở đây lỗi luôn phát sinh ngay tại bước generate nên xoá luôn QR cũ,
    // tránh hiển thị QR không khớp với nội dung/text hiện tại.
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.qrCodeDataUrl = '';
      state.qrCodeSvg = '';
    },
  },
});

export const { setText, setQrCode, clearQrCode, setError } =
  qrCodeSlice.actions;

export default qrCodeSlice.reducer;
