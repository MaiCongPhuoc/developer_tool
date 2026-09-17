import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { routeMeta, defaultMeta, SITE_URL } from './routeMeta';

// Mounted DUY NHẤT 1 lần trong AppLayout.tsx (không lặp lại ở từng trang) -
// tự đọc route hiện tại qua useLocation() rồi render đúng <title>/<meta> cho
// route đó. React 19 tự "bốc" các thẻ title/meta/link/script render ra từ
// bất kỳ component nào lên đúng document.head thật - không cần react-helmet.
//
// Guard `typeof window === 'undefined'`: lúc scripts/prerender.mjs render
// tĩnh trong Node, cây render chỉ là 1 fragment (không có <html>/<head> thật
// bao quanh - index.html là file tĩnh, không phải thứ React render ra), nên
// hoisting title/meta lên head không có nơi để "bốc" tới, sẽ bị chèn lộn xộn
// ngay trong <body>. Prerender script tự chèn head tương ứng bằng cách đọc
// thẳng routeMeta làm DỮ LIỆU (xem prerender.mjs) - đó mới là đường đi đáng
// tin cậy cho crawler không chạy JS, nên PageSeo trả về null khi SSR là đúng.
const PageSeo = () => {
  // Chỉ chạy 1 lần lúc React thật sự nhận quyền điều khiển trong trình
  // duyệt: dọn các thẻ title/meta/link/script tĩnh mà scripts/prerender.mjs
  // đã chèn sẵn vào <head> lúc build (đánh dấu bằng data-seo-static, xem
  // prerender.mjs). Bắt buộc phải dọn - nếu không, các thẻ TĨNH đó (khớp
  // đúng route ban đầu được server trả về) sẽ tồn tại VĨNH VIỄN song song
  // với các thẻ do PageSeo tự render bên dưới mỗi khi đổi route - gây ra 2
  // <link rel="canonical">/<meta property="og:*"> xung đột nhau cùng lúc
  // ngay khi người dùng chuyển sang trang khác trong app (đã bắt được lỗi
  // này qua Playwright thật, không phải chỉ suy đoán).
  useEffect(() => {
    document
      .querySelectorAll('[data-seo-static]')
      .forEach((el) => el.remove());
  }, []);

  // useLocation() gọi TRƯỚC nhánh rẽ typeof window bên dưới (không gọi có
  // điều kiện) để tuân thủ Rules of Hooks - vẫn an toàn lúc SSR vì
  // entry-server.tsx đã bọc sẵn <StaticRouter>, useLocation() luôn có context
  // để đọc, chỉ là giá trị trả về không được dùng tới trong nhánh đó.
  const { pathname } = useLocation();

  if (typeof window === 'undefined') return null;

  const meta = routeMeta[pathname] ?? defaultMeta;
  const isKnownRoute = pathname in routeMeta;
  const canonicalUrl = `${SITE_URL}${pathname === '/' ? '' : pathname}`;
  const ogImage = `${SITE_URL}/images/logo/logo.png`;

  return (
    <>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={canonicalUrl} />
      {!isKnownRoute && <meta name="robots" content="noindex" />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Developer Tool" />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={ogImage} />

      {meta.jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(meta.jsonLd)}
        </script>
      )}
    </>
  );
};

export default PageSeo;
