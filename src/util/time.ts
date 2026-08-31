import type { TimestampUnit } from './interface/Type';

// Intl.supportedValuesOf chỉ được hỗ trợ rộng rãi từ ~2022 (Chrome 99+,
// Firefox 93+, Safari 15.4+) - bọc try/catch để trình duyệt cũ hơn vẫn có 1
// danh sách timezone dự phòng dùng được, thay vì crash cả trang.
const FALLBACK_TIMEZONES = [
  'UTC',
  'Asia/Ho_Chi_Minh',
  'Asia/Bangkok',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Europe/London',
  'Europe/Paris',
  'Europe/Moscow',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Australia/Sydney',
  'Pacific/Auckland',
];

export const getSupportedTimezones = (): string[] => {
  try {
    const zones = Intl.supportedValuesOf('timeZone');
    // Theo spec ECMA-402, "UTC" không nằm trong danh sách "named time zone
    // identifiers" mà supportedValuesOf trả về (dù vẫn là giá trị hợp lệ để
    // truyền vào Intl.DateTimeFormat({ timeZone })) - tự thêm vào đầu danh
    // sách vì đây là lựa chọn rất thông dụng cho 1 tool đổi timestamp.
    return zones.includes('UTC') ? zones : ['UTC', ...zones];
  } catch {
    return FALLBACK_TIMEZONES;
  }
};

export const getLocalTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

export type ConvertedTime = {
  formatted: string;
  isoUtc: string;
};

// Chuyển 1 Unix timestamp (giây hoặc mili-giây) sang ngày giờ hiển thị theo
// 1 timezone cụ thể, dùng thẳng Intl.DateTimeFormat của trình duyệt - không
// cần thư viện ngoài (moment/date-fns/luxon...) vì Intl đã có sẵn dữ liệu
// timezone (IANA) được trình duyệt tự cập nhật.
export const convertTimestamp = (
  timestamp: number,
  unit: TimestampUnit,
  timezone: string
): ConvertedTime => {
  const milliseconds = unit === 'seconds' ? timestamp * 1000 : timestamp;
  const date = new Date(milliseconds);

  // new Date() với giá trị vượt phạm vi hỗ trợ (~+-273,790 năm quanh 1970)
  // hoặc Infinity (chuỗi số quá dài parse ra) trả về "Invalid Date" - getTime()
  // lúc đó là NaN, dùng làm cờ báo lỗi thay vì để ném lỗi khó hiểu từ Intl.
  if (Number.isNaN(date.getTime())) {
    throw new Error('Timestamp is out of the supported date range.');
  }

  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'shortOffset',
  }).format(date);

  return { formatted, isoUtc: date.toISOString() };
};
