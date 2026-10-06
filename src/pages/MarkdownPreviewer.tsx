import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import LoadingIndicator from '@/components/LoadingIndicator';
import MarkdownErrorBoundary from '@/components/MarkdownErrorBoundary';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearMarkdown,
  resetMarkdown,
  setCopiedField,
  setError,
  setMarkdown,
} from '@/store/slices/markdownSlice';
import ToolGuide from '@/components/ToolGuide';

// Phần hiển thị Markdown nặng (react-markdown + highlight + mermaid) được nạp
// khi trang này mở, không nằm trong bundle JS chính - xem MarkdownRenderer.tsx.
const MarkdownRenderer = lazy(() => import('@/components/MarkdownRenderer'));


const textareaClass =
  'w-full result-box-h p-3 font-mono text-sm border rounded-lg bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:placeholder:text-gray-500 resize-none';

const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

// Mô phỏng cảm giác "chờ API trả kết quả", chia làm 2 giai đoạn sau khi
// markdown đổi:
// 1. PREVIEW_PAUSE_MS - khoảng dừng NGẮN ngay sau khi gõ, Preview CŨ vẫn
//    hiện bình thường, KHÔNG loading gì cả (nếu gõ tiếp trong lúc này thì
//    huỷ, tính lại từ đầu - đây chính là debounce chờ người dùng dừng tay).
// 2. PREVIEW_LOADING_MS - sau khi đã dừng đủ lâu, mới THỰC SỰ bắt đầu hiện
//    loading che kín Preview, xong loading mới đổi sang kết quả mới.
const PREVIEW_PAUSE_MS = 500;
const PREVIEW_LOADING_MS = 1000;

