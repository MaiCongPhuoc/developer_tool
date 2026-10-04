import type { Element } from 'hast';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import MermaidDiagram from '@/components/MermaidDiagram';

// Tách riêng khỏi MarkdownPreviewer để trang này nạp "lười" (React.lazy): các
// thư viện render Markdown (react-markdown, remark-gfm, rehype-highlight/
// highlight.js, mermaid - cả MB mã JS) chỉ tải khi người dùng thực sự mở trang
// Markdown Previewer, không nằm trong bundle JS chính của mọi trang.

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

type MarkdownRendererProps = {
  markdown: string;
};

const MarkdownRenderer = ({ markdown }: MarkdownRendererProps) => (
  <div className="prose prose-sm dark:prose-invert max-w-none">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}
      components={markdownComponents}
    >
      {markdown}
    </ReactMarkdown>
  </div>
);

export default MarkdownRenderer;
