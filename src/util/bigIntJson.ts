import type { JsonValue } from '@/util/interface/Type';

// JSON.parse/JSON.stringify gốc lưu số bằng kiểu `number` (dấu phẩy động
// 64-bit), chỉ chính xác tới Number.MAX_SAFE_INTEGER (~9 * 10^15). Số nguyên
// dài hơn sẽ bị làm tròn sai. 2 hàm dưới đây bọc lại JSON.parse/stringify để
// những số nguyên vượt ngưỡng an toàn được giữ nguyên vẹn bằng kiểu BigInt.
const BIGINT_PREFIX = '@@bigint:';
const BIGINT_SUFFIX = '@@';

// Quét từng ký tự, bỏ qua phần nằm trong dấu nháy kép (chuỗi) - giống cách
// stripTrailingCommas làm - để không đụng vào số nằm bên trong 1 chuỗi.
// Số nguyên (không có dấu . hoặc e/E theo sau) vượt ngưỡng an toàn thì được
// bọc thành 1 chuỗi đánh dấu, để reviver bên dưới nhận ra và đổi thành BigInt.
const markUnsafeIntegers = (json: string): string => {
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
        j > digitsStart && json[j] !== '.' && json[j] !== 'e' && json[j] !== 'E';
      const token = json.slice(i, j);

      result +=
        isPlainInteger && !Number.isSafeInteger(Number(token))
          ? `"${BIGINT_PREFIX}${token}${BIGINT_SUFFIX}"`
          : token;

      i = j - 1;
      continue;
    }

    result += char;
  }

  return result;
};

export const parsePreservingBigInt = (json: string): JsonValue =>
  JSON.parse(markUnsafeIntegers(json), (_key, value) =>
    typeof value === 'string' &&
    value.startsWith(BIGINT_PREFIX) &&
    value.endsWith(BIGINT_SUFFIX)
      ? BigInt(value.slice(BIGINT_PREFIX.length, -BIGINT_SUFFIX.length))
      : value
  ) as JsonValue;

export const stringifyPreservingBigInt = (
  value: JsonValue,
  space?: string | number
): string => {
  const json = JSON.stringify(
    value,
    (_key, val) =>
      typeof val === 'bigint' ? `${BIGINT_PREFIX}${val}${BIGINT_SUFFIX}` : val,
    space
  );
  return json.replace(
    new RegExp(`"${BIGINT_PREFIX}(-?\\d+)${BIGINT_SUFFIX}"`, 'g'),
    '$1'
  );
};
