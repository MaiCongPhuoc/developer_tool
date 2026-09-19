// Nguồn dữ liệu DUY NHẤT cho title/description/JSON-LD của từng route.
// Được đọc theo 2 cách khác nhau, từ cùng 1 nơi (tránh 2 nguồn dễ lệch nhau):
// 1. PageSeo.tsx  - đọc lúc runtime trong trình duyệt, render <title>/<meta>
//    thật cho người dùng và cho Googlebot lúc nó chạy JS.
// 2. scripts/prerender.mjs - đọc y hệt object này NHƯ DỮ LIỆU THUẦN (không
//    qua render React) để chèn thẳng vào <head> tĩnh của từng file HTML -
//    đây mới là phần mà các crawler AI (không chạy JS) thực sự nhìn thấy.
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
  path: string
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any (Web Browser)',
    description,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    isAccessibleForFree: true,
  };
}

function entry(path: string, name: string, description: string): RouteMeta {
  return {
    path,
    title: `${name} | ${SITE_NAME}`,
    description,
    jsonLd: toolJsonLd(name, description, path),
  };
}

export const routeMeta: Record<string, RouteMeta> = {
  '/': entry(
    '/',
    'JSON Formatter & Validator',
    'Format, validate, and beautify JSON online for free. Paste JSON to instantly prettify, minify, and catch syntax errors in your browser — no signup required.'
  ),
  '/xml': entry(
    '/xml',
    'XML Formatter & Validator',
    'Format and validate XML documents online. Instantly prettify messy XML, check well-formedness, and view results clearly — free, no install.'
  ),
  '/sql': entry(
    '/sql',
    'SQL Formatter',
    'Format and beautify SQL queries online. Turn messy, minified SQL into clean, indented, readable statements instantly in your browser.'
  ),
  '/encryption': entry(
    '/encryption',
    'Text Encryption & Decryption Tool',
    'Encrypt and decrypt text online. Quickly secure or reveal messages directly in your browser — free and private, nothing leaves your device.'
  ),
  '/dummy-text': entry(
    '/dummy-text',
    'Dummy Text Generator',
    'Generate placeholder dummy text for mockups, designs, and testing. Choose length and format, then copy instantly.'
  ),
  '/text-compare': entry(
    '/text-compare',
    'Text Compare — Online Diff Checker',
    'Compare two blocks of text and instantly see line-by-line differences highlighted. Free online diff tool for spotting changes fast.'
  ),
  '/file-compare': entry(
    '/file-compare',
    'File Compare',
    'Upload and compare two files side by side to find differences instantly, all in your browser.'
  ),
  '/uuid': entry(
    '/uuid',
    'UUID Generator',
    'Generate random UUID v4 values online, one at a time or in bulk. Free tool for developers — copy instantly.'
  ),
  '/password-generator': entry(
    '/password-generator',
    'Password Generator',
    'Generate strong, random, secure passwords online. Customize length and character types for free.'
  ),
  '/qr-code': entry(
    '/qr-code',
    'QR Code Generator',
    'Create custom QR codes from text, URLs, or data instantly. Free online QR code generator — download as an image.'
  ),
  '/time-converter': entry(
    '/time-converter',
    'Time Zone & Timestamp Converter',
    'Convert between time zones, Unix timestamps, and human-readable dates instantly, free and online.'
  ),
  '/regex-tester': entry(
    '/regex-tester',
    'Regex Tester',
    'Test and debug regular expressions online with live match highlighting — free, in-browser regex tester.'
  ),
  '/unit-converter': entry(
    '/unit-converter',
    'Unit & Currency Converter',
    'Convert between units of length, weight, volume, temperature, and more instantly, free and online.'
  ),
  '/color-picker': entry(
    '/color-picker',
    'Color Picker',
    'Pick colors visually from an image or convert between HEX, RGB, and HSL formats instantly — free online color tool.'
  ),
  '/markdown-previewer': entry(
    '/markdown-previewer',
    'Markdown Previewer',
    'Write Markdown and see the rendered HTML preview live, side by side. Free online Markdown editor and previewer.'
  ),
  '/html-converter': entry(
    '/html-converter',
    'HTML Previewer',
    'Paste HTML code and preview the rendered output instantly in your browser, free and online.'
  ),
  '/image-compressor': entry(
    '/image-compressor',
    'Image Compressor',
    'Compress JPG, PNG, and WebP images online without losing visible quality — fast, browser-based, free.'
  ),
  '/image-format-converter': entry(
    '/image-format-converter',
    'Image Format Converter',
    'Convert images between JPG, PNG, WebP, and other formats online for free, entirely in your browser.'
  ),
  '/document-converter': entry(
    '/document-converter',
    'Document Format Converter',
    'Convert documents between Word, Excel, PDF, and PowerPoint formats directly in your browser — free, no upload to a server required.'
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
