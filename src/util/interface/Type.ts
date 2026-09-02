export type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

// Các kiểu dữ liệu dùng cho cây JSON có thể thu gọn/sửa (JsonTreeView).
// bigint dùng riêng cho số nguyên vượt Number.MAX_SAFE_INTEGER, để không bị
// JSON.parse/stringify gốc làm tròn mất chính xác (xem util/bigIntJson.ts).
export type JsonPrimitive = string | number | boolean | null | bigint;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };
// Đường dẫn từ root tới 1 node, vd ['features', 0] = root.features[0]
export type JsonPath = (string | number)[];

// Dữ liệu cho cây XML có thể thu gọn/sửa (XmlTreeView)
export type XmlElementNode = {
  type: 'element';
  tagName: string;
  attributes: Record<string, string>;
  children: XmlNode[];
};

export type XmlTextNode = {
  type: 'text';
  value: string;
};

export type XmlNode = XmlElementNode | XmlTextNode;
// Đường dẫn từ root tới 1 phần tử trên cây XML (mảng chỉ số con), vd [0, 1]
export type XmlPath = number[];
// Vị trí cụ thể cần sửa trên cây XML: nội dung text của 1 thẻ dạng lá
// (vd <year>2005</year>), hoặc giá trị của 1 attribute
export type XmlEditTarget =
  | { kind: 'text'; path: XmlPath }
  | { kind: 'attribute'; path: XmlPath; attrName: string };

// Các kiểu dữ liệu dùng cho trang JWT Encoder/Decoder (Encryption.tsx).
// Chỉ hỗ trợ họ HMAC (đối xứng, cùng 1 secret để ký và verify) vì Web Crypto
// API dùng được thẳng trên trình duyệt, không cần cài thêm thư viện. Các
// thuật toán bất đối xứng (RS256, ES256...) cần cặp khoá public/private nên
// tạm chưa hỗ trợ.
export type JwtAlgorithm = 'HS256' | 'HS384' | 'HS512';
export type JwtMode = 'encode' | 'decode';
export type JwtSignatureStatus = 'valid' | 'invalid' | 'unverified';

// Các kiểu dữ liệu dùng cho trang Text Compare (so sánh 2 đoạn text theo
// dòng, hiển thị song song 2 khung giống WinMerge).
export type TextDiffLineType = 'equal' | 'delete' | 'insert' | 'replace';

// 1 token (từ / khoảng trắng / ký tự khác) bên trong 1 dòng bị sửa (replace),
// dùng để tô sáng đúng phần khác nhau thay vì tô nguyên cả dòng.
export type TextDiffWordOp = {
  type: 'equal' | 'delete' | 'insert';
  value: string;
};

// 1 dòng trong kết quả so sánh, đã ghép cặp giữa 2 bên để hiển thị song song.
// leftLine/rightLine = null nghĩa là bên đó không có dòng tương ứng (thuần
// thêm hoặc thuần xoá dòng). leftWords/rightWords chỉ có khi type = 'replace'.
export type TextDiffRow = {
  type: TextDiffLineType;
  leftLine: string | null;
  rightLine: string | null;
  leftLineNumber: number | null;
  rightLineNumber: number | null;
  leftWords?: TextDiffWordOp[];
  rightWords?: TextDiffWordOp[];
};

export type TextDiffStats = {
  equal: number;
  inserted: number;
  deleted: number;
  modified: number;
};

// Trang File Compare: giống Text Compare nhưng nội dung lấy từ file .txt/.csv
// người dùng chọn thay vì gõ tay. content đã đọc sẵn dạng text (FileReader)
// để việc so sánh (compareTexts) dùng chung logic với Text Compare.
export type FileCompareFile = {
  name: string;
  size: number;
  content: string;
};

// Độ mạnh mật khẩu ước lượng theo số bit entropy (xem util/password.ts).
export type PasswordStrength =
  | 'very-weak'
  | 'weak'
  | 'fair'
  | 'strong'
  | 'very-strong';

// Đơn vị của Unix timestamp nhập vào trang Time / Timezone Converter - giây
// (chuẩn Unix timestamp gốc) hoặc mili-giây (kiểu Date.now()/JS hay dùng).
export type TimestampUnit = 'seconds' | 'milliseconds';

// Các loại thành phần cú pháp regex mà util/regex.ts nhận diện được, dùng để
// tô màu riêng từng loại trong bảng giải thích trên trang Regex Tester.
export type RegexTokenType =
  | 'anchor'
  | 'quantifier'
  | 'group'
  | 'class'
  | 'escape'
  | 'alternation'
  | 'literal'
  | 'wildcard';

export type RegexToken = {
  type: RegexTokenType;
  value: string;
  description: string;
};

export type RegexMatchResult = {
  match: string;
  index: number;
  // Nội dung các capturing group trong lần khớp này - undefined nếu group
  // đó không tham gia khớp (vd nằm trong 1 nhánh alternation không được chọn).
  groups: (string | undefined)[];
};

// Trang Unit Converter: nhiều nhóm đơn vị độc lập, mỗi nhóm có 1 bộ đơn vị và
// công thức quy đổi riêng (xem util/units.ts, util/temperature.ts,
// util/numberBase.ts, util/color.ts). fontSize khác các nhóm số học đơn giản
// vì cần thêm 1 tham số "base font size" (px/rem/em/% vốn là đơn vị TƯƠNG
// ĐỐI, không có hệ số quy đổi cố định như km/kg/byte). currency khác biệt:
// không có hệ số cố định (tỷ giá đổi theo thời gian thực) nên phải gọi API
// bên ngoài thay vì tính offline - xem util/currency.ts. temperature dùng
// phép biến đổi AFFINE (nhân + cộng) chứ không chỉ nhân đơn thuần như
// length/weight/storage. numberBase và color không phải quy đổi SỐ mà là
// quy đổi CÁCH BIỂU DIỄN (hệ đếm / định dạng màu).
export type UnitConverterCategory =
  | 'length'
  | 'weight'
  | 'storage'
  | 'fontSize'
  | 'currency'
  | 'temperature'
  | 'numberBase'
  | 'color';

export type FontSizeUnit = 'px' | 'rem' | 'em' | '%';

export type TemperatureUnit = 'celsius' | 'fahrenheit' | 'kelvin';

export type NumberBaseUnit = 'decimal' | 'binary' | 'octal' | 'hexadecimal';

export type ColorFormat = 'hex' | 'rgb' | 'hsl';

// Trang Color Picker: Tab "palette" dùng input[type=color]/preset swatch/gõ
// tay HEX (mọi thao tác đều diễn ra trong trang, offline hoàn toàn). Tab
// "eyedropper" dùng EyeDropper API gốc của trình duyệt để lấy màu 1 điểm ảnh
// bất kỳ trên TOÀN MÀN HÌNH, kể cả ngoài trình duyệt - xem util/eyedropper.ts.
export type ColorPickerTab = 'palette' | 'eyedropper';
