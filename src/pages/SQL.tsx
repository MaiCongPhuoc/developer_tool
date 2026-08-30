import { useEffect } from 'react';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useDelayedAction } from '@/hook/useDelayedAction';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearSql,
  formatSql,
  setCopied,
  setError,
  setInputSql,
} from '@/store/slices/sqlFormatterSlice';
import { highlightSqlSegments } from '@/util/sql';

const SQL = () => {
  const dispatch = useAppDispatch();
  const { inputSql, formattedSql, error, copied } = useAppSelector(
    (state) => state.sqlFormatter
  );
  const { loading, run, cancel } = useDelayedAction();

  // State sống trong Redux nên tồn tại xuyên suốt cả app, không tự mất khi
  // chuyển route như useState thường làm -> phải chủ động xoá mỗi khi vào
  // lại trang này để không còn thấy kết quả của lần trước.
  useEffect(() => {
    dispatch(clearSql());
  }, [dispatch]);

  // Format SQL (Prettify) - trễ RESULT_DELAY_MS để hiện khung chờ trước khi
  // trả kết quả, xem lý do ở useDelayedAction.
  const handleFormat = () => {
    run(() => dispatch(formatSql()));
  };

  // Sao chép kết quả
  const handleCopy = async () => {
    if (!formattedSql) return;
    try {
      await navigator.clipboard.writeText(formattedSql);
      dispatch(setCopied(true));
      setTimeout(() => dispatch(setCopied(false)), 2000);
    } catch {
      // Clipboard API có thể bị từ chối (trang không phải HTTPS, trình
      // duyệt chặn quyền, tab mất focus...) - báo lỗi rõ ràng lên banner đỏ
      // thay vì âm thầm không làm gì, khiến người dùng tưởng đã copy thành công.
      dispatch(setError('Could not copy to clipboard. Please copy the text manually.'));
    }
  };

  // Xóa nội dung
  const handleClear = () => {
    cancel();
    dispatch(clearSql());
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
        SQL Formatter
      </h1>

      <div className="space-y-4 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
        {/* Thanh công cụ */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleFormat}
            disabled={loading}
            className="flex-1 sm:flex-none min-w-30 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Processing...' : 'Format SQL'}
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

        {/* Khu vực nhập và hiển thị kết quả */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Input */}
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Input SQL:
            </label>
            <textarea
              value={inputSql}
              onChange={(e) => dispatch(setInputSql(e.target.value))}
              placeholder="Paste your SQL statement here... e.g. select * from users where id = 1"
              className="w-full h-64 sm:h-80 xl:h-96 p-3 font-mono text-sm border rounded-lg bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:placeholder:text-gray-500 resize-none"
            />
          </div>

          {/* Output */}
          <div className="flex flex-col space-y-2 relative">
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Formatted Output:
              </label>
              {!loading && formattedSql && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs px-2.5 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 transition"
                >
                  {copied ? 'Copied!' : 'Copy Output'}
                </button>
              )}
            </div>
            <div className="w-full h-64 sm:h-80 xl:h-96 overflow-auto p-3 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
              {loading ? (
                <LoadingIndicator />
              ) : formattedSql ? (
                <pre className="font-mono text-sm whitespace-pre text-gray-800 dark:text-gray-100">
                  {highlightSqlSegments(formattedSql).map((segment, index) => (
                    <span key={index} className={segment.className}>
                      {segment.text}
                    </span>
                  ))}
                </pre>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  The formatted result will appear here...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SQL;
