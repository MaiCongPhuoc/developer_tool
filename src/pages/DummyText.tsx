import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearDummyText,
  generateText,
  setCharCount,
  setCopied,
} from '@/store/slices/dummyTextSlice';

const inputClass =
  'w-full p-2.5 text-sm border rounded-lg bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:placeholder:text-gray-500';

const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

const DummyText = () => {
  const dispatch = useAppDispatch();
  const { charCount, generatedText, error, copied } = useAppSelector(
    (state) => state.dummyText
  );

  // State sống trong Redux nên tồn tại xuyên suốt cả app, không tự mất khi
  // chuyển route như useState thường làm -> phải chủ động xoá mỗi khi vào
  // lại trang này để không còn thấy kết quả của lần trước.
  useEffect(() => {
    dispatch(clearDummyText());
  }, [dispatch]);

  // Sinh đoạn text mẫu theo số ký tự đã nhập
  const handleGenerate = () => {
    dispatch(generateText());
  };

  // Sao chép kết quả
  const handleCopy = async () => {
    if (!generatedText) return;
    await navigator.clipboard.writeText(generatedText);
    dispatch(setCopied(true));
    setTimeout(() => dispatch(setCopied(false)), 2000);
  };

  // Xóa nội dung
  const handleClear = () => {
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
            className="flex-1 sm:flex-none min-w-30 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
          >
            Generate Text
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
              {generatedText && ` (${generatedText.length} characters)`}:
            </label>
            {generatedText && (
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs px-2.5 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 transition"
              >
                {copied ? 'Copied!' : 'Copy Output'}
              </button>
            )}
          </div>
          <div className="w-full h-64 sm:h-80 overflow-auto p-3 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
            {generatedText ? (
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
    </div>
  );
};

export default DummyText;
