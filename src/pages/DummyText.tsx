import { useEffect } from 'react';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useDelayedAction } from '@/hook/useDelayedAction';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearDummyText,
  generateText,
  setCharCount,
  setCopied,
  setError,
} from '@/store/slices/dummyTextSlice';
import ToolGuide from '@/components/ToolGuide';

const inputClass =
  'w-full p-2.5 text-sm border rounded-lg bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:placeholder:text-gray-500';

const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

const DummyText = () => {
  const dispatch = useAppDispatch();
  const { charCount, generatedText, error, copied } = useAppSelector(
    (state) => state.dummyText
  );
  const { loading, run, cancel } = useDelayedAction();

  // State sống trong Redux nên tồn tại xuyên suốt cả app, không tự mất khi
  // chuyển route như useState thường làm -> phải chủ động xoá mỗi khi vào
  // lại trang này để không còn thấy kết quả của lần trước.
  useEffect(() => {
    dispatch(clearDummyText());
  }, [dispatch]);

  // Sinh đoạn text mẫu theo số ký tự đã nhập - trễ RESULT_DELAY_MS để hiện
  // khung chờ trước khi trả kết quả, xem lý do ở useDelayedAction.
  const handleGenerate = () => {
    run(() => dispatch(generateText()));
  };

  // Sao chép kết quả
  const handleCopy = async () => {
    if (!generatedText) return;
    try {
      await navigator.clipboard.writeText(generatedText);
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
    dispatch(clearDummyText());
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
        Dummy Text Generator
      </h1>

      <div className="space-y-4 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
        {/* Nhập số ký tự cần sinh */}
        <div className="flex flex-col space-y-2 max-w-xs">
          <label className={labelClass}>
            Number of characters (spaces included):
          </label>
          <input
            type="number"
            min={1}
            value={charCount}
            onChange={(e) => dispatch(setCharCount(e.target.value))}
            placeholder="e.g. 11"
            className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          />
        </div>

        {/* Thanh công cụ */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="flex-1 sm:flex-none min-w-30 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Processing...' : 'Generate Text'}
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
              Generated Text
              {!loading &&
                generatedText &&
                ` (${generatedText.length} characters)`}
              :
            </label>
            {!loading && generatedText && (
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
            ) : generatedText ? (
              <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words">
                {generatedText}
              </p>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                The generated text will appear here...
              </p>
            )}
          </div>
        </div>
      </div>
      <ToolGuide
        title="How to use the Dummy Text Generator"
        intro="Generate placeholder (lorem ipsum) text of an exact length for mockups, page layouts and tests. Everything runs in your browser."
        steps={[
          'Enter the number of characters you need. Spaces are included in the count.',
          'Click Generate Text. The text appears in the output box.',
          'Click Copy Output to copy the text to your clipboard, or Clear to reset the page.',
        ]}
        tips={[
          'The length must be a whole number from 1 to 100000. Otherwise a red message explains the problem.',
          'The generated text has exactly the number of characters you asked for, so it is handy for testing fields with a maximum length.',
        ]}
        faq={[
          {
            question: 'Is the text random?',
            answer: 'No. It always uses the classic Lorem Ipsum words in the same order, repeated as many times as needed. The same length always gives the same text.',
          },
          {
            question: 'Is the length exact?',
            answer: 'Yes. The number you enter is the number of characters, spaces included. The text is cut at exactly that length, so the last word may be cut in the middle.',
          },
          {
            question: 'What is the minimum and maximum length?',
            answer: 'From 1 to 100000 characters. A message appears if the number is not a whole number or is outside that range.',
          },
          {
            question: 'What is Lorem Ipsum for?',
            answer: 'It is meaningless placeholder text used in designs and mockups so that a layout can be judged without real content. It also helps to test fields with a maximum length.',
          },
        ]}
        vi={{
          title: 'Công cụ tạo văn bản mẫu (Lorem Ipsum)',
          summary: 'Công cụ tạo văn bản mẫu Lorem Ipsum theo đúng số ký tự bạn cần, dùng cho thiết kế giao diện, mockup và kiểm thử các ô nhập có giới hạn độ dài. Hỗ trợ từ 1 đến 100000 ký tự.',
          steps: [
            'Nhập số ký tự cần tạo (tính cả dấu cách).',
            'Bấm Generate Text.',
            'Bấm Copy Output để sao chép văn bản.',
          ],
        }}
      />
    </div>
  );
};

export default DummyText;
