import { useEffect } from 'react';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useDelayedAction } from '@/hook/useDelayedAction';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearPassword,
  generate,
  setCopied,
  setError,
  setIncludeLowercase,
  setIncludeNumbers,
  setIncludeSymbols,
  setIncludeUppercase,
  setLength,
} from '@/store/slices/passwordSlice';
import type { PasswordStrength } from '@/util/interface/Type';

const inputClass =
  'w-full p-2.5 text-sm border rounded-lg bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:placeholder:text-gray-500';

const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

const checkboxLabelClass =
  'flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 select-none cursor-pointer';

// Mốc màu/độ rộng của thanh đo tương ứng 5 mức calculatePasswordStrength trả
// về (xem util/password.ts) - càng mạnh thanh càng dài và càng ngả xanh.
const strengthConfig: Record<
  PasswordStrength,
  { label: string; barClass: string; widthClass: string; textClass: string }
> = {
  'very-weak': {
    label: 'Very Weak',
    barClass: 'bg-red-500',
    widthClass: 'w-1/5',
    textClass: 'text-red-600 dark:text-red-400',
  },
  weak: {
    label: 'Weak',
    barClass: 'bg-orange-500',
    widthClass: 'w-2/5',
    textClass: 'text-orange-600 dark:text-orange-400',
  },
  fair: {
    label: 'Fair',
    barClass: 'bg-yellow-500',
    widthClass: 'w-3/5',
    textClass: 'text-yellow-600 dark:text-yellow-400',
  },
  strong: {
    label: 'Strong',
    barClass: 'bg-lime-500',
    widthClass: 'w-4/5',
    textClass: 'text-lime-600 dark:text-lime-400',
  },
  'very-strong': {
    label: 'Very Strong',
    barClass: 'bg-green-500',
    widthClass: 'w-full',
    textClass: 'text-green-600 dark:text-green-400',
  },
};

const PasswordGenerator = () => {
  const dispatch = useAppDispatch();
  const {
    length,
    includeUppercase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
    password,
    strength,
    error,
    copied,
  } = useAppSelector((state) => state.password);
  const { loading, run, cancel } = useDelayedAction();

  // State sống trong Redux nên tồn tại xuyên suốt cả app, không tự mất khi
  // chuyển route như useState thường làm -> phải chủ động xoá mỗi khi vào
  // lại trang này để không còn thấy kết quả của lần trước.
  useEffect(() => {
    dispatch(clearPassword());
  }, [dispatch]);

  const handleGenerate = () => {
    run(() => dispatch(generate()));
  };

  const handleClear = () => {
    cancel();
    dispatch(clearPassword());
  };

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      dispatch(setCopied(true));
      setTimeout(() => dispatch(setCopied(false)), 2000);
    } catch {
      dispatch(setError('Could not copy to clipboard. Please copy manually.'));
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
        Password Generator
      </h1>

      <div className="space-y-4 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
        {/* Độ dài mật khẩu */}
        <div className="flex flex-col space-y-2 max-w-xs">
          <label className={labelClass}>Length:</label>
          <input
            type="number"
            min={4}
            max={128}
            value={length}
            onChange={(e) => dispatch(setLength(e.target.value))}
            placeholder="e.g. 16"
            className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          />
        </div>

        {/* Tuỳ chọn loại ký tự */}
        <div className="flex flex-wrap gap-4">
          <label className={checkboxLabelClass}>
            <input
              type="checkbox"
              checked={includeUppercase}
              onChange={(e) => dispatch(setIncludeUppercase(e.target.checked))}
            />
            Uppercase (A-Z)
          </label>
          <label className={checkboxLabelClass}>
            <input
              type="checkbox"
              checked={includeLowercase}
              onChange={(e) => dispatch(setIncludeLowercase(e.target.checked))}
            />
            Lowercase (a-z)
          </label>
          <label className={checkboxLabelClass}>
            <input
              type="checkbox"
              checked={includeNumbers}
              onChange={(e) => dispatch(setIncludeNumbers(e.target.checked))}
            />
            Numbers (0-9)
          </label>
          <label className={checkboxLabelClass}>
            <input
              type="checkbox"
              checked={includeSymbols}
              onChange={(e) => dispatch(setIncludeSymbols(e.target.checked))}
            />
            Symbols (!@#$...)
          </label>
        </div>

        {/* Thanh công cụ */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="flex-1 sm:flex-none min-w-30 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Processing...' : 'Generate'}
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
            <label className={labelClass}>Generated Password:</label>
            {!loading && password && (
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
            {loading ? (
              <LoadingIndicator />
            ) : password ? (
              <p className="break-all font-mono text-sm text-gray-800 dark:text-gray-100">
                {password}
              </p>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                The generated password will appear here...
              </p>
            )}
          </div>

          {/* Thanh đo độ mạnh - chỉ hiện khi đã có mật khẩu */}
          {!loading && password && strength && (
            <div className="flex flex-col space-y-1">
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strengthConfig[strength].barClass} ${strengthConfig[strength].widthClass}`}
                />
              </div>
              <span
                className={`text-xs font-medium ${strengthConfig[strength].textClass}`}
              >
                {strengthConfig[strength].label}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordGenerator;
