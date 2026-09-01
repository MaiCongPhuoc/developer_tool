import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearUnitConverter,
  convert,
  convertCurrency,
  loadCurrencyRates,
  setBasePx,
  setCategory,
  setCopied,
  setError,
  setFromUnit,
  setInputValue,
  setToUnit,
  swapUnits,
} from '@/store/slices/unitConverterSlice';
import type { UnitConverterCategory } from '@/util/interface/Type';
import { getColorPreviewHex } from '@/util/color';
import {
  COMMON_CURRENCY_FALLBACK,
  countMeaningfulChars,
  findCursorPositionAfterMeaningful,
  formatCurrencyDisplay,
  formatCurrencyOptionLabel,
  sanitizeCurrencyInput,
} from '@/util/currency';
import {
  COLOR_FORMAT_UNITS,
  FONT_SIZE_UNITS,
  NUMBER_BASE_UNITS,
  TEMPERATURE_UNITS,
  UNIT_TABLES,
} from '@/util/units';

const inputClass =
  'w-full p-2.5 text-sm border rounded-lg bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:placeholder:text-gray-500';

const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

const CATEGORY_OPTIONS: { id: UnitConverterCategory; label: string }[] = [
  { id: 'length', label: 'Length' },
  { id: 'weight', label: 'Weight' },
  { id: 'storage', label: 'Storage' },
  { id: 'temperature', label: 'Temperature' },
  { id: 'fontSize', label: 'Font Size' },
  { id: 'currency', label: 'Currency' },
  { id: 'color', label: 'Color' },
  { id: 'numberBase', label: 'Number Base' },
];

// Placeholder cho ô Value đổi theo category - riêng Color còn đổi theo cả
// fromUnit (cú pháp HEX/RGB/HSL khác hẳn nhau).
const COLOR_PLACEHOLDERS: Record<string, string> = {
  hex: '#FF5733',
  rgb: '255, 87, 51',
  hsl: '9, 100%, 60%',
};

const NUMBER_BASE_PLACEHOLDERS: Record<string, string> = {
  decimal: '255',
  binary: '11111111',
  octal: '377',
  hexadecimal: 'FF',
};

// px/rem/em/% (fontSize) và celsius/fahrenheit/kelvin (toUnit) đã là ký hiệu
// hiển thị được luôn; riêng temperature cần map sang ký hiệu (°C/°F/K) vì id
// lưu trong state là tên đầy đủ (celsius/fahrenheit/kelvin).
const TEMPERATURE_SYMBOLS: Record<string, string> = {
  celsius: '°C',
  fahrenheit: '°F',
  kelvin: 'K',
};

// Length/Weight/Storage/FontSize/Temperature/Color/NumberBase tính toán tức
// thì trong trình duyệt nên KHÔNG cần hiện loading giả nữa - chỉ riêng
// Currency vẫn cần vì có gọi API thật. Khi tỷ giá đã được cache (các lần
// convert sau lần đầu), request gần như tức thì (~100ms) khiến khung loading
// lướt qua quá nhanh để nhận ra - đặt sàn tối thiểu 1s để người dùng vẫn
// thấy rõ ứng dụng "đang làm gì đó", đồng thời KHÔNG rút ngắn nếu API thật
// sự chậm hơn 1s (lần fetch đầu tiên).
const MIN_CURRENCY_LOADING_MS = 1000;

