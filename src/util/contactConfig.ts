// Điền 3 giá trị này SAU KHI hoàn tất đăng ký EmailJS (xem hướng dẫn đi kèm
// khi bàn giao tính năng "Liên hệ / Góp ý"):
// 1. EMAILJS_SERVICE_ID: lấy ở mục "Email Services" sau khi kết nối Gmail.
// 2. EMAILJS_TEMPLATE_ID: lấy ở mục "Email Templates" sau khi tạo mẫu email.
// 3. EMAILJS_PUBLIC_KEY: lấy ở mục "Account" > "General".
//
// Public Key AN TOÀN để lộ ra trong code phía client - EmailJS thiết kế để
// dùng công khai như vậy (giống API key công khai của Firebase/Google Maps),
// tự bảo vệ khỏi bị lạm dụng bằng cách giới hạn DOMAIN được phép gửi trong
// "Account" > "Security" trên dashboard EmailJS (nên thêm đúng domain của
// trang này vào đó sau khi triển khai thật). Service ID/Template ID cũng chỉ
// là định danh, không phải bí mật cần giấu.
export const EMAILJS_SERVICE_ID = 'service_1494a8h';
export const EMAILJS_TEMPLATE_ID = 'template_f182ap5';
export const EMAILJS_PUBLIC_KEY = 'YLRfxFsQ2FUO9fG-1';
