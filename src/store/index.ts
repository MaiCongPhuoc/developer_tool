import { configureStore } from '@reduxjs/toolkit';
import sidebarReducer from './slices/sidebarSlice';
import jsonFormatterReducer from './slices/jsonFormatterSlice';

export const store = configureStore({
  reducer: {
    sidebar: sidebarReducer, // Gom các slices vào đây
    jsonFormatter: jsonFormatterReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // updateJsonValue có thể mang giá trị kiểu BigInt (dùng cho số nguyên
      // quá lớn để number giữ chính xác) - middleware mặc định của RTK coi
      // BigInt là "không serialize được" nên báo warning nhầm. State thực sự
      // lưu lại (formattedJson/inputJson) luôn là string đã stringify, nên
      // bỏ qua kiểm tra riêng cho path này là an toàn.
      serializableCheck: {
        ignoredActionPaths: ['payload.value'],
      },
    }),
});

// Type định nghĩa cho RootState và AppDispatch (Dùng chuẩn hóa cho TypeScript)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