const UnitConverter = () => {
  const dispatch = useAppDispatch();
  const {
    category,
    inputValue,
    fromUnit,
    toUnit,
    basePx,
    result,
    error,
    copied,
    currencyRates,
    currencyRatesUpdatedAt,
  } = useAppSelector((state) => state.unitConverter);
  // Nhóm Currency KHÔNG dùng delay giả như các nhóm khác - vì bản thân việc
  // gọi API tỷ giá đã có độ trễ THẬT (mạng). isFetchingCurrency true trong
  // suốt lúc promise của convertCurrency/loadCurrencyRates đang chạy, cộng
  // thêm sàn tối thiểu MIN_CURRENCY_LOADING_MS (xem handleConvert).
  const [isFetchingCurrency, setIsFetchingCurrency] = useState(false);

  // Dùng để khôi phục đúng vị trí con trỏ sau khi input Value (nhóm Currency)
  // bị định dạng lại dấu phẩy hàng nghìn - React mặc định đẩy con trỏ về
  // cuối input mỗi khi value đổi, nên phải tự đặt lại sau khi re-render.
  const valueInputRef = useRef<HTMLInputElement>(null);
  const pendingCursorRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (
      category === 'currency' &&
      pendingCursorRef.current !== null &&
      valueInputRef.current
    ) {
      valueInputRef.current.setSelectionRange(
        pendingCursorRef.current,
        pendingCursorRef.current
      );
      pendingCursorRef.current = null;
    }
  }, [category, inputValue]);

  // State sống trong Redux nên tồn tại xuyên suốt cả app, không tự mất khi
  // chuyển route như useState thường làm -> phải chủ động xoá mỗi khi vào
  // lại trang này để không còn thấy kết quả của lần trước (riêng cache tỷ
  // giá currencyRates được clearUnitConverter cố ý giữ lại - xem slice).
  useEffect(() => {
    dispatch(clearUnitConverter());
  }, [dispatch]);

  // Trước khi fetch xong lần đầu, dùng tạm 1 danh sách mã tiền tệ phổ biến
  // để dropdown không trống rỗng - sau khi có currencyRates thật, chuyển
  // sang dùng đúng danh sách ~166 mã mà API hỗ trợ.
  const currencyOptions = (
    currencyRates ? Object.keys(currencyRates).sort() : COMMON_CURRENCY_FALLBACK
  ).map((code) => ({ id: code, label: formatCurrencyOptionLabel(code) }));

  const unitOptions =
    category === 'fontSize'
      ? FONT_SIZE_UNITS
      : category === 'currency'
        ? currencyOptions
        : category === 'temperature'
          ? TEMPERATURE_UNITS
          : category === 'numberBase'
            ? NUMBER_BASE_UNITS
            : category === 'color'
              ? COLOR_FORMAT_UNITS
              : UNIT_TABLES[category];

  const valuePlaceholder =
    category === 'currency'
      ? 'e.g. 1,000.5'
      : category === 'color'
        ? (COLOR_PLACEHOLDERS[fromUnit] ?? '#FF5733')
        : category === 'numberBase'
          ? (NUMBER_BASE_PLACEHOLDERS[fromUnit] ?? '255')
          : category === 'temperature'
            ? 'e.g. 25'
            : 'e.g. 1.5';

  // Chỉ length/weight/storage/fontSize/currency/temperature có 1 số + 1 đơn
  // vị đi kèm hợp lý sau kết quả - numberBase/color đã tự đủ nghĩa trong
  // chính chuỗi kết quả (vd "#FF5733", "rgb(255, 87, 51)"), thêm hậu tố vào
  // sẽ thừa/rối.
  const resultSuffix =
    category === 'temperature'
      ? (TEMPERATURE_SYMBOLS[toUnit] ?? '')
      : category === 'numberBase' || category === 'color'
        ? ''
        : toUnit;

  const colorPreviewHex =
    category === 'color' && result
      ? getColorPreviewHex(result, toUnit as 'hex' | 'rgb' | 'hsl')
      : null;

  const isBusy = category === 'currency' && isFetchingCurrency;

  const handleCategoryChange = (nextCategory: UnitConverterCategory) => {
    dispatch(setCategory(nextCategory));

    // Tải trước tỷ giá ngay khi vừa chuyển sang tab Currency (nếu chưa có
    // cache) - để dropdown From/To có ngay đủ ~166 mã, không bắt người dùng
    // phải bấm Convert 1 lần "vô nghĩa" chỉ để load xong danh sách.
    if (nextCategory === 'currency' && !currencyRates) {
      setIsFetchingCurrency(true);
      dispatch(loadCurrencyRates()).finally(() => setIsFetchingCurrency(false));
    }
  };

  const handleConvert = async () => {
    if (category === 'currency') {
      setIsFetchingCurrency(true);
      const startedAt = Date.now();
      await dispatch(convertCurrency());
      // Đảm bảo khung loading hiện tối thiểu MIN_CURRENCY_LOADING_MS - nếu
      // request thật đã lâu hơn mức đó rồi (vd lần fetch đầu tiên) thì
      // remainingMs <= 0, không chờ thêm chút nào.
      const remainingMs = MIN_CURRENCY_LOADING_MS - (Date.now() - startedAt);
      if (remainingMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingMs));
      }
      setIsFetchingCurrency(false);
      return;
    }
    // Các nhóm còn lại tính toán tức thì trong trình duyệt - dispatch thẳng,
    // không qua bất kỳ delay giả nào.
    dispatch(convert());
  };

  const handleClear = () => {
    dispatch(clearUnitConverter());
  };

  const handleSwap = () => {
    dispatch(swapUnits());
  };

  // Nhóm Currency: định dạng dấu phẩy hàng nghìn khi gõ (vd "1000" ->
  // "1,000"). Redux vẫn chỉ lưu giá trị thô không dấu phẩy (xem
  // util/currency.ts) - phải tự tính lại vị trí con trỏ vì input bị đổi độ
  // dài sau mỗi lần gõ (dấu phẩy được chèn/bớt).
  const handleCurrencyValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typed = e.target.value;
    const cursorPos = e.target.selectionStart ?? typed.length;
    const meaningfulBeforeCursor = countMeaningfulChars(typed.slice(0, cursorPos));

    const cleaned = sanitizeCurrencyInput(typed);
    const formatted = formatCurrencyDisplay(cleaned);
    pendingCursorRef.current = findCursorPositionAfterMeaningful(
      formatted,
      meaningfulBeforeCursor
    );

    dispatch(setInputValue(cleaned));
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      dispatch(setCopied(true));
      setTimeout(() => dispatch(setCopied(false)), 2000);
    } catch {
      dispatch(setError('Could not copy to clipboard. Please copy manually.'));
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
        Unit &amp; Currency Converter
      </h1>

      <div className="space-y-4 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
        {/* Chọn nhóm đơn vị */}
        <div className="flex flex-wrap rounded-lg border border-gray-200 p-1 dark:border-gray-700 w-fit">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleCategoryChange(opt.id)}
              className={`min-w-24 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                category === opt.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Giá trị + đơn vị nguồn/đích */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-1 min-w-32 flex-col space-y-2">
            <label className={labelClass}>Value:</label>
            <input
              ref={valueInputRef}
              type="text"
              inputMode="decimal"
              value={
                category === 'currency'
                  ? formatCurrencyDisplay(inputValue)
                  : inputValue
              }
              onChange={
                category === 'currency'
                  ? handleCurrencyValueChange
                  : (e) => dispatch(setInputValue(e.target.value))
              }
              placeholder={valuePlaceholder}
              className={inputClass}
            />
          </div>
          <div className="flex flex-1 min-w-40 flex-col space-y-2">
            <label className={labelClass}>From:</label>
            <select
              value={fromUnit}
              onChange={(e) => dispatch(setFromUnit(e.target.value))}
              className={inputClass}
            >
              {unitOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleSwap}
            title="Swap units"
            aria-label="Swap units"
            className="mb-0.5 px-3 py-2.5 bg-gray-200 dark:bg-gray-700 dark:text-white rounded-lg hover:bg-gray-300 transition"
          >
            ⇄
          </button>
          <div className="flex flex-1 min-w-40 flex-col space-y-2">
            <label className={labelClass}>To:</label>
            <select
              value={toUnit}
              onChange={(e) => dispatch(setToUnit(e.target.value))}
              className={inputClass}
            >
              {unitOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Base font size - chỉ có ý nghĩa với nhóm Font Size vì px/rem/em/%
            là đơn vị tương đối, cần 1 mốc quy đổi (xem util/units.ts) */}
        {category === 'fontSize' && (
          <div className="flex flex-col space-y-2 max-w-xs">
            <label className={labelClass}>Base font size (px):</label>
            <input
              type="text"
              inputMode="decimal"
              value={basePx}
              onChange={(e) => dispatch(setBasePx(e.target.value))}
              placeholder="16"
              className={inputClass}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Assumes this as the root font-size. "em" is calculated the same
              way as "rem" here since the actual parent element's font-size
              isn't known.
            </p>
          </div>
        )}

        {/* Nhóm Currency: ghi rõ nguồn tỷ giá + thời điểm cập nhật (lấy từ
            chính API, không phải giờ máy người dùng) để người dùng biết đây
            không phải tỷ giá real-time. */}
        {category === 'currency' && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Rates from{' '}
            <a
              href="https://www.exchangerate-api.com"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-gray-600 dark:hover:text-gray-300"
            >
              exchangerate-api.com
            </a>{' '}
            (updates once daily).
            {currencyRatesUpdatedAt && ` Last updated: ${currencyRatesUpdatedAt}`}
          </p>
        )}

        {/* Thanh công cụ */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleConvert}
            disabled={isBusy}
            className="flex-1 sm:flex-none min-w-30 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBusy
              ? category === 'currency' && !currencyRates
                ? 'Fetching rates...'
                : 'Processing...'
              : 'Convert'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 sm:flex-none min-w-30 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition"
          >
            Clear
          </button>
        </div>

        {/* Thông báo lỗi nếu có */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Kết quả */}
        <div className="flex flex-col space-y-2">
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <label className={labelClass}>Result:</label>
            {!isBusy && result && (
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs px-2.5 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 transition"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
          <div className="w-full p-3 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
            {isBusy ? (
              <LoadingIndicator />
            ) : result ? (
              <div className="flex items-center gap-2">
                {colorPreviewHex && (
                  <span
                    className="h-6 w-6 shrink-0 rounded border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: colorPreviewHex }}
                    title={colorPreviewHex}
                  />
                )}
                <p className="font-mono text-sm text-gray-800 dark:text-gray-100">
                  {category === 'currency' ? formatCurrencyDisplay(result) : result}
                  {resultSuffix && ` ${resultSuffix}`}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                The converted result will appear here...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitConverter;
