// Nguồn dữ liệu DUY NHẤT cho title/description/JSON-LD của từng route.
// Được đọc theo 2 cách khác nhau, từ cùng 1 nơi (tránh 2 nguồn dễ lệch nhau):
// 1. PageSeo.tsx  - đọc lúc runtime trong trình duyệt, render <title>/<meta>
//    thật cho người dùng và cho Googlebot lúc nó chạy JS.
// 2. scripts/prerender.mjs - đọc y hệt object này NHƯ DỮ LIỆU THUẦN (không
//    qua render React) để chèn thẳng vào <head> tĩnh của từng file HTML -
//    đây mới là phần mà các crawler AI (không chạy JS) thực sự nhìn thấy.
import { getAllKeywords } from './toolKeywords';

export interface RouteMeta {
  path: string;
  title: string;
  description: string;
  jsonLd?: Record<string, unknown>;
}

const SITE_NAME = 'Developer Tool';

// Placeholder - IANA dành riêng example.com cho mục đích ví dụ/tài liệu nên
// chắc chắn không trỏ nhầm sang site thật nào. Thay bằng domain thật của bạn
// qua biến môi trường VITE_SITE_URL (xem .env.example) trước khi build để
// deploy thật.
export const SITE_URL: string =
  (import.meta.env.VITE_SITE_URL as string | undefined) ??
  'https://example.com';

function toolJsonLd(
  name: string,
  description: string,
  path: string,
  keywords: string[]
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any (Web Browser)',
    description,
    // Trang có cả tiếng Anh lẫn tiếng Việt (phần hướng dẫn). `keywords` gồm cụm
    // từ ngắn + dài, tiếng Anh + tiếng Việt - khớp với nội dung thật của trang.
    inLanguage: ['en', 'vi'],
    keywords: keywords.join(', '),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    isAccessibleForFree: true,
  };
}

// Từ khóa của từng trang KHÔNG viết ở đây mà lấy từ toolKeywords.ts (nơi duy
// nhất để thêm/bớt/sửa từ khóa).
function entry(path: string, name: string, description: string): RouteMeta {
  return {
    path,
    title: `${name} | ${SITE_NAME}`,
    description,
    jsonLd: toolJsonLd(name, description, path, getAllKeywords(path)),
  };
}

