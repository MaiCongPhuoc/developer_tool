import type { Element } from 'hast';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import LoadingIndicator from '@/components/LoadingIndicator';
import MarkdownErrorBoundary from '@/components/MarkdownErrorBoundary';
import MermaidDiagram from '@/components/MermaidDiagram';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearMarkdown,
  resetMarkdown,
  setCopiedField,
  setError,
  setMarkdown,
} from '@/store/slices/markdownSlice';

// Component custom (code trả về <MermaidDiagram>) chỉ THỰC SỰ được React
// gọi/render ở một lượt sau, nên lúc <pre> nhận children, children.type vẫn
// còn là hàm "code" ở dưới chứ CHƯA phải MermaidDiagram - không thể so sánh
// child.type === MermaidDiagram ở đây được. Phải kiểm tra thẳng trên AST gốc
// (node.children - hast, không đi qua React) xem code con có phải
// "language-mermaid" hay không.
const isMermaidPreNode = (node: Element | undefined): boolean => {
  const codeNode = node?.children.find(
    (child): child is Element =>
      child.type === 'element' && child.tagName === 'code'
  );
  const classNames = codeNode?.properties?.className;
  return (
    Array.isArray(classNames) && classNames.includes('language-mermaid')
  );
};

// react-markdown v10 không còn truyền prop "inline" cho components.code như
// bản cũ - phân biệt bằng className: chỉ code block dạng ```lang mới có
// className "language-lang" (do remark gắn vào), code `inline` không có.
const markdownComponents: Components = {
  code({ className, children, ...rest }) {
    const language = /language-(\w+)/.exec(className ?? '')?.[1];

    if (language === 'mermaid') {
      return <MermaidDiagram code={String(children).replace(/\n$/, '')} />;
    }

    // Các ngôn ngữ khác: giữ nguyên className/children - rehype-highlight đã
    // gắn sẵn <span class="hljs-..."> tô màu cú pháp bên trong children rồi,
    // không cần xử lý gì thêm ở đây.
    return (
      <code className={className} {...rest}>
        {children}
      </code>
    );
  },
  // react-markdown luôn bọc code block trong <pre><code>...</code></pre> -
  // với code JS/Python bình thường thì đúng ý (Tailwind Typography tô nền
  // tối cho <pre> để trông giống ô code), nhưng với Mermaid thì children đã
  // là 1 sơ đồ SVG/thông báo lỗi (từ MermaidDiagram), không phải văn bản, nên
  // không được bọc trong <pre> nữa (<pre> ép white-space: pre khiến chữ
  // thông báo lỗi bị tràn thay vì xuống dòng, và nền tối không hợp làm khung
  // cho sơ đồ). Bỏ qua lớp bọc <pre> CHỈ khi con bên trong là MermaidDiagram.
  pre({ node, children }) {
    if (isMermaidPreNode(node)) {
      return <>{children}</>;
    }
    return <pre>{children}</pre>;
  },
};

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
    const html = previewRef.current?.innerHTML;
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
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[
                        [rehypeHighlight, { ignoreMissing: true }],
                      ]}
                      components={markdownComponents}
                    >
                      {displayedMarkdown}
                    </ReactMarkdown>
                  </div>
                </MarkdownErrorBoundary>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkdownPreviewer;
