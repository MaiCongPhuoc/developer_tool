import type { JsonValue } from '@/util/interface/Type';

// JSON.parse/JSON.stringify gốc lưu số bằng kiểu `number` (dấu phẩy động
// 64-bit), chỉ chính xác tới Number.MAX_SAFE_INTEGER (~9 * 10^15). Số nguyên
// dài hơn sẽ bị làm tròn sai. 2 hàm dưới đây bọc lại JSON.parse/stringify để
// những số nguyên vượt ngưỡng an toàn được giữ nguyên vẹn bằng kiểu BigInt.
//
// Prefix/suffix được sinh NGẪU NHIÊN riêng cho mỗi lần gọi (thay vì 1 hằng số
// cố định) để tránh trường hợp 1 chuỗi do người dùng nhập tình cờ trùng định
// dạng marker (vd input có sẵn giá trị string "@@bigint:123@@") bị hiểu nhầm
// thành BigInt. Với marker cố định, reviver không thể phân biệt được marker
// "thật" (do chính markUnsafeIntegers sinh ra) với 1 chuỗi trùng lặp ngẫu
// nhiên từ input - random hoá theo từng lần gọi khiến xác suất trùng gần như
// bằng 0.
const createMarker = () => {
  const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return { prefix: `@@bigint:${token}:`, suffix: `:${token}@@` };
};

// Quét từng ký tự, bỏ qua phần nằm trong dấu nháy kép (chuỗi) - giống cách
// stripTrailingCommas làm - để không đụng vào số nằm bên trong 1 chuỗi.
// Số nguyên (không có dấu . hoặc e/E theo sau) vượt ngưỡng an toàn thì được
// bọc thành 1 chuỗi đánh dấu, để reviver bên dưới nhận ra và đổi thành BigInt.
const markUnsafeIntegers = (
  json: string,
  prefix: string,
  suffix: string
): string => {
  let result = '';
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < json.length; i++) {
    const char = json[i];

    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\' && inString) {
      result += char;
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    if (!inString && (char === '-' || (char >= '0' && char <= '9'))) {
      let j = char === '-' ? i + 1 : i;
      const digitsStart = j;
      while (j < json.length && json[j] >= '0' && json[j] <= '9') {
        j++;
      }

      const isPlainInteger =
        j > digitsStart &&
        json[j] !== '.' &&
        json[j] !== 'e' &&
        json[j] !== 'E';
      const token = json.slice(i, j);

      result +=
        isPlainInteger && !Number.isSafeInteger(Number(token))
          ? `"${prefix}${token}${suffix}"`
          : token;

      i = j - 1;
      continue;
    }

    result += char;
  }

  return result;
};

export const parsePreservingBigInt = (json: string): JsonValue => {
  const { prefix, suffix } = createMarker();
  return JSON.parse(markUnsafeIntegers(json, prefix, suffix), (_key, value) =>
    typeof value === 'string' && value.startsWith(prefix) && value.endsWith(suffix)
      ? BigInt(value.slice(prefix.length, -suffix.length))
      : value
  ) as JsonValue;
};

export const stringifyPreservingBigInt = (
  value: JsonValue,
  space?: string | number
): string => {
  const { prefix, suffix } = createMarker();
  const json = JSON.stringify(
    value,
    (_key, val) => (typeof val === 'bigint' ? `${prefix}${val}${suffix}` : val),
    space
  );
  const escapeForRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return json.replace(
    new RegExp(`"${escapeForRegex(prefix)}(-?\\d+)${escapeForRegex(suffix)}"`, 'g'),
    '$1'
  );
};
