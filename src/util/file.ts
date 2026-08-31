// Các hàm dùng chung cho trang File Compare: kiểm tra file hợp lệ (đuôi file,
// dung lượng, có phải nội dung dạng text hay không) và đọc nội dung file
// thành text.
//
// Chỉ nhận file dạng TEXT (source code, config, markup, log...) - các định
// dạng ảnh/tài liệu văn phòng/nén/nhị phân khác (jpg, png, pdf, docx, xlsx,
// zip, rar, exe...) không so sánh được ở đây vì so theo dòng/từ như
// compareTexts là vô nghĩa với chúng (và có thể là file cực lớn) - những
// file đó cần 1 công cụ so sánh riêng (vd so ảnh theo pixel), không thuộc
// phạm vi trang này.

// Danh sách đuôi file được coi là text, gom theo nhóm cho dễ rà soát/bổ sung.
// Không thể liệt kê hết MỌI đuôi text có trên đời nên coi đây là danh sách
// "đủ dùng" cho các loại phổ biến; file rơi ngoài danh sách vẫn có thể là
// text nhưng bị từ chối để giữ hành vi trang này dễ đoán - đúng như yêu cầu
// chỉ nhận các loại đã liệt kê.
const TEXT_FILE_EXTENSIONS = new Set([
  // Văn bản thuần / tài liệu
  '.txt', '.csv', '.tsv', '.md', '.markdown', '.mdx', '.rst', '.tex', '.log',
  '.adoc', '.asciidoc', '.textile', '.diff', '.patch', '.srt', '.vtt', '.ass',

  // Cấu hình / trao đổi dữ liệu
  '.json', '.json5', '.jsonc', '.jsonl', '.xml', '.xsd', '.xsl', '.xslt',
  '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.config', '.properties',
  '.env', '.plist', '.editorconfig', '.npmrc', '.yarnrc', '.babelrc',
  '.eslintrc', '.prettierrc', '.stylelintrc', '.htaccess', '.nvmrc',
  '.gitignore', '.gitattributes', '.dockerignore',

  // Web
  '.html', '.htm', '.xhtml', '.css', '.scss', '.sass', '.less', '.svg',
  '.js', '.mjs', '.cjs', '.jsx', '.ts', '.mts', '.cts', '.tsx', '.vue',
  '.svelte', '.astro', '.graphql', '.gql',

  // Ngôn ngữ lập trình
  '.java', '.py', '.c', '.h', '.cpp', '.cc', '.cxx', '.hpp', '.hxx', '.cs',
  '.go', '.php', '.rb', '.rs', '.swift', '.kt', '.kts', '.scala', '.pl',
  '.pm', '.lua', '.r', '.dart', '.groovy', '.clj', '.cljs', '.ex', '.exs',
  '.erl', '.hrl', '.hs', '.ml', '.mli', '.fs', '.fsi', '.fsx', '.jl', '.m',
  '.mm', '.vb', '.vbs', '.pas', '.asm', '.s', '.elm', '.nim', '.zig', '.sol',

  // Shell / script
  '.sh', '.bash', '.zsh', '.fish', '.ksh', '.bat', '.cmd', '.ps1', '.psm1',
  '.psd1', '.awk', '.sed',

  // Database
  '.sql',

  // Build / hạ tầng
  '.gradle', '.cmake', '.mk', '.dockerfile', '.proto', '.thrift', '.tf',
  '.tfvars', '.hcl', '.lock',
]);

// Tên file KHÔNG có đuôi nhưng theo quy ước vẫn là text (viết thường để so
// khớp không phân biệt hoa/thường).
const TEXT_FILE_NAMES = new Set([
  'dockerfile', 'makefile', 'readme', 'license', 'changelog', 'authors',
  'contributors', 'notice', 'gemfile', 'rakefile', 'procfile', 'vagrantfile',
]);

// Vài nhóm đuôi nhị phân phổ biến - CHỈ để báo lỗi rõ ràng hơn ("đây là file
// ảnh", "đây là file nén"...) thay vì gộp chung 1 câu "không hỗ trợ" mơ hồ.
// Bị từ chối hay không đã được quyết định bởi TEXT_FILE_EXTENSIONS ở trên;
// các Set này không tham gia logic chấp nhận/từ chối.
const IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.ico', '.tiff', '.tif',
  '.heic', '.heif', '.avif', '.raw', '.psd',
]);
const DOCUMENT_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods',
  '.odp', '.pages', '.numbers', '.key',
]);
const ARCHIVE_EXTENSIONS = new Set([
  '.zip', '.rar', '.7z', '.tar', '.gz', '.tgz', '.bz2', '.xz', '.iso',
  '.dmg', '.jar', '.war',
]);
const MEDIA_EXTENSIONS = new Set([
  '.mp3', '.mp4', '.wav', '.avi', '.mov', '.mkv', '.flac', '.ogg', '.webm',
  '.m4a', '.aac', '.wmv', '.flv',
]);
const EXECUTABLE_EXTENSIONS = new Set([
  '.exe', '.dll', '.so', '.dylib', '.bin', '.msi', '.apk', '.class', '.o',
  '.obj', '.pyc',
]);

