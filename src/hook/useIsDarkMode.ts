import { useEffect, useState } from 'react';

// App bật/tắt dark mode bằng cách toggle thẳng class "dark" trên
// document.documentElement (xem AppHeader.tsx: toggleTheme) - không đi qua
// Redux/Context nào cả, nên các phần cần biết theme hiện tại (Mermaid,
// syntax highlighting) phải tự quan sát class này bằng MutationObserver
// thay vì đọc từ store.
const getIsDark = () => document.documentElement.classList.contains('dark');

export const useIsDarkMode = (): boolean => {
  const [isDark, setIsDark] = useState(getIsDark);

  useEffect(() => {
    const observer = new MutationObserver(() => setIsDark(getIsDark()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
};
