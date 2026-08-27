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
