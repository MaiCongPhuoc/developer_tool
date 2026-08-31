import { useEffect } from 'react';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useDelayedAction } from '@/hook/useDelayedAction';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearQrCode,
  setError,
  setQrCode,
  setText,
} from '@/store/slices/qrCodeSlice';
import {
  generateQrCodeDataUrl,
  generateQrCodeSvg,
  getUtf8ByteLength,
  MAX_QR_BYTES,
  svgToObjectUrl,
  triggerDownload,
} from '@/util/qrcode';

const textareaClass =
  'w-full h-28 p-3 font-mono text-sm border rounded-lg bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:placeholder:text-gray-500 resize-none';

const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

const QrCode = () => {
  const dispatch = useAppDispatch();
  const { text, qrCodeDataUrl, qrCodeSvg, error } = useAppSelector(
    (state) => state.qrCode
  );
  const { loading, run, cancel } = useDelayedAction();

  // State sống trong Redux nên tồn tại xuyên suốt cả app, không tự mất khi
  // chuyển route như useState thường làm -> phải chủ động xoá mỗi khi vào
  // lại trang này để không còn thấy kết quả của lần trước.
  useEffect(() => {
    dispatch(clearQrCode());
  }, [dispatch]);

  // Thư viện `qrcode` mã hoá bất đồng bộ (trả Promise) nên không thể gói gọn
  // trong 1 reducer đồng bộ như generateUuids/generate (Password) - validate
  // + gọi thư viện nằm ở đây, dispatch kết quả cuối cùng vào Redux (giống
  // cách FileCompare đọc file bằng FileReader ở component).
  const handleGenerate = () => {
    run(async () => {
      const trimmed = text.trim();
      if (!trimmed) {
        dispatch(setError('Please enter a URL or text to generate a QR code.'));
        return;
      }
      if (getUtf8ByteLength(trimmed) > MAX_QR_BYTES) {
        dispatch(
          setError(
            `Text is too long to encode into a QR code (max ${MAX_QR_BYTES} bytes).`
          )
        );
        return;
      }

      try {
        const [dataUrl, svg] = await Promise.all([
          generateQrCodeDataUrl(trimmed),
          generateQrCodeSvg(trimmed),
        ]);
        dispatch(setQrCode({ dataUrl, svg }));
      } catch (err) {
        dispatch(
          setError(
            err instanceof Error ? err.message : 'Could not generate QR code.'
          )
        );
      }
    });
  };

  const handleClear = () => {
    cancel();
    dispatch(clearQrCode());
  };

  const handleDownloadPng = () => {
    if (!qrCodeDataUrl) return;
    triggerDownload(qrCodeDataUrl, 'qrcode.png');
  };

  const handleDownloadSvg = () => {
    if (!qrCodeSvg) return;
    const objectUrl = svgToObjectUrl(qrCodeSvg);
    triggerDownload(objectUrl, 'qrcode.svg');
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
        QR Code Generator
      </h1>

      <div className="space-y-4 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
        {/* Nội dung cần mã hoá */}
        <div className="flex flex-col space-y-2">
          <label className={labelClass}>URL / Text:</label>
          <textarea
            value={text}
            onChange={(e) => dispatch(setText(e.target.value))}
            placeholder="https://example.com or any text"
            className={textareaClass}
            spellCheck={false}
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
          <label className={labelClass}>QR Code:</label>
          <div className="w-full flex flex-col items-center gap-4 p-3 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
            {loading ? (
              <LoadingIndicator />
            ) : qrCodeDataUrl ? (
              <>
                {/* Khung nền luôn trắng (không theo dark mode) để mã QR luôn
                    đủ tương phản đen/trắng, quét được kể cả khi app đang bật
                    dark mode. */}
                <div className="inline-block bg-white p-4 rounded-lg">
                  <img
                    src={qrCodeDataUrl}
                    alt="Generated QR code"
                    width={280}
                    height={280}
                  />
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadPng}
                    className="text-xs px-3 py-1.5 bg-gray-200 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 transition"
                  >
                    Download PNG
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSvg}
                    className="text-xs px-3 py-1.5 bg-gray-200 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 transition"
                  >
                    Download SVG
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-16">
                The QR code will appear here...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrCode;
