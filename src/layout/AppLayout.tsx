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
        <div className="flex flex-col gap-4 p-4 md:p-6">
          <Adds label="Top ad" className="h-20 sm:h-24 w-full" />

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
