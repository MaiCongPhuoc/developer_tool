import type {
  FileCompareFile,
  JwtAlgorithm,
  JwtMode,
  JwtSignatureStatus,
  PasswordStrength,
  RegexMatchResult,
  RegexToken,
  TextDiffRow,
  TextDiffStats,
  TimestampUnit,
  UnitConverterCategory,
} from './Type';

export interface SidebarState {
  isExpanded: boolean;
  isMobileOpen: boolean;
  isMobile: boolean;
  isHovered: boolean;
  activeItem: string | null;
  openSubmenu: string | null;
}

export interface JsonFormatterState {
  inputJson: string;
  formattedJson: string;
  error: string | null;
  copied: boolean;
  // key = JSON.stringify(đường dẫn node), value = true nếu node đó đang bị thu gọn
  collapsedPaths: Record<string, boolean>;
}

export interface XmlFormatterState {
  inputXml: string;
  formattedXml: string;
  error: string | null;
  copied: boolean;
  // key = JSON.stringify(đường dẫn node, vd [0,1]), value = true nếu đang bị thu gọn
  collapsedPaths: Record<string, boolean>;
}

export interface JwtState {
  mode: JwtMode;
  algorithm: JwtAlgorithm;
  // Encode: header/payload nhập dạng JSON thô, tự ký thành 1 token
  headerInput: string;
  payloadInput: string;
  secret: string;
  encodedToken: string;
  // Decode: dán token vào, tách ra header/payload đã format đẹp
  tokenInput: string;
  decodedHeader: string;
  decodedPayload: string;
  rawSignature: string;
  // null = chưa decode; 'unverified' = decode được nhưng chưa nhập secret để verify
  signatureStatus: JwtSignatureStatus | null;
  // Claim "exp" (nếu có) - tính sẵn ở thunk (thời điểm decode) để component
  // chỉ cần hiển thị, không phải tự gọi Date.now() lúc render.
  expiresAt: string | null;
  isExpired: boolean | null;
  error: string | null;
  // Trang này có NHIỀU nút "Copy" riêng biệt (Header/Payload/Encoded Token) -
  // dùng 1 cờ boolean chung sẽ khiến bấm Copy ở 1 nút làm TẤT CẢ các nút khác
  // cũng đổi chữ thành "Copied!" theo. Lưu lại đúng field nào vừa được copy
  // (hoặc null nếu chưa copy gì / đã hết hạn hiển thị) để mỗi nút tự so sánh
  // với field của chính nó.
  copiedField: 'encoded' | 'header' | 'payload' | null;
}

// Trang SQL Formatter: chỉ cần định dạng lại chuỗi SQL cho đẹp (không có
// cấu trúc cây để sửa từng giá trị như JSON/XML) nên không cần collapsedPaths.
export interface SqlFormatterState {
  inputSql: string;
  formattedSql: string;
  error: string | null;
  copied: boolean;
}

// Trang Dummy Text: sinh đoạn text mẫu (Lorem Ipsum) theo đúng số ký tự nhập
// vào. charCount giữ dạng string để bind trực tiếp vào input (giống các
// trang khác), số thực sự dùng để sinh text được parse trong reducer.
export interface DummyTextState {
  charCount: string;
  generatedText: string;
  error: string | null;
  copied: boolean;
}

// Trang Text Compare: so sánh 2 đoạn text theo dòng (giống WinMerge). rows là
// kết quả đã tính sẵn (khi bấm Compare), component chỉ cần đọc và tô màu chứ
// không tự tính lại mỗi lần render.
export interface TextCompareState {
  leftText: string;
  rightText: string;
  rows: TextDiffRow[];
  stats: TextDiffStats | null;
  error: string | null;
}

// Trang File Compare: cùng dạng kết quả (rows/stats) với Text Compare, chỉ
// khác nguồn dữ liệu 2 bên là file đã đọc thay vì text gõ tay. leftFile/
// rightFile = null nghĩa là bên đó chưa chọn file.
export interface FileCompareState {
  leftFile: FileCompareFile | null;
  rightFile: FileCompareFile | null;
  rows: TextDiffRow[];
  stats: TextDiffStats | null;
  error: string | null;
}

