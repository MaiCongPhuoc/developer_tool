import { useLocation } from 'react-router';
import { getRelatedSearches } from '@/seo/toolKeywords';

type ToolGuideProps = {
  // Tiêu đề phần hướng dẫn, vd "How to use the JSON Formatter".
  title: string;
  // 1-2 câu giới thiệu: công cụ làm gì, vì sao hữu ích.
  intro: string;
  // Các bước thao tác, theo đúng thứ tự người dùng thực hiện.
  steps: string[];
  // Mẹo/lưu ý thêm (không bắt buộc).
  tips?: string[];
  // Bản hướng dẫn nhanh bằng tiếng Việt (không bắt buộc) - để người dùng Việt
  // Nam tìm thấy công cụ bằng từ khóa tiếng Việt. Là nội dung thật, hiển thị
  // cho người dùng (không ẩn), đặt thuộc tính lang="vi" cho đúng ngôn ngữ.
  vi?: {
    title: string;
    summary: string;
    steps: string[];
  };
};

// Khung "Hướng dẫn sử dụng" dùng chung cho mọi trang công cụ. Đặt ở CUỐI nội
// dung mỗi trang (bên trong <Outlet/>), nên tự nhiên nằm ngay dưới khu vực
// Input/Output và phía trên ô "Bottom ad" cố định của AppLayout - không đụng
// tới kiến trúc quảng cáo (xem project_ad_architecture).
//
// Chữ này nằm trong HTML được prerender lúc build (scripts/prerender.mjs), nên
// crawler không chạy JavaScript cũng đọc được nội dung hướng dẫn.
const ToolGuide = ({ title, intro, steps, tips, vi }: ToolGuideProps) => {
  // Các cụm tìm kiếm liên quan lấy theo đường dẫn trang từ seo/toolKeywords.ts
  // (sửa danh sách ở đó, không sửa ở đây).
  const { pathname } = useLocation();
  const related = getRelatedSearches(pathname);

  return (
    <section className="space-y-4 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
        {title}
      </h2>

      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
        {intro}
      </p>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          Step by step
        </h3>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-gray-600 marker:font-medium marker:text-gray-500 dark:text-gray-300 dark:marker:text-gray-400">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      {tips && tips.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Tips
          </h3>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-gray-600 marker:text-gray-400 dark:text-gray-300">
            {tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {vi && (
        <div
          lang="vi"
          className="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-700"
        >
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">
            {vi.title}
          </h3>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {vi.summary}
          </p>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-gray-600 marker:font-medium marker:text-gray-500 dark:text-gray-300 dark:marker:text-gray-400">
            {vi.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      )}
      {(related.en.length > 0 || related.vi.length > 0) && (
        <div className="space-y-1.5 border-t border-gray-200 pt-4 text-xs leading-relaxed text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {related.en.length > 0 && (
            <p>
              <span className="font-semibold text-gray-600 dark:text-gray-300">
                Related searches:
              </span>{' '}
              {related.en.join(' · ')}
            </p>
          )}
          {related.vi.length > 0 && (
            <p lang="vi">
              <span className="font-semibold text-gray-600 dark:text-gray-300">
                Tìm kiếm liên quan:
              </span>{' '}
              {related.vi.join(' · ')}
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default ToolGuide;
