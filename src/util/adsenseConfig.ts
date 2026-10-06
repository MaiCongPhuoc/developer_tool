// Cấu hình quảng cáo Google AdSense. Cách hoạt động - mỗi ô quảng cáo TỰ BẬT khi
// mã của riêng nó có giá trị, ô nào để trống thì ô đó không hiện:
//
//   ADSENSE_CLIENT_ID          - BẮT BUỘC cho mọi ô. Mã publisher của tài khoản
//                                AdSense, dạng "ca-pub-XXXXXXXXXXXXXXXX" (lấy ở
//                                Account > Settings > Account information).
//   ADSENSE_TOP_AD_SLOT_ID     - ô nằm NGANG ĐẦU trang.
//   ADSENSE_SIDE_AD_SLOT_ID    - ô nằm CỘT PHẢI (trên điện thoại rơi xuống dưới).
//   ADSENSE_BOTTOM_AD_SLOT_ID  - ô nằm NGANG CUỐI trang.
//
// Mỗi mã "SLOT" là dãy số của 1 ad unit - tạo ở AdSense: Ads > By ad unit >
// Display ads, tạo mỗi vị trí 1 ad unit riêng rồi chép dãy số trong
// data-ad-slot của đoạn mã mẫu. Có ADSENSE_CLIENT_ID nhưng ô nào chưa có mã
// SLOT thì ô đó không hiện (không dùng chung mã của ô khác).
//
// Các mã này AN TOÀN để lộ ra trong code phía client - giống Public Key của
// EmailJS (xem contactConfig.ts): mọi trang web dùng AdSense đều có chúng hiện
// thẳng trong mã nguồn, không phải bí mật cần giấu.
//
// Nhớ điền thêm dòng "google.com, pub-..., DIRECT, f08c47fec0942fa0" (cùng
// dãy số sau "ca-pub-" ở trên, bỏ tiền tố "ca-") vào public/ads.txt.
export const ADSENSE_CLIENT_ID = '';
export const ADSENSE_TOP_AD_SLOT_ID = '';
export const ADSENSE_SIDE_AD_SLOT_ID = '';
export const ADSENSE_BOTTOM_AD_SLOT_ID = '';

export type AdPosition = 'top' | 'side' | 'bottom';

const AD_SLOT_IDS: Record<AdPosition, string> = {
  top: ADSENSE_TOP_AD_SLOT_ID,
  side: ADSENSE_SIDE_AD_SLOT_ID,
  bottom: ADSENSE_BOTTOM_AD_SLOT_ID,
};

// Mã ad unit của 1 vị trí ('' nếu chưa điền).
export const getAdSlotId = (position: AdPosition): string =>
  AD_SLOT_IDS[position];

// Ô ở vị trí này đã đủ mã để hiện quảng cáo thật chưa: cần ADSENSE_CLIENT_ID
// VÀ mã SLOT của đúng vị trí đó.
export const isAdSlotConfigured = (position: AdPosition): boolean =>
  Boolean(ADSENSE_CLIENT_ID && AD_SLOT_IDS[position]);

// Hiện khung quảng cáo GIẢ (khung nét đứt ghi "Top ad", "Side ad", "Bottom ad")
// cho các ô CHƯA có mã - chỉ để xem trước bố cục lúc phát triển. Để false khi
// chạy thật: khách và người xét duyệt AdSense sẽ không thấy các ô trống trông
// như trang chưa hoàn thiện, và nội dung chiếm trọn chiều rộng.
export const SHOW_AD_PLACEHOLDERS = false;

// Ô ở vị trí này có được vẽ ra không: đã đủ mã, hoặc đang bật xem trước bằng
// khung giả.
export const isAdSlotShown = (position: AdPosition): boolean =>
  isAdSlotConfigured(position) || SHOW_AD_PLACEHOLDERS;

// Các trang KHÔNG được hiện quảng cáo. Chính sách AdSense (Publisher Policies)
// cấm quảng cáo trên màn hình không có nội dung, trang "dead end" như trang
// lỗi, trang cảm ơn... nên ngoài danh sách này, mọi route KHÔNG có trong
// routeMeta (tức trang 404) cũng tự được coi là không có quảng cáo - xem
// AppLayout.tsx. Trang Privacy Policy là trang pháp lý, không phải trang công
// cụ nên cũng bỏ quảng cáo cho an toàn.
export const AD_FREE_PATHS: ReadonlySet<string> = new Set(['/privacy-policy']);
