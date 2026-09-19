// Điền 2 giá trị này SAU KHI trang web đã được Google AdSense duyệt và bạn
// đã tạo 1 ad unit cho ô "Top ad":
// 1. ADSENSE_CLIENT_ID: dạng "ca-pub-XXXXXXXXXXXXXXXX" - lấy trong đoạn code
//    mẫu của ad unit vừa tạo, hoặc ở Account > Settings > Account information.
// 2. ADSENSE_TOP_AD_SLOT_ID: mã riêng của ad unit "Top ad" - lấy khi tạo ad
//    unit ở Ads > By ad unit > Display ads.
//
// Cả 2 giá trị này AN TOÀN để lộ ra trong code phía client - giống Public Key
// của EmailJS (xem contactConfig.ts): mọi trang web dùng AdSense đều có 2 mã
// này hiện thẳng trong mã nguồn, không phải bí mật cần giấu.
//
// Nhớ điền thêm dòng "google.com, pub-..., DIRECT, f08c47fec0942fa0" (cùng
// dãy số sau "ca-pub-" ở trên, bỏ tiền tố "ca-") vào public/ads.txt.
export const ADSENSE_CLIENT_ID = '';
export const ADSENSE_TOP_AD_SLOT_ID = '';

export const isAdsenseConfigured = (): boolean =>
  Boolean(ADSENSE_CLIENT_ID && ADSENSE_TOP_AD_SLOT_ID);
