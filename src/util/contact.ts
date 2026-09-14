import emailjs from '@emailjs/browser';
import { EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID } from '@/util/contactConfig';

// Đủ dài cho 1 góp ý/yêu cầu chi tiết nhưng vẫn chặn được việc gửi 1 khối
// văn bản khổng lồ (vô tình dán nhầm cả file, hoặc spam) - EmailJS free tier
// cũng có giới hạn dung lượng mỗi email, chặn sớm từ phía client tốt hơn để
// người dùng biết ngay thay vì chờ email service từ chối.
export const CONTACT_MESSAGE_MAX_LENGTH = 2000;

// Chưa điền đủ 3 giá trị cấu hình (xem util/contactConfig.ts) - coi như tính
// năng chưa sẵn sàng, để component tự hiện thông báo phù hợp thay vì gọi
// EmailJS với giá trị rỗng (chắc chắn lỗi, nhưng thông báo lỗi trả về từ họ
// sẽ khó hiểu hơn hẳn tự kiểm tra trước ở đây).
export const isContactConfigured = (): boolean =>
  Boolean(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);

export const sendContactMessage = async (message: string): Promise<void> => {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error('Please enter a message before sending.');
  }
  if (trimmed.length > CONTACT_MESSAGE_MAX_LENGTH) {
    throw new Error(`Message is too long (max ${CONTACT_MESSAGE_MAX_LENGTH} characters).`);
  }
  if (!isContactConfigured()) {
    throw new Error('The contact form is not set up yet. Please try again later.');
  }

  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      { message: trimmed },
      { publicKey: EMAILJS_PUBLIC_KEY }
    );
  } catch (err) {
    // Lỗi từ EmailJS thường có dạng { status, text } (xem EmailJSResponseStatus
    // của @emailjs/browser) thay vì 1 Error thường - text mới là thông điệp
    // hữu ích, message thường chỉ là "[object Object]" nếu ép qua String().
    const text =
      err && typeof err === 'object' && 'text' in err && typeof err.text === 'string'
        ? err.text
        : null;
    throw new Error(text || (err instanceof Error ? err.message : 'Could not send your message. Please try again later.'));
  }
};
