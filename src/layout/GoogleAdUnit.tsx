import { useEffect, useRef } from 'react';
import {
  ADSENSE_CLIENT_ID,
  getAdSlotId,
  isAdSlotConfigured,
  SHOW_AD_PLACEHOLDERS,
  type AdPosition,
} from '@/util/adsenseConfig';
import Adds from './Adds';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADSENSE_SCRIPT_ID = 'adsbygoogle-script';

// Chèn đúng 1 lần script adsbygoogle.js cho cả trang - kiểm tra id cố định
// trước, nên 3 ô quảng cáo (trên/phải/dưới) dùng chung 1 script, và cũng không
// chèn trùng nếu component lỡ mount lại (StrictMode lúc dev gọi effect 2 lần).
const loadAdsenseScript = (clientId: string) => {
  if (document.getElementById(ADSENSE_SCRIPT_ID)) return;
  const script = document.createElement('script');
  script.id = ADSENSE_SCRIPT_ID;
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
};

const PLACEHOLDER_LABEL: Record<AdPosition, string> = {
  top: 'Top ad',
  side: 'Side ad',
  bottom: 'Bottom ad',
};

type GoogleAdUnitProps = {
  // Vị trí của ô quảng cáo - quyết định mã ad unit riêng của ô này (xem
  // getAdSlotId) và chữ trên khung giả.
  position?: AdPosition;
  className?: string;
  // false = ẩn ô quảng cáo (vd trang 404, Privacy Policy). Mặc định true.
  enabled?: boolean;
};

// Ô quảng cáo Google AdSense (ad unit thủ công, không dùng Auto ads - xem
// plan), dùng cho cả 3 vị trí. Được đặt trong AppLayout nên KHÔNG BAO GIỜ
// unmount khi chuyển trang trong app, nhờ vậy push({}) chỉ gọi đúng 1 lần cho
// mỗi ô trong cả phiên duyệt web - tránh lỗi kinh điển của React+AdSense "All
// 'ins' elements ... already have ads in them" do gắn lại quảng cáo mỗi lần
// đổi route (xem project_ad_architecture).
//
// Mỗi ô tự bật khi ADSENSE_CLIENT_ID VÀ mã SLOT của đúng vị trí này đều có giá
// trị (xem adsenseConfig.ts). Thiếu mã -> ô này không hiện gì (hoặc khung giả
// nếu SHOW_AD_PLACEHOLDERS = true), không gọi mạng, không lỗi console.
const GoogleAdUnit = ({
  position = 'top',
  className = '',
  enabled = true,
}: GoogleAdUnitProps) => {
  const pushedRef = useRef(false);

  // `enabled` = trang hiện tại được phép hiện quảng cáo (xem AD_FREE_PATHS).
  // Chỉ nạp/đẩy quảng cáo lần ĐẦU khi đang ở 1 trang được phép - nếu người
  // dùng vào thẳng trang 404/Privacy Policy thì chưa gọi gì cả, tới khi họ
  // sang 1 trang công cụ mới nạp. Sau khi đã nạp (pushedRef), ô quảng cáo vẫn
  // luôn nằm trong cây React (không unmount), chỉ bị ẩn bằng CSS trên các
  // trang không được phép, nên quay lại trang công cụ không phải push() lại.
  useEffect(() => {
    if (!enabled || !isAdSlotConfigured(position) || pushedRef.current) return;
    loadAdsenseScript(ADSENSE_CLIENT_ID);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushedRef.current = true;
    } catch {
      // Script AdSense chưa tải kịp hoặc bị chặn (adblock) - bỏ qua, không
      // làm hỏng phần còn lại của trang.
    }
  }, [enabled, position]);

  if (!isAdSlotConfigured(position)) {
    return SHOW_AD_PLACEHOLDERS && enabled ? (
      <Adds label={PLACEHOLDER_LABEL[position]} className={className} />
    ) : null;
  }

  // Ẩn bằng display:none ngay trên <ins> (không bọc thêm 1 thẻ cha) để class
  // dính cuộn (lg:sticky) của ô bên phải vẫn tính theo cột chứa nó.
  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{ display: enabled ? 'block' : 'none' }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={getAdSlotId(position)}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
};

export default GoogleAdUnit;