const MarkdownPreviewer = () => {
  const dispatch = useAppDispatch();
  const { markdown, copiedField, error } = useAppSelector(
    (state) => state.markdown
  );

  // Lỗi render (nếu MarkdownErrorBoundary bắt được) chỉ phục vụ UI (ẩn nút
  // Copy HTML vì lúc đó không có gì hợp lệ để copy) - không cần lưu Redux.
  const [hasRenderError, setHasRenderError] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // State sống trong Redux nên tồn tại xuyên suốt cả app, không tự mất khi
  // chuyển route như useState thường làm -> phải chủ động xoá mỗi khi vào
  // lại trang này để không còn thấy nội dung của lần trước.
  useEffect(() => {
    dispatch(resetMarkdown());
  }, [dispatch]);

  // displayedMarkdown là nội dung THỰC SỰ được đưa vào ReactMarkdown - cố
  // tình đi TRỄ hơn markdown (Redux, dùng cho ô nhập liệu) đúng 1 khoảng
  // PREVIEW_LOADING_MS, để mô phỏng cảm giác chờ kết quả trả về. Gõ liên tục
  // sẽ tự dời thời điểm cập nhật ra xa hơn (debounce), giống hệt cách 1 lệnh
  // gọi API thật chỉ chạy sau khi người dùng ngừng gõ.
  const [displayedMarkdown, setDisplayedMarkdown] = useState(markdown);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  // So sánh GIÁ TRỊ (không phải cờ boolean "đã chạy lần đầu chưa") để tránh
  // bẫy StrictMode: React (dev) cố tình chạy useEffect 2 lần lúc mount để dò
  // side-effect không thuần khiết - 1 cờ boolean "tiêu dùng 1 lần" sẽ bị lần
  // chạy ảo đầu tiêu thụ mất, khiến lần chạy thật thứ 2 hiểu nhầm là có thay
  // đổi thật và hiện loading ngay khi vừa vào trang. So sánh giá trị thì an
  // toàn vì chạy lại nhiều lần với cùng input vẫn luôn ra cùng kết quả.
  const lastSyncedMarkdownRef = useRef(markdown);

  useEffect(() => {
    if (markdown === lastSyncedMarkdownRef.current) {
      return;
    }
    // Mỗi lần có thay đổi MỚI (kể cả khi đang ở giữa giai đoạn loading dở
    // dang của lần gõ trước) đều quay về "hiện nội dung cũ, chưa loading" -
    // đúng yêu cầu Preview cũ phải luôn hiển thị bình thường suốt lúc đang
    // gõ, chỉ khi thật sự dừng tay mới bắt đầu loading lại từ đầu.
    setIsPreviewLoading(false);

    let loadTimer: ReturnType<typeof setTimeout> | undefined;
    const pauseTimer = setTimeout(() => {
      setIsPreviewLoading(true);
      loadTimer = setTimeout(() => {
        lastSyncedMarkdownRef.current = markdown;
        setDisplayedMarkdown(markdown);
        setIsPreviewLoading(false);
      }, PREVIEW_LOADING_MS);
    }, PREVIEW_PAUSE_MS);

    return () => {
      clearTimeout(pauseTimer);
      clearTimeout(loadTimer);
    };
  }, [markdown]);

  const handleClear = () => {
    dispatch(clearMarkdown());
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      dispatch(setCopiedField('markdown'));
      setTimeout(() => dispatch(setCopiedField(null)), 2000);
    } catch {
      dispatch(setError('Could not copy to clipboard. Please copy manually.'));
    }
  };

  // Đọc thẳng innerHTML của khung preview ĐÃ RENDER thay vì parse lại
  // markdown lần 2 bằng renderToStaticMarkup - vừa tránh tốn công parse 2
  // lần, vừa đảm bảo HTML copy ra khớp 100% với những gì đang hiển thị.
  const handleCopyHtml = async () => {
    // Chưa có khung .prose nghĩa là phần render Markdown (nạp lười) chưa tải
    // xong - lúc đó innerHTML chỉ là chữ "Loading preview...", không copy.
    if (!previewRef.current?.querySelector('.prose')) return;
    const html = previewRef.current.innerHTML;
    if (!html) return;
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
        Markdown Previewer
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
            onClick={handleCopyMarkdown}
            className="flex-1 sm:flex-none min-w-30 px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-white rounded-lg hover:bg-gray-300 font-medium transition"
          >
            {copiedField === 'markdown' ? 'Copied!' : 'Copy Markdown'}
          </button>
          <button
            type="button"
            onClick={handleCopyHtml}
            disabled={hasRenderError || isPreviewLoading}
            className="flex-1 sm:flex-none min-w-30 px-4 py-2 bg-gray-200 dark:bg-gray-700 dark:text-white rounded-lg hover:bg-gray-300 font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
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

        {/* Soạn thảo + xem trước - không cần bấm nút Generate như các trang
            khác (vẫn tự động theo mỗi lần đổi nội dung), nhưng CÓ chủ đích
            trễ PREVIEW_LOADING_MS (xem state displayedMarkdown) để mô phỏng
            cảm giác chờ kết quả kiểu gọi API, theo yêu cầu của người dùng. */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-2">
            <label className={labelClass}>Markdown:</label>
            <textarea
              value={markdown}
              onChange={(e) => dispatch(setMarkdown(e.target.value))}
              placeholder="Type your Markdown here..."
              className={textareaClass}
              spellCheck={false}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className={labelClass}>Preview:</label>
            <div
              ref={previewRef}
              className="result-box-h overflow-auto rounded-lg border border-gray-300 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
            >
              {/* Khung preview luôn NỀN TRẮNG/CHỮ ĐEN mặc định (không theo
                  dark mode) cho khớp với đúng những gì sẽ hiện nếu dán HTML
                  đã copy ra 1 trang/tài liệu khác (thường có nền trắng) -
                  dark:prose-invert vẫn bật để chữ đọc được trên nền tối của
                  CHÍNH khung preview này. */}
              {isPreviewLoading ? (
                <LoadingIndicator label="Rendering preview..." />
              ) : (
                <MarkdownErrorBoundary
                  resetKey={displayedMarkdown}
                  onErrorChange={setHasRenderError}
                  fallback={
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Could not render this Markdown - it may contain an
                      unusually complex structure. Try simplifying it.
                    </p>
                  }
                >
                  <Suspense
                    fallback={<LoadingIndicator label="Loading preview..." />}
                  >
                    <MarkdownRenderer markdown={displayedMarkdown} />
                  </Suspense>
                </MarkdownErrorBoundary>
              )}
            </div>
          </div>
        </div>
      </div>
      <ToolGuide
        title="How to use the Markdown Previewer"
        intro="Write Markdown on one side and see the formatted result update on the other. It supports GitHub-style Markdown, syntax-highlighted code blocks and Mermaid diagrams. Everything runs in your browser, so your text is never uploaded to a server."
        steps={[
          'Type or paste your Markdown into the Markdown box. A short example is already there, so you can see how it works.',
          'Stop typing for a moment and the Preview updates automatically. There is no button to press.',
          'Use the usual Markdown syntax: # for headings, ** for bold, * for italics, - for lists, [text](url) for links, and three backticks to start and end a code block.',
          'To draw a diagram, start a code block with three backticks followed by the word mermaid, and write your Mermaid diagram inside it.',
          'Click Copy Markdown to copy what you wrote, Copy HTML to copy the generated HTML, or Clear to empty the Markdown box.',
        ]}
        tips={[
          'Tables, task lists (- [ ] and - [x]) and strikethrough work, as they do on GitHub.',
          'Add the language after the opening backticks, for example js or python, to get colored code.',
          'Content is limited to 100,000 characters, and lines with extremely deep nesting are rejected to keep your browser from freezing. A message appears in both cases.',
          'If a Mermaid diagram has a syntax error, a yellow message shows the problem so you can fix it.',
        ]}
        vi={{
          title: 'Công cụ xem trước Markdown online',
          summary: 'Trình soạn thảo Markdown online có xem trước trực tiếp, hỗ trợ bảng, danh sách việc cần làm, tô màu code và vẽ sơ đồ Mermaid. Văn bản của bạn không bị tải lên máy chủ.',
          steps: [
            'Nhập hoặc dán Markdown vào ô bên trái.',
            'Dừng gõ một lúc, phần Preview sẽ tự cập nhật.',
            'Bấm Copy Markdown hoặc Copy HTML để sao chép.',
          ],
        }}
      />
    </div>
  );
};

export default MarkdownPreviewer;
