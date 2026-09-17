// Entry CHỈ dùng cho scripts/prerender.mjs lúc build - KHÔNG được import bởi
// main.tsx hay bất kỳ code nào chạy trong trình duyệt. Tách riêng khỏi
// main.tsx vì main.tsx dùng createRoot() (chỉ chạy được trong trình duyệt
// thật, cần document/window), còn file này dùng renderToStaticMarkup() của
// react-dom/server để tạo chuỗi HTML thuần trong Node - 2 cách render khác
// hẳn nhau, không thể dùng chung 1 entry.
import { StrictMode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { Provider } from 'react-redux';
import { createAppStore } from './store';
import { AppRoutes } from './App';

// renderToStaticMarkup (không phải renderToString): main.tsx dùng
// createRoot() chứ không phải hydrateRoot(), nên HTML tĩnh này không có hợp
// đồng "hydrate lại y hệt" nào cần giữ - React sẽ render đè lên sau khi tải
// JS xong. renderToStaticMarkup cho HTML gọn hơn (không kèm các marker dành
// riêng cho hydrate) và đúng bản chất mục đích ở đây hơn.
export function render(url: string): string {
  return renderToStaticMarkup(
    <StrictMode>
      <Provider store={createAppStore()}>
        <StaticRouter location={url}>
          <AppRoutes />
        </StaticRouter>
      </Provider>
    </StrictMode>
  );
}