export const routeMeta: Record<string, RouteMeta> = {
  '/': entry(
    '/',
    'JSON Formatter & Validator',
    'Free online JSON formatter, beautifier and validator. Pretty print JSON, find syntax errors and edit values in a tree view, right in your browser with no upload. Định dạng JSON online.'
  ),
  '/xml': entry(
    '/xml',
    'XML Formatter & Validator',
    'Free online XML formatter and beautifier. Pretty print messy XML, check that it is well-formed and edit values in a tree view, in your browser. Định dạng XML online.'
  ),
  '/sql': entry(
    '/sql',
    'SQL Formatter',
    'Free online SQL formatter and beautifier. Turn messy or minified SQL queries into clean, indented statements with uppercase keywords, in your browser. Định dạng SQL online.'
  ),
  '/encryption': entry(
    '/encryption',
    'JWT Encoder & Decoder',
    'Free online JWT decoder and encoder. Decode a JSON Web Token, verify its HS256, HS384 or HS512 signature, check expiry and generate new JWTs in your browser. Giải mã JWT online.'
  ),
  '/dummy-text': entry(
    '/dummy-text',
    'Dummy Text Generator',
    'Free lorem ipsum and dummy text generator. Create placeholder text of an exact character count (up to 100,000) for mockups and tests, then copy it. Tạo văn bản mẫu lorem ipsum.'
  ),
  '/text-compare': entry(
    '/text-compare',
    'Text Compare — Online Diff Checker',
    'Free online text compare and diff checker. Paste two texts to see line-by-line differences, with added, removed and changed words highlighted. So sánh văn bản online.'
  ),
  '/file-compare': entry(
    '/file-compare',
    'File Compare',
    'Compare two text files online and see the differences side by side. Drag and drop .txt, .json, .csv, .xml, code or config files, read in your browser. So sánh file online.'
  ),
  '/uuid': entry(
    '/uuid',
    'UUID Generator',
    'Free UUID v4 and GUID generator. Create one or up to 1,000 random UUIDs at once, with uppercase, no-hyphen or braces options, then copy them. Tạo UUID, GUID online.'
  ),
  '/password-generator': entry(
    '/password-generator',
    'Password Generator',
    'Free strong random password generator. Choose a length from 4 to 128 and the character types, see the strength and copy it, created securely in your browser. Tạo mật khẩu ngẫu nhiên.'
  ),
  '/qr-code': entry(
    '/qr-code',
    'QR Code Generator',
    'Free QR code generator with no signup. Turn a URL or any text into a QR code and download it as PNG or SVG, created in your browser. Tạo mã QR online.'
  ),
  '/time-converter': entry(
    '/time-converter',
    'Unix Timestamp & Time Zone Converter',
    'Free Unix timestamp (epoch) converter. Turn seconds or milliseconds into a readable date in any time zone, with the UTC ISO 8601 value. Đổi timestamp sang ngày giờ.'
  ),
  '/regex-tester': entry(
    '/regex-tester',
    'Regex Tester',
    'Free online regex tester with live match highlighting, capture groups and a plain-language explanation of your pattern, using the JavaScript regex engine. Kiểm tra regex online.'
  ),
  '/unit-converter': entry(
    '/unit-converter',
    'Unit & Currency Converter',
    'Free converter for length, weight, storage, temperature, font size (px to rem), color (HEX to RGB), number base (binary to decimal) and live currency rates. Đổi đơn vị, tiền tệ.'
  ),
  '/color-picker': entry(
    '/color-picker',
    'Color Picker',
    'Free online color picker. Pick a color from a palette or from your own image with an eyedropper and copy it as HEX, RGB or HSL. Chọn màu, lấy mã màu từ ảnh.'
  ),
  '/markdown-previewer': entry(
    '/markdown-previewer',
    'Markdown Previewer',
    'Free Markdown editor with live preview. Supports GitHub-style tables and task lists, code highlighting and Mermaid diagrams, shown as you type. Xem trước Markdown online.'
  ),
  '/html-converter': entry(
    '/html-converter',
    'HTML Previewer',
    'Free online HTML editor with live preview. Write HTML, CSS and JavaScript and see the result instantly in a safe, sandboxed frame. Xem trước HTML online.'
  ),
  '/image-compressor': entry(
    '/image-compressor',
    'Image Compressor',
    'Free online image compressor. Reduce JPG, PNG and WebP file size by choosing quality and maximum dimensions, in your browser with no upload. Nén ảnh, giảm dung lượng ảnh.'
  ),
  '/image-format-converter': entry(
    '/image-format-converter',
    'Image Format Converter',
    'Free online image converter between JPG, PNG and WebP, with an option to make a flat background transparent. Runs in your browser, no upload. Chuyển đổi định dạng ảnh, PNG sang JPG.'
  ),
  '/document-converter': entry(
    '/document-converter',
    'Document Format Converter',
    'Free online converter between Word, Excel, PDF and PowerPoint: PDF to Word, Word to PDF, Excel to PDF and more. Files stay in your browser. Chuyển đổi PDF, Word, Excel.'
  ),
  // Trang chính sách, không phải công cụ - dùng schema WebPage thay vì
  // toolJsonLd's WebApplication (sai ý nghĩa cho 1 trang nội dung tĩnh), và
  // không có offers/isAccessibleForFree vì đó là thuộc tính của ứng dụng.
  '/privacy-policy': {
    path: '/privacy-policy',
    title: `Privacy Policy | ${SITE_NAME}`,
    description:
      'How Developer Tool handles your data: all tools run locally in your browser, no files are uploaded to a server, and how Google AdSense cookies are used.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Privacy Policy',
      url: `${SITE_URL}/privacy-policy`,
    },
  },
};

export const defaultMeta: RouteMeta = {
  path: '',
  title: `Page Not Found | ${SITE_NAME}`,
  description: 'The page you are looking for does not exist.',
};

export const allRouteMetaList: RouteMeta[] = Object.values(routeMeta);
