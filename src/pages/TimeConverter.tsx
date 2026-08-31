import { useEffect } from 'react';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useDelayedAction } from '@/hook/useDelayedAction';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearTimeConverter,
  convert,
  setCopiedField,
  setError,
  setTimestamp,
  setTimezone,
  setUnit,
} from '@/store/slices/timeConverterSlice';
import type { TimestampUnit } from '@/util/interface/Type';
import { getSupportedTimezones } from '@/util/time';

const inputClass =
  'w-full p-2.5 text-sm border rounded-lg bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:placeholder:text-gray-500';

const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

// Danh sách timezone chỉ cần tính 1 lần (không đổi trong lúc app chạy) - để
// ở module scope thay vì Redux/state, giống cách `algorithms` của trang JWT
// là 1 hằng số cố định chứ không phải dữ liệu cần theo dõi thay đổi.
const TIMEZONES = getSupportedTimezones();

const TimeConverter = () => {
  const dispatch = useAppDispatch();
  const { timestamp, unit, timezone, formatted, isoUtc, error, copiedField } =
    useAppSelector((state) => state.timeConverter);
  const { loading, run, cancel } = useDelayedAction();

  // State sống trong Redux nên tồn tại xuyên suốt cả app, không tự mất khi
  // chuyển route như useState thường làm -> phải chủ động xoá mỗi khi vào
  // lại trang này để không còn thấy kết quả của lần trước.
  useEffect(() => {
    dispatch(clearTimeConverter());
  }, [dispatch]);

  const handleConvert = () => {
    run(() => dispatch(convert()));
  };

  const handleClear = () => {
    cancel();
    dispatch(clearTimeConverter());
  };

  // Điền nhanh timestamp hiện tại theo đúng đơn vị đang chọn - chỉ điền vào
  // ô nhập, người dùng vẫn phải bấm Convert để xem kết quả (giữ đúng luồng
  // Generate/Convert thủ công như các trang khác).
  const handleUseNow = () => {
    const now = unit === 'seconds' ? Math.floor(Date.now() / 1000) : Date.now();
    dispatch(setTimestamp(String(now)));
  };

  const handleUnitChange = (nextUnit: TimestampUnit) => {
    dispatch(setUnit(nextUnit));
  };

  const handleCopy = async (text: string, field: 'formatted' | 'iso') => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      dispatch(setCopiedField(field));
      setTimeout(() => dispatch(setCopiedField(null)), 2000);
    } catch {
      dispatch(setError('Could not copy to clipboard. Please copy manually.'));
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
        Time / Timezone Converter
      </h1>

      <div className="space-y-4 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
        {/* Unix timestamp cần đổi */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-1 min-w-50 flex-col space-y-2">
            <label className={labelClass}>Unix Timestamp:</label>
            <input
              type="number"
              value={timestamp}
              onChange={(e) => dispatch(setTimestamp(e.target.value))}
              placeholder="e.g. 1700000000"
              className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
            />
          </div>
          <div className="flex rounded-lg border border-gray-200 p-1 dark:border-gray-700">
            <button
              type="button"
              onClick={() => handleUnitChange('seconds')}
              className={`min-w-24 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                unit === 'seconds'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Seconds
            </button>
            <button
              type="button"
              onClick={() => handleUnitChange('milliseconds')}
              className={`min-w-24 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                unit === 'milliseconds'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Milliseconds
            </button>
          </div>
          <button
            type="button"
            onClick={handleUseNow}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-white rounded-lg hover:bg-gray-300 font-medium transition"
          >
            Now
          </button>
        </div>

        {/* Timezone đích */}
        <div className="flex flex-col space-y-2 max-w-sm">
          <label className={labelClass}>Timezone:</label>
          <select
            value={timezone}
            onChange={(e) => dispatch(setTimezone(e.target.value))}
            className={inputClass}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        {/* Thanh công cụ */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleConvert}
            disabled={loading}
            className="flex-1 sm:flex-none min-w-30 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Processing...' : 'Convert'}
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
        {loading ? (
          <div className="w-full p-3 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
            <LoadingIndicator />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <div className="flex flex-wrap gap-2 justify-between items-center">
                <label className={labelClass}>
                  Date &amp; Time ({timezone}):
                </label>
                {formatted && (
                  <button
                    type="button"
                    onClick={() => handleCopy(formatted, 'formatted')}
                    className="text-xs px-2.5 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 transition"
                  >
                    {copiedField === 'formatted' ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
              <div className="w-full p-3 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
                {formatted ? (
                  <p className="font-mono text-sm text-gray-800 dark:text-gray-100">
                    {formatted}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    The converted date &amp; time will appear here...
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <div className="flex flex-wrap gap-2 justify-between items-center">
                <label className={labelClass}>UTC (ISO 8601):</label>
                {isoUtc && (
                  <button
                    type="button"
                    onClick={() => handleCopy(isoUtc, 'iso')}
                    className="text-xs px-2.5 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 transition"
                  >
                    {copiedField === 'iso' ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
              <div className="w-full p-3 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
                {isoUtc ? (
                  <p className="font-mono text-sm text-gray-800 dark:text-gray-100">
                    {isoUtc}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    The UTC timestamp will appear here...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeConverter;
