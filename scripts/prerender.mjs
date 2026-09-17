// Chạy SAU "vite build" (xem package.json) - đọc dist/index.html mà bước
// build client vừa tạo ra làm khuôn mẫu, dùng Vite build lại ở chế độ SSR để
// render từng route trong 19 route, rồi ghi ra dist/<route>/index.html chứa
// sẵn HTML thật (không rỗng) cho các crawler không chạy JavaScript (Bing,
// GPTBot, ClaudeBot, PerplexityBot...) đọc được ngay từ lần fetch đầu tiên.
//
// Build tách làm 2 bundle SSR riêng biệt, không gộp chung 1 bundle:
// 1. routeMeta-bundle: CHỈ chứa src/seo/routeMeta.ts (dữ liệu thuần, không
//    kéo theo React/thư viện nào) - gần như không thể lỗi.
// 2. render-bundle: chứa src/entry-server.tsx, kéo theo TOÀN BỘ 19 trang
//    (vì App.tsx import tĩnh cả 19 trang) và mọi thư viện xử lý file chúng
//    dùng (mermaid, html2canvas, pdfjs-dist, xlsx...) - có rủi ro cao hơn vì
//    1 thư viện lỡ chạy code chỉ dành cho trình duyệt ngay lúc import (chứ
//    không đợi được gọi hàm) có thể làm việc import cả bundle này thất bại.
// Tách riêng để nếu (2) lỗi, script vẫn còn (1) để biết đủ danh sách 19 route
// + title/description/JSON-LD, ghi ra bản "chỉ có metadata" cho mọi trang
// thay vì crash toàn bộ "npm run build".
import { build } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const ssrOutDir = path.join(root, 'dist-server');

function escapeHtml(value) {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]
  );
}

function buildHeadExtraHtml(meta, siteUrl, { noindex = false } = {}) {
  const canonical = `${siteUrl}${meta.path === '/' ? '' : meta.path}`;
  const ogImage = `${siteUrl}/images/logo/logo.png`;
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);

  // data-seo-static: đánh dấu để PageSeo.tsx tự xoá các thẻ TĨNH này ngay
  // khi React nhận quyền điều khiển trong trình duyệt - nếu không, chúng sẽ
  // tồn tại vĩnh viễn song song với các thẻ PageSeo tự render cho từng route
  // sau đó, gây ra vd 2 <link rel="canonical"> xung đột nhau cùng lúc ngay
  // khi người dùng chuyển route trong app (đã bắt được lỗi này qua test
  // Playwright thật, xem PageSeo.tsx).
  return [
    `<title data-seo-static="true">${title}</title>`,
    `<meta data-seo-static="true" name="description" content="${description}" />`,
    `<link data-seo-static="true" rel="canonical" href="${canonical}" />`,
    noindex
      ? `<meta data-seo-static="true" name="robots" content="noindex" />`
      : '',
    `<meta data-seo-static="true" property="og:type" content="website" />`,
    `<meta data-seo-static="true" property="og:site_name" content="Developer Tool" />`,
    `<meta data-seo-static="true" property="og:title" content="${title}" />`,
    `<meta data-seo-static="true" property="og:description" content="${description}" />`,
    `<meta data-seo-static="true" property="og:url" content="${canonical}" />`,
    `<meta data-seo-static="true" property="og:image" content="${ogImage}" />`,
    `<meta data-seo-static="true" name="twitter:card" content="summary_large_image" />`,
    `<meta data-seo-static="true" name="twitter:title" content="${title}" />`,
    `<meta data-seo-static="true" name="twitter:description" content="${description}" />`,
    meta.jsonLd
      ? `<script data-seo-static="true" type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`
      : '',
  ]
    .filter(Boolean)
    .join('\n    ');
}

// index.html gốc có sẵn <title>/<meta name="description">/og:type/
// og:site_name làm giá trị mặc định (dùng khi chạy "npm run dev" hoặc như
// lưới an toàn nếu 1 route nào đó thiếu trong routeMeta). Phải loại bỏ ĐÚNG
// 3 thẻ mặc định này trước khi chèn thẻ riêng cho từng route bên dưới - nếu
// không, mỗi route sẽ có 2 bộ <meta name="description">/og:* cùng lúc (1
// generic + 1 đúng route), gây trùng lặp/mơ hồ cho crawler đọc. Nhận diện
// bằng đúng attribute name/property (không dựa vào comment) để không phụ
// thuộc việc index.html có giữ comment đánh dấu hay không.
const DEFAULT_HEAD_TAG_PATTERNS = [
  /<title>.*?<\/title>/s,
  /<meta[^>]*name="description"[^>]*\/?>/,
  /<meta[^>]*property="og:type"[^>]*\/?>/,
  /<meta[^>]*property="og:site_name"[^>]*\/?>/,
];

