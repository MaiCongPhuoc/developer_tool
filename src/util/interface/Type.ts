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
