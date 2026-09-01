// Nguồn tỷ giá: open.er-api.com (thuộc exchangerate-api.com) - endpoint
// "Open Access", HOÀN TOÀN MIỄN PHÍ, không cần đăng ký/API key, cho phép gọi
// thẳng từ trình duyệt (đã bật CORS: access-control-allow-origin: *).
// Giới hạn đã biết: cập nhật 1 lần/ngày, và nhà cung cấp khuyến nghị không
// gọi quá 1 lần/giờ - vì vậy rates được cache lại trong Redux (xem
// unitConverterSlice.ts: clearUnitConverter cố ý GIỮ LẠI cache này khi rời
// rồi quay lại trang) thay vì gọi lại API mỗi lần bấm Convert.
// Đây là tính năng DUY NHẤT của app cần kết nối internet - mọi trang khác
// đều tính toán hoàn toàn trong trình duyệt.
const EXCHANGE_RATE_API_URL = 'https://open.er-api.com/v6/latest/USD';

export type ExchangeRates = Record<string, number>;

export type ExchangeRateSnapshot = {
  rates: ExchangeRates;
  // Lấy thẳng chuỗi thời điểm cập nhật từ API (vd "Tue, 01 Sep 2026 00:02:31
  // +0000") thay vì tự ghi lại thời điểm fetch của trình duyệt - phản ánh
  // đúng thời điểm DỮ LIỆU thực sự được cập nhật trên server, không phải lúc
  // người dùng bấm nút.
  updatedAt: string;
};

// Danh sách vài mã tiền tệ phổ biến để hiện tạm trong dropdown TRƯỚC khi
// fetch xong lần đầu - sau khi có rates thật, dropdown sẽ dùng danh sách đầy
// đủ ~166 mã trả về từ API (xem UnitConverter.tsx).
export const COMMON_CURRENCY_FALLBACK = [
  'USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'CNY', 'HKD', 'SGD',
  'VND', 'KRW', 'INR', 'THB', 'IDR', 'MYR', 'PHP', 'NZD', 'SEK', 'NOK',
];

export const fetchExchangeRates = async (): Promise<ExchangeRateSnapshot> => {
  let response: Response;
  try {
    response = await fetch(EXCHANGE_RATE_API_URL);
  } catch {
    // fetch() ném lỗi network thô (TypeError: Failed to fetch) khi mất mạng/
    // bị chặn CORS/DNS lỗi... - không cho người dùng thấy message kỹ thuật
    // khó hiểu đó.
    throw new Error(
      'Could not reach the exchange rate service. Please check your internet connection.'
    );
  }

  if (!response.ok) {
    throw new Error(
      `Exchange rate service returned an error (HTTP ${response.status}).`
    );
  }

  const data = await response.json();
  if (data.result !== 'success' || !data.rates) {
    throw new Error('Exchange rate service returned an unexpected response.');
  }

  return { rates: data.rates, updatedAt: data.time_last_update_utc };
};

// Quy đổi giữa 2 mã tiền tệ bất kỳ - cả 2 đều đã quy về cùng 1 base (USD) từ
// API, nên value_to = (value_from / rate_from) * rate_to.
export const convertCurrencyValue = (
  value: number,
  rates: ExchangeRates,
  fromCode: string,
  toCode: string
): number => {
  const fromRate = rates[fromCode];
  const toRate = rates[toCode];
  if (fromRate === undefined || toRate === undefined) {
    throw new Error('Unsupported currency code.');
  }
  return (value / fromRate) * toRate;
};

// Tên đầy đủ của 1 mã tiền tệ (vd "VND" -> "Vietnamese Dong") dùng
// Intl.DisplayNames có sẵn của trình duyệt - không cần tự hardcode danh sách
// ~166 tên (dễ sai/thiếu cập nhật). Hiện tên ĐƠN VỊ TIỀN TỆ thay vì tên quốc
// gia vì 1 tiền tệ có thể dùng chung nhiều nước (vd EUR ở ~20 nước) nên
// "tên quốc gia" sẽ mơ hồ, còn tên tiền tệ luôn ánh xạ 1-1 với mã. Một số mã
// hiếm gặp (tiền tệ không chính thức của vùng lãnh thổ nhỏ, vd "TVD") không
// nằm trong dữ liệu ISO 4217 mà Intl dùng - graceful fallback về chính mã đó.
let currencyDisplayNames: Intl.DisplayNames | null | undefined;

