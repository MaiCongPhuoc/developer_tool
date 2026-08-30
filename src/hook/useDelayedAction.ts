import { useCallback, useEffect, useRef, useState } from 'react';

// Thời gian "xử lý" giả lập trước khi trả kết quả - áp dụng cho mọi trang
// tool trong app để người dùng ở lại trang đủ lâu (thấy quảng cáo) thay vì
// nhận kết quả ngay lập tức rồi rời trang.
const RESULT_DELAY_MS = 2000;

// Bọc 1 hành động (thường là dispatch action Redux tính kết quả) để nó chỉ
// thực sự chạy sau `delayMs`, đồng thời cung cấp `loading` để component hiện
// khung chờ trong lúc đó. `cancel` dùng khi người dùng bấm Clear hoặc đổi chế
// độ trong lúc đang chờ - huỷ tác vụ đang chờ, tránh nó chạy đè lên state mới.
export const useDelayedAction = (delayMs: number = RESULT_DELAY_MS) => {
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setLoading(false);
  }, []);

  const run = useCallback(
    (action: () => void) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setLoading(true);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        setLoading(false);
        action();
      }, delayMs);
    },
    [delayMs]
  );

  // Huỷ timeout đang chờ khi component unmount (vd chuyển sang trang khác)
  // để không dispatch/setState sau khi đã unmount.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { loading, run, cancel };
};
