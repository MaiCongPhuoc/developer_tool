import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    user: userReducer, // Gom các slices vào đây
  },
});

// Type định nghĩa cho RootState và AppDispatch (Dùng chuẩn hóa cho TypeScript)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
