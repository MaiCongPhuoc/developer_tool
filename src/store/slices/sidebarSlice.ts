import type { SidebarState } from '@/util/interface/Interface';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const initialState: SidebarState = {
  isExpanded: true,
  isMobileOpen: false,
  isMobile: false,
  isHovered: false,
  activeItem: null,
  openSubmenu: null,
};

export const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isExpanded = !state.isExpanded;
    },
    toggleMobileSidebar: (state) => {
      state.isMobileOpen = !state.isMobileOpen;
    },
    closeMobileSidebar: (state) => {
      state.isMobileOpen = false;
    },
    setIsHovered: (state, action: PayloadAction<boolean>) => {
      state.isHovered = action.payload;
    },
    setActiveItem: (state, action: PayloadAction<string | null>) => {
      state.activeItem = action.payload;
    },
    toggleSubmenu: (state, action: PayloadAction<string>) => {
      state.openSubmenu =
        state.openSubmenu === action.payload ? null : action.payload;
    },
    setIsMobile: (state, action: PayloadAction<boolean>) => {
      // Chỉ đóng menu di động khi màn hình THỰC SỰ vượt từ "di động" lên
      // "desktop". Trước đây mỗi sự kiện resize (trình duyệt điện thoại bắn
      // liên tục khi thanh địa chỉ co/giãn lúc cuộn) đều đóng menu nếu chiều
      // rộng >= 768px, khiến tablet/điện thoại xoay ngang không giữ được menu.
      const wasMobile = state.isMobile;
      state.isMobile = action.payload;
      if (wasMobile && !action.payload) {
        state.isMobileOpen = false;
      }
    },
  },
});

export const {
  toggleSidebar,
  toggleMobileSidebar,
  closeMobileSidebar,
  setIsHovered,
  setActiveItem,
  toggleSubmenu,
  setIsMobile,
} = sidebarSlice.actions;

export default sidebarSlice.reducer;
