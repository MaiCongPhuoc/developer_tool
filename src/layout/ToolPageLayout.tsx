import type { ReactNode } from 'react';
import Adds from '@/layout/Adds';

type ToolPageLayoutProps = {
  title: string;
  children: ReactNode;
};

// Khung dùng chung cho các trang tool (JSON Formatter, và các tool sau này).
// Mỗi trang tự bọc nội dung riêng của nó bằng component này thay vì đăng ký
// làm layout route dùng chung — nhờ đó khi chuyển sang tool khác, React sẽ
// unmount/mount lại toàn bộ khối này (kể cả quảng cáo bên trong) đúng theo
// từng lượt điều hướng thật của người dùng.
const ToolPageLayout = ({ title, children }: ToolPageLayoutProps) => {
  return (
    <div className="space-y-4">
      {/* Quảng cáo đầu trang */}
      <Adds label="Quảng cáo đầu trang" className="h-20 sm:h-24 w-full" />

      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
        {title}
      </h1>

      {/* Nội dung chính (trái) + cột quảng cáo (phải) */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Cột trái: nội dung riêng của từng tool, bọc trong 1 "card"
            (nền + viền + bóng đổ) để tách rõ khỏi nền trang */}
        <div className="flex-1 min-w-0">
          <div className="space-y-4 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
            {children}
          </div>
        </div>

        {/* Cột phải: quảng cáo dạng sidebar, dính (sticky) khi cuộn trên màn lớn.
            Trên mobile không đủ chỗ ngang nên tự rơi xuống dưới nội dung chính. */}
        <div className="w-full lg:w-64 lg:shrink-0">
          <Adds
            label="Quảng cáo bên phải"
            className="h-24 lg:h-120 lg:sticky lg:top-24"
          />
        </div>
      </div>

      {/* Quảng cáo cuối trang */}
      <Adds label="Quảng cáo cuối trang" className="h-20 sm:h-24 w-full" />
    </div>
  );
};

export default ToolPageLayout;
