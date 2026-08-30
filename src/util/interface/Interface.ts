import type {
  JwtAlgorithm,
  JwtMode,
  JwtSignatureStatus,
  TextDiffRow,
  TextDiffStats,
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
