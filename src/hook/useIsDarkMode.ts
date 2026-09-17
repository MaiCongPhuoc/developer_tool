import { useEffect, useState } from 'react';

// App bật/tắt dark mode bằng cách toggle thẳng class "dark" trên
// document.documentElement (xem AppHeader.tsx: toggleTheme) - không đi qua
// Redux/Context nào cả, nên các phần cần biết theme hiện tại (Mermaid,
// syntax highlighting) phải tự quan sát class này bằng MutationObserver
// thay vì đọc từ store.
// typeof document check để an toàn khi hook này được render trong Node.js
// (bước tạo HTML tĩnh cho SEO - xem scripts/prerender.mjs), nơi không tồn
// tại `document` - nếu không có điều kiện này, gọi thẳng document sẽ crash
// toàn bộ quá trình build tĩnh ngay khi render tới trang Markdown Previewer.
const getIsDark = () =>
  typeof document === 'undefined'
    ? false
    : document.documentElement.classList.contains('dark');

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
