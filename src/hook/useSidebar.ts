import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  toggleSidebar,
  toggleMobileSidebar,
  setIsHovered,
  setActiveItem,
  toggleSubmenu,
  setIsMobile,
} from '../store/slices/sidebarSlice';

export const useSidebar = () => {
  const dispatch = useAppDispatch();
  const sidebar = useAppSelector((state) => state.sidebar);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
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
    setIsHovered: (isHovered: boolean) => dispatch(setIsHovered(isHovered)),
    setActiveItem: (item: string | null) => dispatch(setActiveItem(item)),
    toggleSubmenu: (item: string) => dispatch(toggleSubmenu(item)),
  };
};
