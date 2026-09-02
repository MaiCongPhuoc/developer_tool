import { useEffect } from 'react';
import TextCompareView from '@/components/TextCompareView';
import { useDelayedAction } from '@/hook/useDelayedAction';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearTextCompare,
  compareText,
  setLeftText,
  setRightText,
} from '@/store/slices/textCompareSlice';

const textareaClass =
  'w-full result-box-h p-3 font-mono text-sm border rounded-lg bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:placeholder:text-gray-500 resize-none';

const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

const TextCompare = () => {
  const dispatch = useAppDispatch();
  const { leftText, rightText, stats, error } = useAppSelector(
    (state) => state.textCompare
  );
  const { loading, run, cancel } = useDelayedAction();

  // State sống trong Redux nên tồn tại xuyên suốt cả app, không tự mất khi
  // chuyển route như useState thường làm -> phải chủ động xoá mỗi khi vào
  // lại trang này để không còn thấy kết quả của lần trước.
  useEffect(() => {
    dispatch(clearTextCompare());
  }, [dispatch]);

  // So sánh 2 đoạn text - trễ RESULT_DELAY_MS để hiện khung chờ trước khi
  // trả kết quả, xem lý do ở useDelayedAction.
  const handleCompare = () => {
    run(() => dispatch(compareText()));
  };

  // Xóa nội dung
  const handleClear = () => {
    cancel();
    dispatch(clearTextCompare());
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
        Text Compare
      </h1>

      <div className="space-y-4 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
        {/* Thanh công cụ */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCompare}
            disabled={loading}
            className="flex-1 sm:flex-none min-w-30 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Processing...' : 'Compare'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 sm:flex-none min-w-30 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition"
          >
            Clear
          </button>
        </div>

        {/* Khu vực nhập 2 đoạn text cần so sánh */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-2">
            <label className={labelClass}>Original text:</label>
            <textarea
              value={leftText}
              onChange={(e) => dispatch(setLeftText(e.target.value))}
              placeholder="Paste the original text here..."
              className={textareaClass}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className={labelClass}>Changed text:</label>
            <textarea
              value={rightText}
              onChange={(e) => dispatch(setRightText(e.target.value))}
              placeholder="Paste the changed text here..."
              className={textareaClass}
            />
          </div>
        </div>

        {/* Thông báo lỗi nếu có */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Kết quả so sánh */}
        <div className="flex flex-col space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className={labelClass}>Comparison result:</label>
            {!loading && stats && (
              <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-300">
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm bg-yellow-300 dark:bg-yellow-700" />
                  {stats.modified} modified
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm bg-green-300 dark:bg-green-700" />
                  {stats.inserted} added
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm bg-red-300 dark:bg-red-700" />
                  {stats.deleted} deleted
                </span>
              </div>
            )}
          </div>
          <div
            className={`w-full overflow-auto border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 ${
              loading || stats ? 'result-box-h' : ''
            }`}
          >
            <TextCompareView loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextCompare;
