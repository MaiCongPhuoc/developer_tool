import { useSidebar } from '@/hook/useSidebar';
import AppSidebar from './AppSidebar';
import { Outlet } from 'react-router';
import AppHeader from './AppHeader';
import Adds from './Adds';

export const AppLayout: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        {/* <Backdrop /> */}
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? 'lg:ml-[290px]' : 'lg:ml-[90px]'
        } ${isMobileOpen ? 'ml-0' : ''}`}
      >
        <AppHeader />
        {/* 3 vị trí quảng cáo đặt cố định ở đây (ngoài <Outlet/>), KHÔNG đặt
            trong từng trang: <Outlet/> bị unmount/mount lại mỗi khi đổi route,
            còn khối bọc AppLayout thì tồn tại xuyên suốt cả phiên dùng app.
            Nhờ vậy quảng cáo chỉ tải lại khi mở app / reload trang thật, chuyển
            qua lại giữa các tool bên trong app không kích hoạt tải lại quảng
            cáo -> tránh bị Google hiểu nhầm là spam lượt xem. */}
        <div className="flex flex-col gap-4 p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          {/* Top ad: từ lg trở lên đã nằm sẵn trong AppHeader (xem
              AppHeader.tsx) nên ẩn khối này đi để khỏi lặp; mobile header
              không đủ chỗ ngang nên vẫn hiện khối full-width ở đây. */}
          <Adds label="Top ad" className="h-20 sm:h-24 w-full lg:hidden" />

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <Outlet />
            </div>

            {/* Cột phải: quảng cáo dạng sidebar, dính (sticky) khi cuộn trên
                màn lớn. Trên mobile không đủ chỗ ngang nên tự rơi xuống dưới. */}
            <div className="w-full lg:w-64 lg:shrink-0">
              <Adds
                label="Side ad"
                className="h-24 lg:h-120 lg:sticky lg:top-24"
              />
            </div>
          </div>

          <Adds label="Bottom ad" className="h-20 sm:h-24 w-full" />
        </div>
      </div>
    </div>
  );
};