function stripDefaultHeadTags(template) {
  return DEFAULT_HEAD_TAG_PATTERNS.reduce(
    (html, pattern) => html.replace(pattern, ''),
    template
  );
}

function writeRouteHtml(template, meta, siteUrl, bodyHtml, options = {}) {
  const headExtra = buildHeadExtraHtml(meta, siteUrl, options);
  const html = stripDefaultHeadTags(template)
    .replace('</head>', `  ${headExtra}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);

  // meta.path kết thúc bằng .html (vd '/404.html') nghĩa là ghi thẳng 1 file
  // tĩnh, không phải 1 route thư mục như 19 route thật (mỗi route thật ghi
  // ra <route>/index.html để URL sạch không đuôi .html hoạt động đúng).
  let outPath;
  if (meta.path.endsWith('.html')) {
    outPath = path.join(distDir, meta.path.replace(/^\//, ''));
  } else if (meta.path === '/') {
    outPath = path.join(distDir, 'index.html');
  } else {
    outPath = path.join(distDir, meta.path.replace(/^\//, ''), 'index.html');
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf-8');
}

function writeSitemap(routes, siteUrl) {
  const urls = routes
    .map(
      (m) =>
        `  <url><loc>${siteUrl}${m.path === '/' ? '' : m.path}</loc></url>`
    )
    .join('\n');
  fs.writeFileSync(
    path.join(distDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    'utf-8'
  );
}

async function buildSsrEntry(entry, outDir, entryFileName) {
  await build({
    root,
    build: {
      ssr: entry,
      outDir,
      emptyOutDir: true,
      minify: false,
      rollupOptions: {
        output: { format: 'es', entryFileNames: entryFileName },
      },
    },
    logLevel: 'warn',
  });
}

async function main() {
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    throw new Error(
      'dist/index.html not found - run "vite build" before scripts/prerender.mjs.'
    );
  }
  const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

  // 1. Bundle metadata thuần - gần như không thể lỗi, nên KHÔNG bọc try/catch.
  const metaOutDir = path.join(ssrOutDir, 'meta');
  await buildSsrEntry('src/seo/routeMeta.ts', metaOutDir, 'route-meta.js');
  const {
    allRouteMetaList: routes,
    SITE_URL: siteUrl,
    defaultMeta,
  } = await import(pathToFileURL(path.join(metaOutDir, 'route-meta.js')).href);

  // 2. Bundle render đầy đủ (kéo theo cả 19 trang) - CÓ bọc try/catch: nếu 1
  // thư viện nào đó chạy code chỉ dành cho trình duyệt ngay lúc import, toàn
  // bộ npm run build vẫn không được phép chết theo.
  const renderOutDir = path.join(ssrOutDir, 'render');
  let renderModule = null;
  try {
    await buildSsrEntry('src/entry-server.tsx', renderOutDir, 'entry-server.js');
    renderModule = await import(
      pathToFileURL(path.join(renderOutDir, 'entry-server.js')).href
    );
  } catch (err) {
    console.warn(
      `[prerender] Could not build/load the full render bundle (${err.message}). Falling back to metadata-only HTML for every route.`
    );
  }

  const report = [];
  for (const meta of routes) {
    let bodyHtml = '';
    let tier = 'metadata-only';
    if (renderModule) {
      try {
        bodyHtml = renderModule.render(meta.path);
        tier = 'full';
      } catch (err) {
        console.warn(
          `[prerender] ${meta.path}: render failed (${err.message}). Falling back to metadata-only shell for this route.`
        );
      }
    }
    writeRouteHtml(template, meta, siteUrl, bodyHtml);
    report.push({ route: meta.path, tier });
  }

  writeSitemap(routes, siteUrl);

  // dist/404.html tĩnh - 1 số host (GitHub Pages, Cloudflare Pages...) tự
  // nhận file này để hiển thị khi gặp đường dẫn không khớp route nào, thay
  // vì trang lỗi mặc định xấu của họ. Dùng path chắc chắn không khớp route
  // nào để trigger đúng <Route path="*"> (NotFound) trong App.tsx.
  if (renderModule) {
    try {
      const notFoundHtml = renderModule.render('/__not_found__');
      writeRouteHtml(
        template,
        { ...defaultMeta, path: '/404.html' },
        siteUrl,
        notFoundHtml,
        { noindex: true }
      );
    } catch (err) {
      console.warn(
        `[prerender] Could not render dist/404.html (${err.message}). Skipping.`
      );
    }
  }

  fs.rmSync(ssrOutDir, { recursive: true, force: true });

  console.table(report);
  const fullCount = report.filter((r) => r.tier === 'full').length;
  console.log(
    `[prerender] Done: ${fullCount}/${report.length} routes fully prerendered, ${report.length - fullCount} metadata-only.`
  );
}

main().catch((err) => {
  console.error('[prerender] Fatal error:', err);
  process.exit(1);
});
