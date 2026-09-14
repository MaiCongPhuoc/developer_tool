import { useEffect, useRef, useState } from 'react';
import { ChatIcon, CloseIcon } from '@/icons';
import { CONTACT_MESSAGE_MAX_LENGTH, sendContactMessage } from '@/util/contact';

type SendStatus = 'idle' | 'sending' | 'sent' | 'error';

// Component nổi cố định ở góc dưới-phải màn hình (position: fixed, không
// nằm trong luồng cuộn trang nên luôn đứng yên tại 1 chỗ dù trang cuộn lên
// hay xuống) - đặt trong AppLayout (ngoài <Outlet/>) để xuất hiện ở MỌI
// trang, không phải khai báo lại ở từng trang riêng lẻ, giống cách quảng cáo
// (Adds) đã làm - xem project_ad_architecture.
//
// State (isOpen/message/status) để LOCAL (useState), KHÔNG đưa vào Redux
// như các trang tool khác: khác với 1 trang tool (mount/unmount theo route,
// cần Redux để "nhớ" xuyên suốt phiên rồi tự xoá khi vào lại), component này
// sống trong AppLayout - vốn KHÔNG BAO GIỜ unmount khi chuyển route trong app
// (xem project_ad_architecture) - nên tự nó đã giữ nguyên trạng thái xuyên
// suốt phiên làm việc mà không cần Redux, và cũng không có component nào
// khác cần đọc/ghi chung state này.
const ContactWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<SendStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus sẵn vào ô nhập khi vừa mở panel - tiện gõ ngay, khỏi bấm chuột
  // thêm 1 lần nữa vào đúng ô đó.
  useEffect(() => {
    if (isOpen && status !== 'sent') textareaRef.current?.focus();
  }, [isOpen, status]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSendAnother = () => {
    setStatus('idle');
    setError(null);
  };

  const handleSend = async () => {
    if (!message.trim() || status === 'sending') return;
    setStatus('sending');
    setError(null);
    try {
      await sendContactMessage(message);
      setMessage('');
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Could not send your message. Please try again later.');
    }
  };

  const isSending = status === 'sending';
  const remaining = CONTACT_MESSAGE_MAX_LENGTH - message.length;

  return (
    <>
      {isOpen && (
        <div
          role="dialog"
          aria-label="Send feedback"
          className="fixed bottom-20 right-4 z-[9999] flex w-[calc(100vw-2rem)] max-w-80 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 sm:bottom-24 sm:right-6"
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-800 dark:text-white">Send feedback</p>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-2 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Want a new tool, or found something to fix? Let me know below.
            </p>

            {status === 'sent' ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Thanks! Your message has been sent.
                </p>
                <button
                  type="button"
                  onClick={handleSendAnother}
                  className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={CONTACT_MESSAGE_MAX_LENGTH}
                  placeholder="Type your message here..."
                  rows={5}
                  disabled={isSending}
                  className="w-full resize-none rounded-lg border border-gray-300 p-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
                />
                <p className="text-right text-[11px] text-gray-400 dark:text-gray-500">
                  {remaining} characters left
                </p>

                {error && (
                  <div className="rounded-lg bg-red-100 p-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending || !message.trim()}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleToggle}
        aria-label={isOpen ? 'Close feedback form' : 'Send feedback'}
        className="fixed bottom-4 right-4 z-[9999] flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 sm:bottom-6 sm:right-6"
      >
        {isOpen ? <CloseIcon className="h-5 w-5" /> : <ChatIcon className="h-6 w-6" />}
      </button>
    </>
  );
};

export default ContactWidget;
