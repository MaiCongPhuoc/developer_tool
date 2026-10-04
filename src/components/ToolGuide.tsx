type ToolGuideProps = {
  // Tiêu đề phần hướng dẫn, vd "How to use the JSON Formatter".
  title: string;
  // 1-2 câu giới thiệu: công cụ làm gì, vì sao hữu ích.
  intro: string;
  // Các bước thao tác, theo đúng thứ tự người dùng thực hiện.
  steps: string[];
  // Mẹo/lưu ý thêm (không bắt buộc).
  tips?: string[];
};

// Khung "Hướng dẫn sử dụng" dùng chung cho mọi trang công cụ. Đặt ở CUỐI nội
// dung mỗi trang (bên trong <Outlet/>), nên tự nhiên nằm ngay dưới khu vực
// Input/Output và phía trên ô "Bottom ad" cố định của AppLayout - không đụng
// tới kiến trúc quảng cáo (xem project_ad_architecture).
//
// Chữ này nằm trong HTML được prerender lúc build (scripts/prerender.mjs), nên
// crawler không chạy JavaScript cũng đọc được nội dung hướng dẫn.
const ToolGuide = ({ title, intro, steps, tips }: ToolGuideProps) => {
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
    </section>
  );
};

export default ToolGuide;