// Chuỗi accept cho <input type="file"> - gợi ý trình duyệt lọc sẵn theo đúng
// danh sách trên (người dùng vẫn có thể chọn "All Files" và bỏ qua gợi ý
// này, nên validateCompareFile bên dưới mới là nơi thực sự chặn).
export const TEXT_FILE_ACCEPT = [...TEXT_FILE_EXTENSIONS].join(',');

const getExtension = (fileName: string): string => {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex === -1 ? '' : fileName.slice(dotIndex).toLowerCase();
};

const describeRejectedExtension = (ext: string): string => {
  if (IMAGE_EXTENSIONS.has(ext)) return 'is an image file';
  if (DOCUMENT_EXTENSIONS.has(ext)) return 'is a document file (PDF/Word/Excel/PowerPoint/...)';
  if (ARCHIVE_EXTENSIONS.has(ext)) return 'is an archive file';
  if (MEDIA_EXTENSIONS.has(ext)) return 'is an audio/video file';
  if (EXECUTABLE_EXTENSIONS.has(ext)) return 'is an executable/binary file';
  return 'is not a supported text file type';
};

// Giới hạn dung lượng đọc trực tiếp trên trình duyệt - so sánh nội dung dùng
// thuật toán O(n*m) theo số dòng (xem compareTexts), giới hạn byte ở đây chỉ
// để chặn sớm file quá khổ trước khi tốn công đọc, còn giới hạn số dòng/số
// cặp dòng thực sự đã được compareTexts tự kiểm tra riêng.
export const MAX_COMPARE_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const validateCompareFile = (file: File): string | null => {
  const lowerName = file.name.toLowerCase();
  const ext = getExtension(file.name);
  const isAccepted = TEXT_FILE_NAMES.has(lowerName) || TEXT_FILE_EXTENSIONS.has(ext);

  if (!isAccepted) {
    return `"${file.name}" ${describeRejectedExtension(ext)} and cannot be compared here. Only text-based files (.txt, .csv, .json, .xml, .yaml, .md, .log, source code, ...) are supported.`;
  }
  if (file.size > MAX_COMPARE_FILE_SIZE) {
    return `"${file.name}" is too large (max ${
      MAX_COMPARE_FILE_SIZE / (1024 * 1024)
    }MB).`;
  }
  return null;
};

// Chỉ xét trong 1 đoạn mẫu đầu file - đủ để phát hiện file nhị phân mà
// không phải quét toàn bộ file lớn.
const BINARY_SNIFF_SAMPLE_SIZE = 8000;
// Ký tự thay thế Unicode (U+FFFD) - trình duyệt chèn ký tự này mỗi khi gặp
// chuỗi byte không giải mã được thành UTF-8 hợp lệ, dấu hiệu rõ nhất của
// việc đang đọc dữ liệu nhị phân như thể nó là text.
const REPLACEMENT_CHAR = String.fromCodePoint(0xfffd);
// Byte NUL - file text thật gần như không bao giờ chứa byte này.
const NUL_CHAR = String.fromCodePoint(0);

// Lớp phòng vệ thứ 2, chạy SAU khi đã qua được validateCompareFile: đuôi file
// hợp lệ không đảm bảo NỘI DUNG thực sự là text (vd 1 file ảnh bị đổi tên
// đuôi thành .txt) - kiểm tra thêm nội dung đã đọc được để bắt đúng trường
// hợp này. Có byte NUL -> gần như chắc chắn là file nhị phân. Ngoài ra nếu
// tỉ lệ ký tự thay thế/ký tự điều khiển bất thường trong đoạn mẫu vượt 1%,
// cũng coi là nhị phân - ngưỡng này đủ cao để không hiểu nhầm text hợp lệ
// (thỉnh thoảng có vài ký tự điều khiển hợp lệ) nhưng vẫn bắt được file nhị
// phân thật (thường có RẤT nhiều byte "rác" ngay từ đầu file).
export const isLikelyBinaryContent = (content: string): boolean => {
  const sample = content.slice(0, BINARY_SNIFF_SAMPLE_SIZE);
  if (sample.length === 0) return false;
  if (sample.includes(NUL_CHAR)) return true;

  let suspiciousCount = 0;
  for (const char of sample) {
    const code = char.codePointAt(0) ?? 0;
    const isControlChar = code < 32 && code !== 9 && code !== 10 && code !== 13;
    if (char === REPLACEMENT_CHAR || isControlChar) suspiciousCount++;
  }
  return suspiciousCount / sample.length > 0.01;
};

// Đọc file thành text bằng FileReader, bọc trong Promise để dùng async/await
// ở component thay vì callback. Không ép encoding cụ thể - để trình duyệt tự
// suy đoán (mặc định UTF-8) giống cách hầu hết trình soạn thảo text làm.
export const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => {
      reject(new Error(`Could not read "${file.name}".`));
    };
    reader.readAsText(file);
  });

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
