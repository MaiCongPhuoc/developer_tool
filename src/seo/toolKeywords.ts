// NƠI DUY NHẤT chứa từ khóa tìm kiếm của từng trang công cụ. Muốn thêm/bớt/sửa
// từ khóa: chỉ cần sửa file này, rồi build và deploy lại.
//
// Mỗi trang (khóa là đường dẫn, khớp với routeMeta.ts) có 4 danh sách:
//   enShort  - cụm tiếng Anh NGẮN, phổ biến (vd "json formatter")
//   enLong   - cụm tiếng Anh DÀI, cụ thể (vd "format json online free")
//   viShort  - cụm tiếng Việt NGẮN (vd "định dạng json")
//   viLong   - cụm tiếng Việt DÀI, cụ thể (vd "công cụ định dạng json online")
//
// Các cụm này được dùng ở 2 nơi:
//   1. routeMeta.ts   -> trường `keywords` trong dữ liệu cấu trúc JSON-LD của trang
//                        (ẩn, dành cho công cụ tìm kiếm / AI đọc).
//   2. ToolGuide.tsx  -> mục "Related searches" / "Tìm kiếm liên quan" hiển thị ở
//                        cuối phần hướng dẫn (lấy RELATED_SEARCHES_COUNT cụm đầu
//                        của enLong và viLong - nên xếp cụm quan trọng nhất lên đầu).
//
// LƯU Ý: chỉ ghi những cụm trang THẬT SỰ làm được. Google không dùng thẻ meta
// "keywords"; từ khóa chỉ có tác dụng khi khớp với nội dung thật của trang, và
// nhồi nhét cụm không liên quan có thể bị coi là spam.

export interface ToolKeywordSet {
  enShort: string[];
  enLong: string[];
  viShort: string[];
  viLong: string[];
}

// Số cụm DÀI hiển thị công khai ở mục "Related searches" cho mỗi ngôn ngữ.
// Đặt 0 để ẩn hẳn mục này (từ khóa vẫn còn trong JSON-LD).
export const RELATED_SEARCHES_COUNT = 4;

