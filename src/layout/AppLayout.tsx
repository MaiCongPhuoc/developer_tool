import { useSidebar } from '@/hook/useSidebar';
import AppSidebar from './AppSidebar';
import { Link, Outlet, useLocation } from 'react-router';
import AppHeader from './AppHeader';
import GoogleAdUnit from './GoogleAdUnit';
import ContactWidget from './ContactWidget';
import PageSeo from '@/seo/PageSeo';
import { routeMeta } from '@/seo/routeMeta';
import { AD_FREE_PATHS, isAdSlotShown } from '@/util/adsenseConfig';

export const AppLayout: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen, closeMobileSidebar } =
    useSidebar();
  const { pathname } = useLocation();
  // Quảng cáo chỉ hiện trên trang công cụ có nội dung: ẩn ở trang không có
  // trong routeMeta (404) và ở AD_FREE_PATHS (Privacy Policy) - chính sách
  // AdSense cấm quảng cáo trên trang lỗi/trang cụt. Xem adsenseConfig.ts.
  const isAdPage = pathname in routeMeta && !AD_FREE_PATHS.has(pathname);
  return (
    <div className="min-h-screen xl:flex">
      <PageSeo />
      <div>
        <AppSidebar />
        {/* Lớp nền mờ phía sau menu trên di động: chạm ra ngoài menu để đóng.
            z-40 < z-50 của menu nên nằm dưới menu nhưng trên nội dung trang. */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden"
            onClick={closeMobileSidebar}
            aria-hidden="true"
          />
        )}
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? 'lg:ml-[290px]' : 'lg:ml-[90px]'
        } ${isMobileOpen ? 'ml-0' : ''}`}
      >
        <AppHeader />
        {/* pb-24 trên di động: chừa chỗ cho nút chat nổi (fixed, góc dưới
            phải) để khi cuộn tới cuối trang nó không che chân trang/quảng cáo. */}
        <div className="flex flex-col gap-4 p-4 pb-24 md:p-6 md:pb-6">
          <GoogleAdUnit
            position="top"
            className="h-20 sm:h-24 w-full"
            enabled={isAdPage}
          />

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <Outlet />
            </div>

            {/* Cột phải: quảng cáo dạng sidebar, dính (sticky) khi cuộn trên
                màn lớn. Trên mobile không đủ chỗ ngang nên tự rơi xuống dưới.
                Cả cột chỉ được render khi ô phải đã có mã (ADSENSE_SIDE_AD_SLOT_ID,
                hoặc bật khung giả xem trước) - xem isAdSlotShown trong
                adsenseConfig.ts; nếu không, cột trống vẫn chiếm 256px bên phải
                dù không có gì trong đó. Cột luôn nằm trong cây React (không unmount khi đổi
                trang), chỉ ẩn trên trang không được phép hiện quảng cáo. */}
            {isAdSlotShown('side') && (
              <div
                className={isAdPage ? 'w-full lg:w-64 lg:shrink-0' : 'hidden'}
              >
                <GoogleAdUnit
                  position="side"
                  className="h-24 lg:h-120 lg:sticky lg:top-24"
                  enabled={isAdPage}
                />
              </div>
            )}
          </div>

          <GoogleAdUnit
            position="bottom"
            className="h-20 sm:h-24 w-full"
            enabled={isAdPage}
          />

          <footer className="border-t border-gray-200 pt-4 text-center text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
            <Link to="/privacy-policy" className="hover:underline">
              Privacy Policy
            </Link>
          </footer>
        </div>
      </div>

      <ContactWidget />
    </div>
  );
};
