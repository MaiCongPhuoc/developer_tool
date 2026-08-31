// Sinh 1 UUID v4 ngẫu nhiên bằng Web Crypto API có sẵn trên trình duyệt
// (dạng chuẩn: chữ thường, có dấu gạch ngang) - không cần cài thư viện ngoài.
export const generateUuidV4 = (): string => crypto.randomUUID();

export type UuidFormatOptions = {
  uppercase: boolean;
  hyphens: boolean;
  braces: boolean;
};

// Áp định dạng hiển thị lên 1 UUID gốc (luôn ở dạng chuẩn lowercase + dấu -).
// Thứ tự xử lý: bỏ dấu "-" trước, rồi mới đổi hoa/thường, cuối cùng mới bọc
// ngoặc {} - đổi thứ tự (vd bọc {} trước rồi mới toUpperCase) vẫn ra kết quả
// đúng vì các bước không phụ thuộc lẫn nhau, nhưng giữ thứ tự cố định cho dễ đọc.
export const formatUuid = (
  uuid: string,
  { uppercase, hyphens, braces }: UuidFormatOptions
): string => {
  let result = hyphens ? uuid : uuid.replace(/-/g, '');
  if (uppercase) result = result.toUpperCase();
  if (braces) result = `{${result}}`;
  return result;
};