export const toolKeywords: Record<string, ToolKeywordSet> = {
  '/': {
    enShort: ['json formatter', 'json beautifier', 'json validator', 'json pretty print', 'json viewer', 'json editor', 'format json', 'json lint'],
    enLong: ['format json online free', 'json pretty print online', 'json formatter that does not upload data', 'check json syntax errors online', 'json tree viewer online', 'edit json values online', 'remove trailing commas from json online', 'json formatter and validator no signup', 'beautify json with 2 space indentation', 'handle large integers in json without rounding'],
    viShort: ['định dạng json', 'format json', 'làm đẹp json', 'kiểm tra json', 'xem json', 'sửa json', 'json online'],
    viLong: ['công cụ định dạng json online miễn phí', 'kiểm tra cú pháp json trực tuyến', 'sửa lỗi json online', 'xem json dạng cây online', 'định dạng json không tải dữ liệu lên máy chủ', 'chỉnh sửa giá trị json trực tiếp', 'bỏ dấu phẩy thừa trong json'],
  },
  '/xml': {
    enShort: ['xml formatter', 'xml beautifier', 'xml validator', 'xml pretty print', 'xml viewer', 'format xml', 'xml editor'],
    enLong: ['format xml online free', 'xml pretty print online', 'check if xml is well-formed online', 'xml tree viewer online', 'edit xml attributes online', 'beautify messy xml with indentation', 'xml formatter that runs in your browser', 'view xml as a collapsible tree'],
    viShort: ['định dạng xml', 'format xml', 'làm đẹp xml', 'kiểm tra xml', 'xem xml'],
    viLong: ['công cụ định dạng xml online miễn phí', 'kiểm tra xml hợp lệ online', 'xem cấu trúc xml dạng cây', 'chỉnh sửa thuộc tính xml online', 'làm đẹp xml thụt lề dễ đọc'],
  },
  '/sql': {
    enShort: ['sql formatter', 'sql beautifier', 'format sql', 'sql pretty print', 'sql prettifier', 'sql query formatter'],
    enLong: ['format sql query online free', 'beautify minified sql online', 'uppercase sql keywords online', 'sql formatter with subquery indentation', 'format select from where join online', 'indent case when sql online', 'sql formatter that runs in your browser'],
    viShort: ['định dạng sql', 'format sql', 'làm đẹp sql', 'sắp xếp câu lệnh sql'],
    viLong: ['công cụ format câu lệnh sql online', 'làm đẹp câu truy vấn sql', 'định dạng sql viết hoa từ khóa', 'format câu lệnh select join where', 'thụt lề câu truy vấn sql lồng nhau'],
  },
  '/encryption': {
    enShort: ['jwt decoder', 'jwt encoder', 'jwt debugger', 'jwt generator', 'decode jwt', 'jwt parser', 'jwt verify', 'json web token'],
    enLong: ['decode jwt token online', 'verify jwt signature hs256 online', 'jwt debugger online free', 'create jwt token online', 'check jwt expiration online', 'decode jwt header and payload', 'jwt hs256 hs384 hs512 generator', 'jwt decoder that does not send your token to a server', 'json web token decoder online'],
    viShort: ['giải mã jwt', 'tạo jwt', 'decode jwt', 'jwt online', 'kiểm tra jwt'],
    viLong: ['công cụ giải mã jwt token online', 'kiểm tra chữ ký jwt hs256', 'tạo jwt token online', 'xem header và payload của jwt', 'kiểm tra jwt hết hạn chưa', 'giải mã json web token'],
  },
  '/dummy-text': {
    enShort: ['lorem ipsum generator', 'dummy text generator', 'placeholder text generator', 'random text generator', 'lorem ipsum', 'filler text', 'lorem ipsum text'],
    enLong: ['lorem ipsum by character count', 'generate dummy text of exact length', 'lorem ipsum 500 characters', 'random text generator for testing', 'placeholder text for mockups and designs', 'generate text with an exact number of characters', 'lorem ipsum generator up to 100000 characters'],
    viShort: ['tạo văn bản mẫu', 'lorem ipsum', 'tạo text giả', 'tạo văn bản ngẫu nhiên'],
    viLong: ['tạo lorem ipsum theo số ký tự', 'công cụ tạo văn bản ngẫu nhiên theo độ dài', 'tạo văn bản mẫu cho thiết kế', 'sinh văn bản thử nghiệm đúng số ký tự', 'tạo lorem ipsum tối đa 100000 ký tự'],
  },
  '/text-compare': {
    enShort: ['text compare', 'diff checker', 'compare text', 'text diff', 'difference checker', 'compare two texts'],
    enLong: ['compare two texts online and highlight differences', 'online diff tool line by line', 'find differences between two text blocks', 'text difference checker with word highlighting', 'compare two versions of a document online', 'diff checker that runs in your browser'],
    viShort: ['so sánh văn bản', 'so sánh text', 'diff text', 'tìm điểm khác nhau'],
    viLong: ['công cụ so sánh hai đoạn văn bản online', 'tìm điểm khác nhau giữa hai văn bản', 'so sánh văn bản từng dòng', 'so sánh hai phiên bản văn bản', 'đánh dấu phần thêm xóa sửa trong văn bản'],
  },
  '/file-compare': {
    enShort: ['file compare', 'compare files', 'file diff', 'compare two files', 'file difference checker'],
    enLong: ['compare two text files online side by side', 'compare json files online', 'compare csv files online', 'compare xml files online', 'find differences between two files', 'compare config files online', 'compare source code files online'],
    viShort: ['so sánh file', 'so sánh hai file', 'so sánh tập tin', 'file diff'],
    viLong: ['công cụ so sánh hai file văn bản online', 'tìm điểm khác biệt giữa hai file', 'so sánh file json csv xml', 'so sánh file cấu hình', 'so sánh mã nguồn hai file'],
  },
  '/uuid': {
    enShort: ['uuid generator', 'guid generator', 'uuid v4', 'random uuid', 'uuid online', 'generate uuid'],
    enLong: ['generate multiple uuids at once online', 'uuid generator without hyphens', 'bulk uuid generator', 'uuid with braces', 'uppercase uuid generator', 'generate up to 1000 uuids', 'uuid v4 generator using web crypto'],
    viShort: ['tạo uuid', 'tạo guid', 'uuid v4', 'uuid online'],
    viLong: ['tạo nhiều uuid cùng lúc online', 'tạo uuid không có dấu gạch ngang', 'công cụ tạo guid ngẫu nhiên', 'tạo uuid viết hoa', 'tạo uuid có dấu ngoặc nhọn'],
  },
  '/password-generator': {
    enShort: ['password generator', 'random password generator', 'strong password generator', 'secure password generator', 'password maker', 'generate password'],
    enLong: ['generate a strong random password online', '16 character password generator', 'secure password generator that runs in your browser', 'password generator with symbols numbers and uppercase', 'password strength meter generator', 'generate a password up to 128 characters'],
    viShort: ['tạo mật khẩu', 'tạo mật khẩu ngẫu nhiên', 'tạo mật khẩu mạnh', 'trình tạo mật khẩu'],
    viLong: ['công cụ tạo mật khẩu mạnh online', 'tạo mật khẩu ngẫu nhiên 16 ký tự', 'tạo mật khẩu an toàn trên trình duyệt', 'tạo mật khẩu có ký hiệu số chữ hoa', 'đánh giá độ mạnh mật khẩu'],
  },
  '/qr-code': {
    enShort: ['qr code generator', 'url to qr code', 'text to qr code', 'free qr code', 'create qr code', 'qr code maker'],
    enLong: ['free qr code generator no signup', 'create qr code from link and download png or svg', 'qr code generator svg vector', 'generate qr code from text online', 'qr code generator that works in your browser', 'download qr code as png'],
    viShort: ['tạo mã qr', 'tạo qr code', 'mã qr online', 'tạo qr từ link'],
    viLong: ['tạo mã qr từ link miễn phí', 'tạo mã qr tải về png svg', 'công cụ tạo qr code không cần đăng ký', 'tạo mã qr từ văn bản', 'tạo mã qr dạng vector svg'],
  },
  '/time-converter': {
    enShort: ['unix timestamp converter', 'epoch converter', 'timestamp to date', 'time zone converter', 'epoch time', 'unix time'],
    enLong: ['convert epoch milliseconds to date online', 'unix timestamp to human readable date with timezone', 'convert time between time zones', 'utc iso 8601 converter', 'timestamp converter seconds and milliseconds', 'current unix timestamp now', 'convert unix timestamp to local time'],
    viShort: ['chuyển đổi timestamp', 'đổi timestamp sang ngày', 'múi giờ', 'epoch time', 'unix timestamp'],
    viLong: ['đổi unix timestamp sang ngày giờ theo múi giờ', 'công cụ chuyển đổi epoch time online', 'đổi timestamp mili giây sang ngày', 'lấy timestamp hiện tại', 'chuyển đổi giờ giữa các múi giờ'],
  },
  '/regex-tester': {
    enShort: ['regex tester', 'regex checker', 'test regex online', 'regular expression tester', 'regex tool', 'regex debugger'],
    enLong: ['test regular expression online with match highlighting', 'javascript regex tester with explanation', 'regex tester with capture groups', 'regex101 alternative', 'regex flags g i m s u y tester', 'explain regex pattern online', 'test regex in your browser'],
    viShort: ['kiểm tra regex', 'test regex', 'biểu thức chính quy', 'regex online'],
    viLong: ['công cụ kiểm tra biểu thức chính quy online', 'test regex javascript có tô sáng kết quả', 'giải thích cú pháp regex', 'kiểm tra regex có nhóm bắt capture group'],
  },
  '/unit-converter': {
    enShort: ['unit converter', 'currency converter', 'px to rem', 'hex to rgb', 'number base converter', 'bytes converter', 'temperature converter'],
    enLong: ['px to rem converter with base font size', 'binary to decimal converter', 'bytes to mb gb converter', 'celsius to fahrenheit converter', 'usd to vnd currency converter live rates', 'hex to binary converter', 'kb to mb converter', 'length and weight converter online'],
    viShort: ['chuyển đổi đơn vị', 'đổi tiền tệ', 'đổi px sang rem', 'đổi hex sang rgb', 'đổi nhị phân'],
    viLong: ['đổi nhị phân sang thập phân online', 'đổi tỷ giá usd sang vnd', 'đổi đơn vị độ dài khối lượng nhiệt độ', 'đổi dung lượng byte kb mb gb', 'đổi px sang rem theo cỡ chữ gốc'],
  },
  '/color-picker': {
    enShort: ['color picker', 'image color picker', 'hex to rgb', 'eyedropper tool', 'color converter', 'color code finder'],
    enLong: ['pick color from image online', 'convert hex to rgb and hsl', 'get color code from picture', 'eyedropper tool online free', 'rgb to hex converter', 'hsl color converter', 'color picker with presets'],
    viShort: ['chọn màu', 'lấy mã màu', 'đổi hex sang rgb', 'lấy màu từ ảnh'],
    viLong: ['công cụ lấy mã màu từ hình ảnh online', 'chọn màu từ ảnh', 'chuyển đổi mã màu hex rgb hsl', 'lấy mã màu hex từ ảnh'],
  },
  '/markdown-previewer': {
    enShort: ['markdown previewer', 'markdown editor online', 'markdown preview', 'markdown viewer', 'markdown to html'],
    enLong: ['markdown editor with live preview', 'github markdown preview online', 'markdown to html online', 'mermaid diagram in markdown preview', 'markdown table and task list preview', 'copy markdown as html', 'markdown code block syntax highlighting', 'online markdown editor with mermaid diagrams'],
    viShort: ['xem trước markdown', 'soạn thảo markdown online', 'markdown preview', 'chuyển markdown sang html'],
    viLong: ['trình soạn thảo markdown online xem trước trực tiếp', 'chuyển markdown sang html', 'vẽ sơ đồ mermaid trong markdown', 'xem trước markdown kiểu github', 'tô màu code trong markdown', 'viết markdown có bảng và danh sách việc cần làm'],
  },
  '/html-converter': {
    enShort: ['html previewer', 'html live preview', 'html editor online', 'html viewer', 'html tester', 'html playground'],
    enLong: ['html css javascript live preview online', 'run html code online in browser', 'online html editor with sandbox preview', 'test html css js snippets online', 'html editor with instant preview', 'preview html without saving a file', 'safe html preview in a sandboxed frame', 'online html css js playground'],
    viShort: ['xem trước html', 'chạy thử html', 'soạn thảo html online', 'html online'],
    viLong: ['trình soạn thảo html css javascript online xem trước trực tiếp', 'chạy thử đoạn mã html trên trình duyệt', 'thử nhanh html css js không cần tạo file', 'xem trước html trong khung cách ly an toàn'],
  },
  '/image-compressor': {
    enShort: ['image compressor', 'compress jpg', 'compress png', 'reduce image size', 'webp compressor', 'photo compressor'],
    enLong: ['compress jpg png webp online without uploading', 'reduce image file size in browser', 'webp image compressor online free', 'resize and compress image online', 'compress image and keep quality', 'image compressor with quality slider', 'shrink image max width and height online'],
    viShort: ['nén ảnh', 'giảm dung lượng ảnh', 'nén ảnh jpg png', 'thu nhỏ ảnh'],
    viLong: ['công cụ nén ảnh online miễn phí không tải lên máy chủ', 'giảm dung lượng ảnh jpg png webp', 'nén ảnh ngay trên trình duyệt', 'nén và thu nhỏ kích thước ảnh', 'nén ảnh giữ chất lượng'],
  },
  '/image-format-converter': {
    enShort: ['image converter', 'png to jpg', 'jpg to png', 'png to webp', 'webp to png', 'image format converter'],
    enLong: ['convert image format online free', 'make png background transparent online', 'remove flat background color from image', 'webp to png converter', 'jpg to webp converter', 'convert image without uploading', 'transparent background by color online'],
    viShort: ['chuyển đổi định dạng ảnh', 'đổi png sang jpg', 'đổi jpg sang png', 'xóa nền ảnh', 'đổi webp sang png'],
    viLong: ['chuyển ảnh png sang jpg webp online miễn phí', 'làm nền ảnh trong suốt theo màu nền', 'đổi định dạng ảnh không tải lên máy chủ', 'xóa nền trắng khỏi ảnh online', 'chuyển ảnh webp sang png'],
  },
  '/document-converter': {
    enShort: ['pdf to word', 'word to pdf', 'excel to pdf', 'document converter', 'docx to pdf', 'csv to pdf', 'pdf to excel'],
    enLong: ['convert pdf to word online without uploading', 'convert csv to pdf online', 'convert excel to powerpoint online', 'convert docx to pdf in browser', 'pdf to powerpoint online free', 'convert word to excel online', 'document converter that keeps files in your browser'],
    viShort: ['chuyển pdf sang word', 'chuyển word sang pdf', 'chuyển excel sang pdf', 'chuyển đổi tài liệu', 'chuyển pdf sang excel'],
    viLong: ['chuyển đổi pdf word excel powerpoint online miễn phí', 'chuyển đổi file không tải lên máy chủ', 'chuyển csv sang pdf', 'chuyển excel sang powerpoint', 'chuyển docx sang pdf trên trình duyệt'],
  },
};

// Toàn bộ từ khóa của 1 trang theo thứ tự: Anh ngắn, Anh dài, Việt ngắn, Việt dài
// (không trùng lặp) - dùng cho JSON-LD trong routeMeta.ts.
export const getAllKeywords = (path: string): string[] => {
  const k = toolKeywords[path];
  if (!k) return [];
  return [...new Set([...k.enShort, ...k.enLong, ...k.viShort, ...k.viLong])];
};

// Các cụm DÀI hiển thị công khai ở mục "Related searches" của trang.
export const getRelatedSearches = (
  path: string
): { en: string[]; vi: string[] } => {
  const k = toolKeywords[path];
  if (!k || RELATED_SEARCHES_COUNT <= 0) return { en: [], vi: [] };
  return {
    en: k.enLong.slice(0, RELATED_SEARCHES_COUNT),
    vi: k.viLong.slice(0, RELATED_SEARCHES_COUNT),
  };
};
