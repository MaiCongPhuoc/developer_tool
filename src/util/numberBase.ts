import type { NumberBaseUnit } from './interface/Type';

// Giới hạn độ dài chuỗi nhập vào - BigInt xử lý được số lớn tuỳ ý nên không
// lo tràn số, nhưng 1 chuỗi hàng chục nghìn ký tự vẫn là input vô nghĩa cho
// công cụ này, chặn sớm cho gọn thông báo lỗi.
const MAX_INPUT_LENGTH = 256;

const BASE_INFO: Record<
  NumberBaseUnit,
  { radix: number; prefix: string; pattern: RegExp; charsetLabel: string }
> = {
  decimal: { radix: 10, prefix: '', pattern: /^\d+$/, charsetLabel: '0-9' },
  binary: { radix: 2, prefix: '0b', pattern: /^[01]+$/, charsetLabel: '0 or 1' },
  octal: { radix: 8, prefix: '0o', pattern: /^[0-7]+$/, charsetLabel: '0-7' },
  hexadecimal: {
    radix: 16,
    prefix: '0x',
    pattern: /^[0-9a-fA-F]+$/,
    charsetLabel: '0-9, A-F',
  },
};

// Dùng BigInt thay vì Number/parseInt để không mất độ chính xác với số lớn
// (vd giá trị hex 64-bit, pointer, hash...) - Number (double) chỉ chính xác
// tới 2^53-1, trong khi dev thường làm việc với số vượt xa ngưỡng này.
// BigInt() tự parse đúng theo tiền tố 0b/0o/0x nên chỉ cần ghép tiền tố ứng
// với hệ đếm nguồn trước khi gọi.
export const convertNumberBase = (
  value: string,
  from: NumberBaseUnit,
  to: NumberBaseUnit
): string => {
  if (value.length > MAX_INPUT_LENGTH) {
    throw new Error(`Value must not exceed ${MAX_INPUT_LENGTH} characters.`);
  }

  const fromInfo = BASE_INFO[from];
  if (!fromInfo.pattern.test(value)) {
    throw new Error(
      `"${value}" is not a valid ${from} number (allowed characters: ${fromInfo.charsetLabel}).`
    );
  }

  const bigIntValue = BigInt(fromInfo.prefix + value);
  return bigIntValue.toString(BASE_INFO[to].radix).toUpperCase();
};
