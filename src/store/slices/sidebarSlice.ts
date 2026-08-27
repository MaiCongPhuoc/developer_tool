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
      state.isMobile = action.payload;
      if (!action.payload) {
        state.isMobileOpen = false;
      }
    },
  },
});

export const {
  toggleSidebar,
  toggleMobileSidebar,
  setIsHovered,
  setActiveItem,
  toggleSubmenu,
  setIsMobile,
} = sidebarSlice.actions;

export default sidebarSlice.reducer;