// Trang UUID Generator: chỉ hỗ trợ UUID v4 (random) - đủ dùng cho hầu hết
// nhu cầu và có sẵn crypto.randomUUID() trên trình duyệt, không cần thư viện
// ngoài. count giữ dạng string để bind trực tiếp vào input (giống DummyText),
// số thực sự dùng để sinh được parse trong reducer.
export interface UuidState {
  count: string;
  uppercase: boolean;
  hyphens: boolean;
  braces: boolean;
  uuids: string[];
  error: string | null;
  // Mỗi dòng kết quả có nút Copy riêng + 1 nút Copy All chung, nên tách 2 cờ
  // riêng biệt (giống copiedField ở JwtState) để bấm Copy ở dòng này không
  // làm dòng khác/nút Copy All hiện nhầm "Copied!" theo.
  copiedIndex: number | null;
  copiedAll: boolean;
}

// Trang Password Generator: layout/state theo đúng pattern UuidState. Chỉ
// sinh 1 mật khẩu mỗi lần (không bulk như UUID) vì đi kèm thanh đo độ mạnh -
// hiện nhiều mật khẩu cùng lúc sẽ phải hiện nhiều thanh đo, không cần thiết.
export interface PasswordGeneratorState {
  length: string;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  password: string;
  // null = chưa generate lần nào; tính sẵn ở thunk lúc generate (giống cách
  // JwtState tính sẵn expiresAt/isExpired) để component chỉ cần hiển thị.
  strength: PasswordStrength | null;
  error: string | null;
  copied: boolean;
}

// Trang QR Code Generator: sinh QR từ text/URL nhập vào, giữ sẵn cả bản PNG
// (data URL, để <img> hiển thị VÀ tải trực tiếp) lẫn SVG (chuỗi markup, chỉ
// dùng để tải - không hiển thị song song với PNG vì cùng 1 nội dung).
export interface QrCodeState {
  text: string;
  qrCodeDataUrl: string;
  qrCodeSvg: string;
  error: string | null;
}

// Trang Time / Timezone Converter: đổi Unix timestamp sang ngày giờ đọc được
// theo 1 timezone chọn được, dùng thẳng Intl.DateTimeFormat của trình duyệt
// (xem util/time.ts) - không cần thư viện ngoài (moment/date-fns/luxon...).
export interface TimeConverterState {
  timestamp: string;
  unit: TimestampUnit;
  timezone: string;
  formatted: string;
  isoUtc: string;
  error: string | null;
  // 2 kết quả (giờ địa phương theo timezone đã chọn / UTC ISO) có nút Copy
  // riêng - giống copiedField ở JwtState, để bấm Copy ở dòng này không làm
  // dòng kia hiện nhầm "Copied!" theo.
  copiedField: 'formatted' | 'iso' | null;
}

// Trang Regex Tester: kiểm tra 1 pattern regex có khớp với đoạn text nhập
// vào không, kèm bảng giải thích cú pháp (tokens) tự sinh - xem util/regex.ts.
// Mỗi cờ flag (g/i/m/s/u/y) tách thành field boolean riêng để bind trực tiếp
// vào từng checkbox, giống pattern includeUppercase/... của PasswordGeneratorState.
export interface RegexTesterState {
  pattern: string;
  flagGlobal: boolean;
  flagIgnoreCase: boolean;
  flagMultiline: boolean;
  flagDotAll: boolean;
  flagUnicode: boolean;
  flagSticky: boolean;
  testText: string;
  isMatch: boolean;
  matches: RegexMatchResult[];
  tokens: RegexToken[];
  error: string | null;
}

// Trang Unit Converter: 4 nhóm đơn vị độc lập (length/weight/storage/
// fontSize), mỗi nhóm tự quản lý fromUnit/toUnit riêng (xem util/units.ts).
// basePx chỉ có ý nghĩa khi category = 'fontSize' (px/rem/em/% là đơn vị
// tương đối, cần 1 mốc quy đổi) nhưng vẫn để phẳng trong state chung cho đơn
// giản, giống cách JwtState gộp chung field của cả Encode lẫn Decode.
export interface UnitConverterState {
  category: UnitConverterCategory;
  inputValue: string;
  fromUnit: string;
  toUnit: string;
  basePx: string;
  result: string;
  error: string | null;
  copied: boolean;
  // Cache tỷ giá cho nhóm 'currency' - null nghĩa là CHƯA fetch lần nào
  // trong phiên này. Cố ý KHÔNG bị xoá bởi clearUnitConverter (khác các field
  // khác) để rời trang rồi quay lại không phải gọi lại API - chỉ mất khi
  // reload lại cả trang thật (giống cách quảng cáo chỉ tải lại khi mở app/
  // reload trang thật, xem project_ad_architecture).
  currencyRates: Record<string, number> | null;
  currencyRatesUpdatedAt: string | null;
}
