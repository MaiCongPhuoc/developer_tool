import type { PasswordStrength } from './interface/Type';

export type PasswordOptions = {
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
};

const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

// Lấy 1 số nguyên ngẫu nhiên trong [0, max) bằng Web Crypto API (an toàn hơn
// Math.random cho mục đích sinh mật khẩu). Dùng rejection sampling (loại bỏ
// byte rơi vào phần dư) thay vì "randomByte % max" để tránh thiên vị: nếu
// dùng modulo thẳng, các giá trị nhỏ trong [0, max) sẽ có xác suất xuất hiện
// cao hơn 1 chút so với phần dư của 256 không chia hết cho max.
const getRandomInt = (max: number): number => {
  const range = 256 - (256 % max);
  const buf = new Uint8Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= range);
  return value % max;
};

// Sinh mật khẩu ngẫu nhiên từ các nhóm ký tự đã bật. Trả về '' nếu không có
// nhóm nào được bật (không tự chọn mặc định thay người dùng).
export const generatePassword = (
  length: number,
  options: PasswordOptions
): string => {
  const pools: string[] = [];
  if (options.uppercase) pools.push(CHARSETS.uppercase);
  if (options.lowercase) pools.push(CHARSETS.lowercase);
  if (options.numbers) pools.push(CHARSETS.numbers);
  if (options.symbols) pools.push(CHARSETS.symbols);

  if (pools.length === 0) return '';

  const allChars = pools.join('');
  const result: string[] = [];

  // Nếu đủ chỗ, đảm bảo mỗi nhóm đã chọn góp mặt ít nhất 1 ký tự - tránh
  // trường hợp may rủi sinh ra mật khẩu chỉ toàn chữ thường dù đã bật cả 4 tuỳ chọn.
  if (length >= pools.length) {
    for (const pool of pools) {
      result.push(pool[getRandomInt(pool.length)]);
    }
  }
  while (result.length < length) {
    result.push(allChars[getRandomInt(allChars.length)]);
  }

  // Xáo trộn (Fisher-Yates) để các ký tự "bắt buộc" ở bước trên không luôn
  // nằm ở đầu chuỗi.
  for (let i = result.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
};

// Ước lượng độ mạnh theo số bit entropy = length * log2(kích thước bảng ký
// tự) - cách tính phổ biến của các công cụ kiểm tra mật khẩu (zxcvbn rút
// gọn), không cần thư viện ngoài. Mốc 28/36/60/128 bit tham khảo theo
// khuyến nghị phổ biến: <28 dễ bị brute-force trong vài giây, >=128 gần như
// không thể brute-force với công nghệ hiện tại.
export const calculatePasswordStrength = (
  password: string,
  options: PasswordOptions
): PasswordStrength => {
  if (!password) return 'very-weak';

  let poolSize = 0;
  if (options.uppercase) poolSize += CHARSETS.uppercase.length;
  if (options.lowercase) poolSize += CHARSETS.lowercase.length;
  if (options.numbers) poolSize += CHARSETS.numbers.length;
  if (options.symbols) poolSize += CHARSETS.symbols.length;
  if (poolSize === 0) return 'very-weak';

  const entropy = password.length * Math.log2(poolSize);

  if (entropy < 28) return 'very-weak';
  if (entropy < 36) return 'weak';
  if (entropy < 60) return 'fair';
  if (entropy < 128) return 'strong';
  return 'very-strong';
};
