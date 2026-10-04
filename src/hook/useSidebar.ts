import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  toggleSidebar,
  toggleMobileSidebar,
  closeMobileSidebar,
  setIsHovered,
  setActiveItem,
  toggleSubmenu,
  setIsMobile,
} from '../store/slices/sidebarSlice';

// Mốc chiều rộng (px) giữa "di động" (menu trượt ra từ cạnh trái) và "desktop"
// (menu cố định bên trái). PHẢI trùng với breakpoint `lg` của Tailwind (1024px)
// mà toàn bộ CSS layout đang dùng - trước đây hook dùng 768px còn nút bấm và
// CSS dùng 1024px nên khoảng 768-1023px bị lệch, menu tự đóng ngay sau khi mở.
export const DESKTOP_BREAKPOINT = 1024;

export const useSidebar = () => {
  const dispatch = useAppDispatch();
  const sidebar = useAppSelector((state) => state.sidebar);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < DESKTOP_BREAKPOINT;
      dispatch(setIsMobile(mobile));
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [dispatch]);

  return {
    // Trả về isExpanded tương tự như logic cũ: nếu là mobile thì luôn false
    isExpanded: sidebar.isMobile ? false : sidebar.isExpanded,
    isMobileOpen: sidebar.isMobileOpen,
    isHovered: sidebar.isHovered,
    activeItem: sidebar.activeItem,
    openSubmenu: sidebar.openSubmenu,
    toggleSidebar: () => dispatch(toggleSidebar()),
    toggleMobileSidebar: () => dispatch(toggleMobileSidebar()),
    closeMobileSidebar: () => dispatch(closeMobileSidebar()),
    setIsHovered: (isHovered: boolean) => dispatch(setIsHovered(isHovered)),
    setActiveItem: (item: string | null) => dispatch(setActiveItem(item)),
    toggleSubmenu: (item: string) => dispatch(toggleSubmenu(item)),
  };
};
