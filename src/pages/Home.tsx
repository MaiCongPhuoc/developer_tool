import { useEffect } from 'react';
import JsonTreeView from '@/components/JsonTreeView';
import LoadingIndicator from '@/components/LoadingIndicator';
import ToolGuide from '@/components/ToolGuide';
import { useDelayedAction } from '@/hook/useDelayedAction';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearJson,
  formatJson,
  setCopied,
  setError,
  setInputJson,
} from '@/store/slices/jsonFormatterSlice';

const Home = () => {
  const dispatch = useAppDispatch();
  const { inputJson, formattedJson, error, copied } = useAppSelector(
    (state) => state.jsonFormatter
  );
  const { loading, run, cancel } = useDelayedAction();

  // State sống trong Redux nên tồn tại xuyên suốt cả app, không tự mất khi
  // chuyển route như useState thường làm -> phải chủ động xoá mỗi khi vào
  // lại trang này để không còn thấy kết quả của lần trước.
  useEffect(() => {
    dispatch(clearJson());
  }, [dispatch]);

  // Format JSON (Prettify) - trễ RESULT_DELAY_MS để hiện khung chờ trước khi
  // trả kết quả, xem lý do ở useDelayedAction.
  const handleFormat = () => {
    run(() => dispatch(formatJson()));
  };

  // Sao chép kết quả
  const handleCopy = async () => {
    if (!formattedJson) return;
    try {
      await navigator.clipboard.writeText(formattedJson);
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
    dispatch(clearJson());
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
        JSON Formatter
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
            {loading ? 'Processing...' : 'Format JSON'}
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
              Input JSON:
            </label>
            <textarea
              value={inputJson}
              onChange={(e) => dispatch(setInputJson(e.target.value))}
              placeholder='Paste your JSON string here... e.g. {"name": "John", "age": 30}'
              className="w-full result-box-h p-3 font-mono text-sm border rounded-lg bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:placeholder:text-gray-500 resize-none"
            />
          </div>

          {/* Output */}
          <div className="flex flex-col space-y-2 relative">
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Formatted Output:
              </label>
              {!loading && formattedJson && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs px-2.5 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 transition"
                >
                  {copied ? 'Copied!' : 'Copy Output'}
                </button>
              )}
            </div>
            <div className="w-full result-box-h overflow-auto p-3 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
              {loading ? (
                <LoadingIndicator />
              ) : formattedJson ? (
                <JsonTreeView />
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  The formatted result will appear here...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <ToolGuide
        title="How to use the JSON Formatter"
        intro="The JSON Formatter turns compact or messy JSON into a clean, indented tree that is easy to read, check and edit. Everything runs in your browser, so your data is never uploaded to a server."
        steps={[
          'Paste your JSON into the Input JSON box (it appears above the output on small screens).',
          'Click Format JSON. The result appears in the Formatted Output panel as a collapsible tree.',
          'Use the small arrow next to any object or array to collapse or expand it, which helps when working with large documents.',
          'To change a value, click it in the output, type the new value and press Enter. Press Esc to cancel. The input and the output stay in sync.',
          'Click Copy Output to copy the formatted JSON to your clipboard, or Clear to remove everything and start over.',
        ]}
        tips={[
          'Trailing commas (for example {"a": 1,}) are removed automatically, and an invisible byte-order mark copied from some editors is ignored.',
          'Very large integers keep their exact value instead of being rounded.',
          'If the JSON is invalid, a red message explains the syntax error so you can fix the input and try again.',
          'The formatted output uses 2-space indentation.',
        ]}
        faq={[
          {
            question: 'Is my JSON sent to a server?',
            answer: 'No. The JSON is parsed and formatted in your browser, so nothing you paste is uploaded or stored on a server.',
          },
          {
            question: 'Why does it show "JSON syntax error"?',
            answer: 'JSON has strict rules: keys and text must use double quotes, single quotes are not allowed, keys cannot be unquoted, and comments are not part of JSON. The message shows what the parser found. Fix the input and click Format JSON again.',
          },
          {
            question: 'Does it fix trailing commas?',
            answer: 'Yes. A comma before a closing } or ] is removed automatically before parsing, and an invisible byte-order mark at the start of the text (often added by Notepad) is ignored.',
          },
          {
            question: 'Can I change a value in the formatted result?',
            answer: 'Yes. Click a value, type the new one and press Enter (Esc cancels). This works for single values such as text, numbers, true, false and null, and the Input box is updated to match. To change the structure, edit the Input and format again.',
          },
          {
            question: 'Does it change very large numbers?',
            answer: 'No. Whole numbers that are larger than JavaScript can normally store exactly keep all their digits instead of being rounded.',
          },
          {
            question: 'Is there a minify option?',
            answer: 'Not at the moment. The output is always formatted with 2-space indentation.',
          },
        ]}
        vi={{
          title: 'Công cụ định dạng JSON online',
          summary: 'Công cụ định dạng JSON (JSON formatter) giúp bạn làm đẹp, kiểm tra cú pháp và chỉnh sửa JSON ngay trên trình duyệt. Miễn phí, không cần đăng ký, và dữ liệu của bạn không bị tải lên máy chủ. Nếu JSON sai cú pháp, công cụ sẽ báo lỗi để bạn sửa lại.',
          steps: [
            'Dán chuỗi JSON vào ô Input JSON.',
            'Bấm Format JSON để xem kết quả dạng cây, có thể thu gọn hoặc mở rộng từng nhánh.',
            'Bấm vào một giá trị để sửa, nhấn Enter để lưu, rồi bấm Copy Output để sao chép kết quả.',
          ],
        }}
      />
    </div>
  );
};

export default Home;
