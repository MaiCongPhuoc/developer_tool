import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UserState } from '@/util/interface/UserState';
import { calculateIncrementAge } from '../actions';

// 1. Giá trị khởi tạo ban đầu (Thay thế cho useState(initialValue))
const initialState: UserState = {
  name: 'Mai Công Phước',
  age: 20,
  isLoggedIn: false,
};

// 2. Tạo Slice
export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Action cập nhật tên
    updateName: (state, action: PayloadAction<string>) => {
      state.name = action.payload;
    },
    // Action tăng tuổi
    incrementAge: calculateIncrementAge,
    // Action đổi trạng thái đăng nhập
    toggleLogin: (state) => {
      state.isLoggedIn = !state.isLoggedIn;
    },
  },
});

// Export các actions để component gọi khi muốn đổi dữ liệu
export const { updateName, incrementAge, toggleLogin } = userSlice.actions;

// Export reducer để gắn vào Store
export default userSlice.reducer;