export const getCurrencyDisplayName = (code: string): string => {
  if (currencyDisplayNames === undefined) {
    try {
      currencyDisplayNames = new Intl.DisplayNames(['en'], {
        type: 'currency',
      });
    } catch {
      currencyDisplayNames = null;
    }
  }
  const name = currencyDisplayNames?.of(code);
  return name && name !== code ? name : code;
};

// Tên đầy đủ từ Intl.DisplayNames luôn theo dạng "{Quốc tịch/vùng} {Tên đơn
// vị}" (vd "Vietnamese Dong", "US Dollar", "Turkish Lira") - tách ở khoảng
// trắng CUỐI CÙNG để chèn dấu gạch ngang ở giữa, ra đúng định dạng yêu cầu
// "Vietnamese - Dong (VND)". Tên chỉ có 1 từ (vd "Euro") thì không có gì để
// tách, giữ nguyên không thêm gạch ngang.
export const formatCurrencyOptionLabel = (code: string): string => {
  const name = getCurrencyDisplayName(code);
  if (name === code) return code;

  const lastSpaceIndex = name.lastIndexOf(' ');
  if (lastSpaceIndex === -1) return `${name} (${code})`;

  const nationality = name.slice(0, lastSpaceIndex);
  const unit = name.slice(lastSpaceIndex + 1);
  return `${nationality} - ${unit} (${code})`;
};

// --- Định dạng input Value theo kiểu tiền tệ: "1000" -> "1,000",
// "1000.1" -> "1,000.1" (dấu phẩy phân cách hàng nghìn, dấu chấm thập phân).
// Redux vẫn chỉ lưu giá trị THÔ không dấu phẩy (khớp isPlainDecimal ở
// unitConverterSlice.ts) - việc định dạng chỉ diễn ra ở tầng hiển thị
// (UnitConverter.tsx), tách biệt dữ liệu và trình bày.

// Đếm số ký tự "có ý nghĩa" (chữ số + dấu chấm thập phân, bỏ qua dấu phẩy) -
// dùng để khôi phục đúng vị trí con trỏ sau khi định dạng lại input.
export const countMeaningfulChars = (value: string): number =>
  (value.match(/[\d.]/g) ?? []).length;

// Bỏ hết dấu phẩy + ký tự không phải số, chỉ giữ tối đa 1 dấu chấm thập phân
// (dấu chấm gõ thêm sau đó bị loại) - trả về giá trị "thô" để lưu vào Redux.
export const sanitizeCurrencyInput = (value: string): string => {
  const digitsAndDots = value.replace(/,/g, '').replace(/[^\d.]/g, '');
  const firstDot = digitsAndDots.indexOf('.');
  if (firstDot === -1) return digitsAndDots;
  return (
    digitsAndDots.slice(0, firstDot + 1) +
    digitsAndDots.slice(firstDot + 1).replace(/\./g, '')
  );
};

// Chèn dấu phẩy phân cách hàng nghìn vào phần nguyên, giữ nguyên phần thập
// phân (kể cả khi đang gõ dở dang, vd "1000." vẫn ra "1,000.").
export const formatCurrencyDisplay = (value: string): string => {
  if (!value) return '';
  const dotIndex = value.indexOf('.');
  const integerPart = dotIndex === -1 ? value : value.slice(0, dotIndex);
  const decimalPart = dotIndex === -1 ? '' : value.slice(dotIndex);
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return formattedInteger + decimalPart;
};

// Tìm vị trí con trỏ trong chuỗi ĐÃ định dạng (có dấu phẩy) đứng ngay sau
// đúng `targetCount` ký tự có ý nghĩa đầu tiên - dùng kèm countMeaningfulChars
// để giữ nguyên "cảm giác" vị trí gõ của người dùng dù chuỗi bị chèn/bớt dấu
// phẩy sau mỗi lần gõ.
export const findCursorPositionAfterMeaningful = (
  formatted: string,
  targetCount: number
): number => {
  if (targetCount <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/[\d.]/.test(formatted[i])) {
      seen++;
      if (seen === targetCount) return i + 1;
    }
  }
  return formatted.length;
};
