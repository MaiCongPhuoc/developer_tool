export interface SidebarState {
  isExpanded: boolean;
  isMobileOpen: boolean;
  isMobile: boolean;
  isHovered: boolean;
  activeItem: string | null;
  openSubmenu: string | null;
}

export interface JsonFormatterState {
  inputJson: string;
  formattedJson: string;
  error: string | null;
  copied: boolean;
  // key = JSON.stringify(đường dẫn node), value = true nếu node đó đang bị thu gọn
  collapsedPaths: Record<string, boolean>;
}
