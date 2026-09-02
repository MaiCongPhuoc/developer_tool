import { useEffect } from 'react';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useDelayedAction } from '@/hook/useDelayedAction';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearUuid,
  generateUuids,
  setBraces,
  setCopiedAll,
  setCopiedIndex,
  setCount,
  setError,
  setHyphens,
  setUppercase,
} from '@/store/slices/uuidSlice';

const inputClass =
  'w-full p-2.5 text-sm border rounded-lg bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:placeholder:text-gray-500';

const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

const checkboxLabelClass =
  'flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 select-none cursor-pointer';

const Uuid = () => {
  const dispatch = useAppDispatch();
  const {
    count,
    uppercase,
    hyphens,
    braces,
    uuids,
    error,
    copiedIndex,
    copiedAll,
  } = useAppSelector((state) => state.uuid);
  const { loading, run, cancel } = useDelayedAction();

  // State sống trong Redux nên tồn tại xuyên suốt cả app, không tự mất khi
  // chuyển route như useState thường làm -> phải chủ động xoá mỗi khi vào
  // lại trang này để không còn thấy kết quả của lần trước.
  useEffect(() => {
    dispatch(clearUuid());
  }, [dispatch]);

  const handleGenerate = () => {
    run(() => dispatch(generateUuids()));
  };

  const handleClear = () => {
    cancel();
    dispatch(clearUuid());
  };

  const handleCopyOne = async (uuid: string, index: number) => {
    try {
      await navigator.clipboard.writeText(uuid);
      dispatch(setCopiedIndex(index));
      setTimeout(() => dispatch(setCopiedIndex(null)), 2000);
    } catch {
      dispatch(setError('Could not copy to clipboard. Please copy manually.'));
    }
  };

  const handleCopyAll = async () => {
    if (uuids.length === 0) return;
    try {
      await navigator.clipboard.writeText(uuids.join('\n'));
      dispatch(setCopiedAll(true));
      setTimeout(() => dispatch(setCopiedAll(false)), 2000);
    } catch {
      dispatch(setError('Could not copy to clipboard. Please copy manually.'));
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
        UUID / GUID Generator
      </h1>

      <div className="space-y-4 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
        {/* Số lượng UUID cần sinh */}
        <div className="flex flex-col space-y-2 max-w-xs">
          <label className={labelClass}>Quantity:</label>
          <input
            type="number"
            min={1}
            value={count}
            onChange={(e) => dispatch(setCount(e.target.value))}
            placeholder="e.g. 5"
            className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          />
        </div>

        {/* Tuỳ chọn định dạng */}
        <div className="flex flex-wrap gap-4">
          <label className={checkboxLabelClass}>
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => dispatch(setUppercase(e.target.checked))}
            />
            Uppercase
          </label>
          <label className={checkboxLabelClass}>
            <input
              type="checkbox"
              checked={hyphens}
              onChange={(e) => dispatch(setHyphens(e.target.checked))}
            />
            Hyphens (-)
          </label>
          <label className={checkboxLabelClass}>
            <input
              type="checkbox"
              checked={braces}
              onChange={(e) => dispatch(setBraces(e.target.checked))}
            />
            Braces ({'{}'})
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
        <div className="flex flex-col space-y-2 relative">
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <label className={labelClass}>
              Generated UUIDs
              {!loading && uuids.length > 0 && ` (${uuids.length})`}:
            </label>
            {!loading && uuids.length > 0 && (
              <button
                type="button"
                onClick={handleCopyAll}
                className="text-xs px-2.5 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 transition"
              >
                {copiedAll ? 'Copied!' : 'Copy All'}
              </button>
            )}
          </div>
          <div className="w-full result-box-h overflow-auto p-3 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
            {loading ? (
              <LoadingIndicator />
            ) : uuids.length > 0 ? (
              <ul className="space-y-1">
                {uuids.map((uuid, index) => (
                  <li
                    key={`${uuid}-${index}`}
                    className="flex items-center justify-between gap-2 font-mono text-sm text-gray-800 dark:text-gray-100"
                  >
                    <span className="break-all">{uuid}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyOne(uuid, index)}
                      className="shrink-0 text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 transition"
                    >
                      {copiedIndex === index ? 'Copied!' : 'Copy'}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                The generated UUIDs will appear here...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Uuid;
