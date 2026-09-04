import mermaid from 'mermaid';
import { useEffect, useRef, useState } from 'react';
import { useIsDarkMode } from '@/hook/useIsDarkMode';

interface MermaidDiagramProps {
  code: string;
}

// Mỗi lần mermaid.render() cần 1 id DOM duy nhất - dùng bộ đếm toàn cục thay
// vì useId() để id ổn định ngay cả khi component này được nhiều sơ đồ dùng
// cùng lúc trên 1 trang.
let mermaidIdCounter = 0;

const MermaidDiagram = ({ code }: MermaidDiagramProps) => {
  const isDarkMode = useIsDarkMode();
  const idRef = useRef(`mermaid-diagram-${++mermaidIdCounter}`);

  const [svg, setSvg] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      // 'strict' là mức mặc định an toàn nhất của mermaid - tự lọc bỏ HTML/
      // script nguy hiểm có thể lọt vào qua label của node, không nên hạ
      // xuống 'loose' dù nội dung này đã an toàn khỏi XSS nhờ react-markdown
      // không render HTML thô ở tầng Markdown phía trên.
      securityLevel: 'strict',
      theme: isDarkMode ? 'dark' : 'default',
    });
  }, [isDarkMode]);

  useEffect(() => {
    // Component cha (MarkdownPreviewer) đã có 1 lớp loading riêng chỉ đưa
    // nội dung MỚI xuống sau khi người dùng ngừng gõ, nên không cần tự
    // debounce dài ở đây nữa. VẪN phải bọc trong setTimeout (dù chỉ 0ms) chứ
    // không gọi mermaid.render() thẳng trong effect: React StrictMode (dev)
    // cố tình chạy effect 2 lần lúc mount (mount -> cleanup -> mount lại) để
    // dò side-effect không thuần khiết - nếu gọi mermaid.render() (vốn tự
    // tạo 1 phần tử DOM tạm theo id) ngay lập tức, 2 lần gọi chồng lên nhau
    // với CÙNG id sẽ đụng độ và mermaid ném lỗi runtime. Đưa vào setTimeout
    // thì cleanup của lần chạy ảo đầu tiên kịp clearTimeout trước khi hàm
    // thật sự chạy, y hệt cách debounce cũ vô tình tránh được lỗi này.
    let cancelled = false;

    const timer = setTimeout(() => {
      setRenderError(null);

      mermaid
        .render(idRef.current, code)
        .then(({ svg: renderedSvg }) => {
          if (!cancelled) {
            setSvg(renderedSvg);
            setRenderError(null);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setRenderError(
              err instanceof Error ? err.message : 'Invalid Mermaid syntax.'
            );
          }
        })
        .finally(() => {
          // mermaid.render() tự tạo 1 <div id="d"+id> gắn THẲNG vào
          // document.body để đo layout (do ta không truyền container riêng)
          // và KHÔNG tự xoá nó sau khi xong - kể cả khi thất bại (lúc đó nó
          // còn nhét cả 1 SVG "error" hiển thị được vào trong). Nếu không tự
          // dọn ở đây, mỗi lần render (kể cả khi gõ sai cú pháp) sẽ để lại
          // thêm 1 phần tử rác nổi ngoài ý muốn trên trang, tích luỹ dần.
          document.getElementById(`d${idRef.current}`)?.remove();
        });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // Render lại khi đổi theme để sơ đồ khớp màu sáng/tối hiện tại.
  }, [code, isDarkMode]);

  if (renderError) {
    return (
      <div className="my-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
        Invalid Mermaid diagram syntax: {renderError}
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-2 text-xs text-gray-400 dark:text-gray-500">
        Rendering diagram…
      </div>
    );
  }

  return (
    <div
      className="my-2 flex justify-center overflow-auto"
      // svg do chính mermaid tạo ra (đã qua bộ lọc securityLevel: 'strict'),
      // không phải HTML thô của người dùng nên an toàn khi chèn trực tiếp.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default MermaidDiagram;
