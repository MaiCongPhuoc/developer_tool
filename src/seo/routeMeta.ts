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

function entry(
  path: string,
  name: string,
  description: string,
  keywords: string[]
): RouteMeta {
  return {
    path,
    title: `${name} | ${SITE_NAME}`,
    description,
    jsonLd: toolJsonLd(name, description, path, keywords),
  };
}

export const routeMeta: Record<string, RouteMeta> = {
  '/': entry(
    '/',
    'JSON Formatter & Validator',
    'Free online JSON formatter, beautifier and validator. Pretty print JSON, find syntax errors and edit values in a tree view, right in your browser with no upload. Định dạng JSON online.',
    [
      'json formatter',
      'json beautifier',
      'json validator',
      'format json online',
      'json pretty print online',
      'json tree viewer',
      'edit json online',
      'json formatter that does not upload data',
      'check json syntax errors online',
      'định dạng json',
      'format json',
      'làm đẹp json',
      'kiểm tra json',
      'công cụ định dạng json online miễn phí',
      'kiểm tra cú pháp json trực tuyến',
      'sửa lỗi json online',
    ]
  ),
  '/xml': entry(
    '/xml',
    'XML Formatter & Validator',
    'Free online XML formatter and beautifier. Pretty print messy XML, check that it is well-formed and edit values in a tree view, in your browser. Định dạng XML online.',
    [
      'xml formatter',
      'xml beautifier',
      'format xml online',
      'xml validator',
      'xml pretty print online',
      'xml tree viewer',
      'check if xml is well-formed online',
      'edit xml online',
      'định dạng xml',
      'format xml',
      'làm đẹp xml',
      'kiểm tra xml',
      'công cụ định dạng xml online miễn phí',
      'kiểm tra xml hợp lệ online',
      'xem cấu trúc xml dạng cây',
    ]
  ),
  '/sql': entry(
    '/sql',
    'SQL Formatter',
    'Free online SQL formatter and beautifier. Turn messy or minified SQL queries into clean, indented statements with uppercase keywords, in your browser. Định dạng SQL online.',
    [
      'sql formatter',
      'sql beautifier',
      'format sql online',
      'sql pretty print',
      'format sql query online free',
      'beautify minified sql',
      'uppercase sql keywords online',
      'định dạng sql',
      'format sql',
      'làm đẹp sql',
      'công cụ format câu lệnh sql online',
      'làm đẹp câu truy vấn sql',
      'định dạng sql viết hoa từ khóa',
    ]
  ),
  '/encryption': entry(
    '/encryption',
    'JWT Encoder & Decoder',
    'Free online JWT decoder and encoder. Decode a JSON Web Token, verify its HS256, HS384 or HS512 signature, check expiry and generate new JWTs in your browser. Giải mã JWT online.',
    [
      'jwt decoder',
      'jwt encoder',
      'decode jwt',
      'jwt generator',
      'decode jwt token online',
      'verify jwt signature hs256 online',
      'jwt debugger online',
      'create jwt token online',
      'check jwt expiration online',
      'giải mã jwt',
      'tạo jwt',
      'decode jwt',
      'công cụ giải mã jwt token online',
      'kiểm tra chữ ký jwt hs256',
      'tạo jwt token online',
    ]
  ),
  '/dummy-text': entry(
    '/dummy-text',
    'Dummy Text Generator',
    'Free lorem ipsum and dummy text generator. Create placeholder text of an exact character count (up to 100,000) for mockups and tests, then copy it. Tạo văn bản mẫu lorem ipsum.',
    [
      'lorem ipsum generator',
      'dummy text generator',
      'placeholder text generator',
      'lorem ipsum by character count',
      'generate dummy text of exact length',
      'random text generator for testing',
      'tạo văn bản mẫu',
      'lorem ipsum',
      'tạo text giả',
      'tạo lorem ipsum theo số ký tự',
      'công cụ tạo văn bản ngẫu nhiên theo độ dài',
      'tạo văn bản mẫu cho thiết kế',
    ]
  ),
  '/text-compare': entry(
    '/text-compare',
    'Text Compare — Online Diff Checker',
    'Free online text compare and diff checker. Paste two texts to see line-by-line differences, with added, removed and changed words highlighted. So sánh văn bản online.',
    [
      'text compare',
      'diff checker',
      'compare two texts',
      'text difference',
      'compare two texts online and highlight differences',
      'online diff tool line by line',
      'find differences between two text blocks',
      'so sánh văn bản',
      'so sánh text',
      'diff text',
      'công cụ so sánh hai đoạn văn bản online',
      'tìm điểm khác nhau giữa hai văn bản',
      'so sánh văn bản từng dòng',
    ]
  ),
  '/file-compare': entry(
    '/file-compare',
    'File Compare',
    'Compare two text files online and see the differences side by side. Drag and drop .txt, .json, .csv, .xml, code or config files, read in your browser. So sánh file online.',
    [
      'file compare',
      'compare two files',
      'file diff',
      'file difference checker',
      'compare two text files online side by side',
      'compare json files online',
      'compare csv files online',
      'find differences between two files',
      'so sánh file',
      'so sánh hai file',
      'so sánh tập tin',
      'công cụ so sánh hai file văn bản online',
      'tìm điểm khác biệt giữa hai file',
      'so sánh file json csv xml',
    ]
  ),
  '/uuid': entry(
    '/uuid',
    'UUID Generator',
    'Free UUID v4 and GUID generator. Create one or up to 1,000 random UUIDs at once, with uppercase, no-hyphen or braces options, then copy them. Tạo UUID, GUID online.',
    [
      'uuid generator',
      'guid generator',
      'uuid v4 generator',
      'random uuid',
      'generate multiple uuids at once online',
      'uuid generator without hyphens',
      'bulk uuid generator',
      'uuid with braces',
      'tạo uuid',
      'tạo guid',
      'uuid v4',
      'tạo nhiều uuid cùng lúc online',
      'tạo uuid không có dấu gạch ngang',
      'công cụ tạo guid ngẫu nhiên',
    ]
  ),
  '/password-generator': entry(
    '/password-generator',
    'Password Generator',
    'Free strong random password generator. Choose a length from 4 to 128 and the character types, see the strength and copy it, created securely in your browser. Tạo mật khẩu ngẫu nhiên.',
    [
      'password generator',
      'random password generator',
      'strong password generator',
      'generate a strong random password online',
      '16 character password generator',
      'secure password generator that runs in your browser',
      'tạo mật khẩu',
      'tạo mật khẩu ngẫu nhiên',
      'tạo mật khẩu mạnh',
      'công cụ tạo mật khẩu mạnh online',
      'tạo mật khẩu ngẫu nhiên 16 ký tự',
      'tạo mật khẩu an toàn trên trình duyệt',
    ]
  ),
  '/qr-code': entry(
    '/qr-code',
    'QR Code Generator',
    'Free QR code generator with no signup. Turn a URL or any text into a QR code and download it as PNG or SVG, created in your browser. Tạo mã QR online.',
    [
      'qr code generator',
      'url to qr code',
      'text to qr code',
      'free qr code',
      'free qr code generator no signup',
      'create qr code from link and download png or svg',
      'qr code generator svg vector',
      'tạo mã qr',
      'tạo qr code',
      'mã qr online',
      'tạo mã qr từ link miễn phí',
      'tạo mã qr tải về png svg',
      'công cụ tạo qr code không cần đăng ký',
    ]
  ),
  '/time-converter': entry(
    '/time-converter',
    'Unix Timestamp & Time Zone Converter',
    'Free Unix timestamp (epoch) converter. Turn seconds or milliseconds into a readable date in any time zone, with the UTC ISO 8601 value. Đổi timestamp sang ngày giờ.',
    [
      'unix timestamp converter',
      'epoch converter',
      'timestamp to date',
      'time zone converter',
      'convert epoch milliseconds to date online',
      'unix timestamp to human readable date with timezone',
      'convert time between time zones',
      'utc iso 8601 converter',
      'chuyển đổi timestamp',
      'đổi timestamp sang ngày',
      'múi giờ',
      'epoch time',
      'đổi unix timestamp sang ngày giờ theo múi giờ',
      'công cụ chuyển đổi epoch time online',
      'đổi timestamp mili giây sang ngày',
    ]
  ),
  '/regex-tester': entry(
    '/regex-tester',
    'Regex Tester',
    'Free online regex tester with live match highlighting, capture groups and a plain-language explanation of your pattern, using the JavaScript regex engine. Kiểm tra regex online.',
    [
      'regex tester',
      'regex checker',
      'test regex online',
      'test regular expression online with match highlighting',
      'javascript regex tester with explanation',
      'regex tester capture groups',
      'regex101 alternative',
      'kiểm tra regex',
      'test regex',
      'biểu thức chính quy',
      'công cụ kiểm tra biểu thức chính quy online',
      'test regex javascript có tô sáng kết quả',
      'giải thích cú pháp regex',
    ]
  ),
  '/unit-converter': entry(
    '/unit-converter',
    'Unit & Currency Converter',
    'Free converter for length, weight, storage, temperature, font size (px to rem), color (HEX to RGB), number base (binary to decimal) and live currency rates. Đổi đơn vị, tiền tệ.',
    [
      'unit converter',
      'currency converter',
      'px to rem',
      'hex to rgb',
      'px to rem converter with base font size',
      'binary to decimal converter',
      'bytes to mb gb converter',
      'celsius to fahrenheit converter',
      'usd to vnd currency converter live rates',
      'chuyển đổi đơn vị',
      'đổi tiền tệ',
      'đổi px sang rem',
      'đổi hex sang rgb',
      'đổi nhị phân sang thập phân online',
      'đổi tỷ giá usd sang vnd',
      'đổi đơn vị độ dài khối lượng nhiệt độ',
      'đổi dung lượng byte kb mb gb',
    ]
  ),
  '/color-picker': entry(
    '/color-picker',
    'Color Picker',
    'Free online color picker. Pick a color from a palette or from your own image with an eyedropper and copy it as HEX, RGB or HSL. Chọn màu, lấy mã màu từ ảnh.',
    [
      'color picker',
      'image color picker',
      'hex to rgb',
      'eyedropper tool',
      'pick color from image online',
      'convert hex to rgb and hsl',
      'get color code from picture',
      'chọn màu',
      'lấy mã màu',
      'đổi hex sang rgb',
      'công cụ lấy mã màu từ hình ảnh online',
      'chọn màu từ ảnh',
      'chuyển đổi mã màu hex rgb hsl',
    ]
  ),
  '/markdown-previewer': entry(
    '/markdown-previewer',
    'Markdown Previewer',
    'Free Markdown editor with live preview. Supports GitHub-style tables and task lists, code highlighting and Mermaid diagrams, shown as you type. Xem trước Markdown online.',
    [
      'markdown previewer',
      'markdown editor online',
      'markdown preview',
      'markdown editor with live preview',
      'github markdown preview online',
      'markdown to html online',
      'mermaid diagram in markdown preview',
      'xem trước markdown',
      'soạn thảo markdown online',
      'markdown preview',
      'trình soạn thảo markdown online xem trước trực tiếp',
      'chuyển markdown sang html',
      'vẽ sơ đồ mermaid trong markdown',
    ]
  ),
  '/html-converter': entry(
    '/html-converter',
    'HTML Previewer',
    'Free online HTML editor with live preview. Write HTML, CSS and JavaScript and see the result instantly in a safe, sandboxed frame. Xem trước HTML online.',
    [
      'html previewer',
      'html live preview',
      'html editor online',
      'html viewer',
      'html css javascript live preview online',
      'run html code online in browser',
      'online html editor with sandbox preview',
      'xem trước html',
      'chạy thử html',
      'soạn thảo html online',
      'trình soạn thảo html css javascript online xem trước trực tiếp',
      'chạy thử đoạn mã html trên trình duyệt',
    ]
  ),
  '/image-compressor': entry(
    '/image-compressor',
    'Image Compressor',
    'Free online image compressor. Reduce JPG, PNG and WebP file size by choosing quality and maximum dimensions, in your browser with no upload. Nén ảnh, giảm dung lượng ảnh.',
    [
      'image compressor',
      'compress jpg',
      'compress png',
      'reduce image size',
      'compress jpg png webp online without uploading',
      'reduce image file size in browser',
      'webp image compressor online free',
      'nén ảnh',
      'giảm dung lượng ảnh',
      'nén ảnh jpg png',
      'công cụ nén ảnh online miễn phí không tải lên máy chủ',
      'giảm dung lượng ảnh jpg png webp',
      'nén ảnh ngay trên trình duyệt',
    ]
  ),
  '/image-format-converter': entry(
    '/image-format-converter',
    'Image Format Converter',
    'Free online image converter between JPG, PNG and WebP, with an option to make a flat background transparent. Runs in your browser, no upload. Chuyển đổi định dạng ảnh, PNG sang JPG.',
    [
      'image converter',
      'png to jpg',
      'jpg to png',
      'png to webp',
      'convert image format online free',
      'make png background transparent online',
      'remove flat background color from image',
      'webp to png converter',
      'chuyển đổi định dạng ảnh',
      'đổi png sang jpg',
      'đổi jpg sang png',
      'xóa nền ảnh',
      'chuyển ảnh png sang jpg webp online miễn phí',
      'làm nền ảnh trong suốt theo màu nền',
      'đổi định dạng ảnh không tải lên máy chủ',
    ]
  ),
  '/document-converter': entry(
    '/document-converter',
    'Document Format Converter',
    'Free online converter between Word, Excel, PDF and PowerPoint: PDF to Word, Word to PDF, Excel to PDF and more. Files stay in your browser. Chuyển đổi PDF, Word, Excel.',
    [
      'pdf to word',
      'word to pdf',
      'excel to pdf',
      'document converter',
      'convert pdf to word online without uploading',
      'convert csv to pdf online',
      'convert excel to powerpoint online',
      'convert docx to pdf in browser',
      'chuyển pdf sang word',
      'chuyển word sang pdf',
      'chuyển excel sang pdf',
      'chuyển đổi tài liệu',
      'chuyển đổi pdf word excel powerpoint online miễn phí',
      'chuyển đổi file không tải lên máy chủ',
      'chuyển csv sang pdf',
    ]
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
