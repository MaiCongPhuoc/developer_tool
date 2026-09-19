import { useEffect, useRef } from 'react';
import {
  ADSENSE_CLIENT_ID,
  ADSENSE_TOP_AD_SLOT_ID,
  isAdsenseConfigured,
} from '@/util/adsenseConfig';
import Adds from './Adds';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADSENSE_SCRIPT_ID = 'adsbygoogle-script';

// Chèn đúng 1 lần script adsbygoogle.js cho cả trang - kiểm tra id cố định
// trước, tránh chèn trùng nếu component này lỡ mount lại (StrictMode lúc dev
// gọi effect 2 lần) hoặc sau này có thêm ô quảng cáo khác dùng chung script.
const loadAdsenseScript = (clientId: string) => {
  if (document.getElementById(ADSENSE_SCRIPT_ID)) return;
  const script = document.createElement('script');
  script.id = ADSENSE_SCRIPT_ID;
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
};

type GoogleAdUnitProps = {
  className?: string;
};

// Ô "Top ad" thật, gắn Google AdSense (ad unit thủ công, không dùng Auto ads
// - xem plan). Đặt trong AppLayout (thay cho <Adds label="Top ad">) nên
// KHÔNG BAO GIỜ unmount khi chuyển trang trong app, nhờ vậy push({}) chỉ gọi
// đúng 1 lần cho cả phiên duyệt web - tránh lỗi kinh điển của React+AdSense
// "All 'ins' elements ... already have ads in them" do gắn lại quảng cáo mỗi
// lần đổi route (xem project_ad_architecture).
//
// Chưa cấu hình (ADSENSE_CLIENT_ID/ADSENSE_TOP_AD_SLOT_ID còn rỗng) -> hiện
// lại đúng khung placeholder cũ, không gọi mạng, không lỗi console.
const GoogleAdUnit = ({ className = '' }: GoogleAdUnitProps) => {
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!isAdsenseConfigured() || pushedRef.current) return;
    loadAdsenseScript(ADSENSE_CLIENT_ID);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushedRef.current = true;
    } catch {
      // Script AdSense chưa tải kịp hoặc bị chặn (adblock) - bỏ qua, không
      // làm hỏng phần còn lại của trang.
    }
  }, []);

  if (!isAdsenseConfigured()) {
    return <Adds label="Top ad" className={className} />;
  }

  return (
    <ins
      className={`adsbygoogle block ${className}`}
      style={{ display: 'block' }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={ADSENSE_TOP_AD_SLOT_ID}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
};

export default GoogleAdUnit;
