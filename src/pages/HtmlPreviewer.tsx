import { useEffect, useRef, useState } from 'react';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearHtmlPreview,
  resetHtmlPreview,
  setCopiedField,
  setError,
  setHtml,
} from '@/store/slices/htmlPreviewSlice';

const textareaClass =
  'w-full result-box-h p-3 font-mono text-sm border rounded-lg bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:placeholder:text-gray-500 resize-none';

const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

// Mô phỏng cảm giác "chờ kết quả trả về" y hệt MarkdownPreviewer - xem giải
// thích chi tiết 2 giai đoạn (pause rồi mới loading) ở đó.
const PREVIEW_PAUSE_MS = 500;
const PREVIEW_LOADING_MS = 1000;

// sandbox CHỈ bật đúng 4 quyền cần cho 1 trang demo bình thường (chạy script,
// alert/confirm, submit form, mở popup) - cố tình KHÔNG có "allow-same-
// origin": nếu thêm vào, iframe dùng srcDoc sẽ được trình duyệt coi là CÙNG
// origin với chính trang app này (theo đúng spec HTML), lúc đó JavaScript
// người dùng gõ có thể với tay ra ngoài đọc DOM/localStorage/cookie của app.
// Thiếu "allow-same-origin", iframe luôn mang origin "null" (opaque) riêng
// biệt, cô lập hoàn toàn khỏi trang cha - đúng cách CodePen/JSFiddle/
// StackBlitz bảo vệ trang chứa khung preview của họ. Đây cũng là lý do KHÔNG
// cần cài thêm package nào: sandbox là tính năng có sẵn của trình duyệt.
const IFRAME_SANDBOX = 'allow-scripts allow-modals allow-forms allow-popups';

const HtmlPreviewer = () => {
  const dispatch = useAppDispatch();
  const { html, copiedField, error } = useAppSelector(
    (state) => state.htmlPreview
  );

  // State sống trong Redux nên tồn tại xuyên suốt cả app, không tự mất khi
  // chuyển route như useState thường làm -> phải chủ động xoá mỗi khi vào
  // lại trang này để không còn thấy nội dung của lần trước.
  useEffect(() => {
    dispatch(resetHtmlPreview());
  }, [dispatch]);

  // displayedHtml là nội dung THỰC SỰ được đưa vào iframe - cố tình đi TRỄ
  // hơn html (Redux, dùng cho ô nhập liệu) đúng PREVIEW_LOADING_MS, để mô
  // phỏng cảm giác chờ kết quả trả về. Gõ liên tục sẽ tự dời thời điểm cập
  // nhật ra xa hơn (debounce), giống MarkdownPreviewer.displayedMarkdown.
  const [displayedHtml, setDisplayedHtml] = useState(html);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  // So sánh GIÁ TRỊ (không phải cờ boolean) để tránh bẫy StrictMode chạy
  // effect 2 lần lúc mount - xem giải thích chi tiết ở MarkdownPreviewer.
  const lastSyncedHtmlRef = useRef(html);

  useEffect(() => {
    if (html === lastSyncedHtmlRef.current) {
      return;
    }
    setIsPreviewLoading(false);

    let loadTimer: ReturnType<typeof setTimeout> | undefined;
    const pauseTimer = setTimeout(() => {
      setIsPreviewLoading(true);
      loadTimer = setTimeout(() => {
        lastSyncedHtmlRef.current = html;
        setDisplayedHtml(html);
        setIsPreviewLoading(false);
      }, PREVIEW_LOADING_MS);
    }, PREVIEW_PAUSE_MS);

    return () => {
      clearTimeout(pauseTimer);
      clearTimeout(loadTimer);
    };
  }, [html]);

  const handleClear = () => {
    dispatch(clearHtmlPreview());
  };

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(html);
      dispatch(setCopiedField('html'));
      setTimeout(() => dispatch(setCopiedField(null)), 2000);
    } catch {
      dispatch(setError('Could not copy to clipboard. Please copy manually.'));
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
        HTML Previewer
      </h1>

      <div className="space-y-4 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
        {/* Thanh công cụ */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 sm:flex-none min-w-30 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleCopyHtml}
            className="flex-1 sm:flex-none min-w-30 px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-white rounded-lg hover:bg-gray-300 font-medium transition"
          >
            {copiedField === 'html' ? 'Copied!' : 'Copy HTML'}
          </button>
        </div>

        {/* Thông báo lỗi nếu có */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Soạn thảo + xem trước - không cần bấm nút Generate (tự động theo
            mỗi lần đổi nội dung), nhưng CÓ chủ đích trễ PREVIEW_LOADING_MS để
            mô phỏng cảm giác chờ kết quả kiểu gọi API, giống MarkdownPreviewer. */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-2">
            <label className={labelClass}>HTML:</label>
            <textarea
              value={html}
              onChange={(e) => dispatch(setHtml(e.target.value))}
              placeholder="Type your HTML here (put CSS in <style> and JavaScript in <script>)..."
              className={textareaClass}
              spellCheck={false}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className={labelClass}>Preview:</label>
            {/* overflow-hidden (không phải overflow-auto như Markdown) vì
                nội dung cuộn BÊN TRONG document riêng của iframe - để khung
                ngoài cũng cuộn sẽ ra 2 thanh cuộn lồng nhau không cần thiết. */}
            <div className="result-box-h overflow-hidden rounded-lg border border-gray-300 bg-white dark:border-gray-700">
              {isPreviewLoading ? (
                <LoadingIndicator label="Rendering preview..." />
              ) : (
                <iframe
                  title="HTML Preview"
                  srcDoc={displayedHtml}
                  sandbox={IFRAME_SANDBOX}
                  className="h-full w-full border-0 bg-white"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HtmlPreviewer;
