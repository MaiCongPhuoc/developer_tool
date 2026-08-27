type AddsProps = {
  label?: string;
  className?: string;
};

// Component quảng cáo dùng chung. `label` và `className` cho phép mỗi vị trí
// (đầu trang, cuối trang, cột phải...) tự set nội dung/kích thước riêng
// mà không phải tạo nhiều component trùng lặp.
const Adds = ({ label = 'Quảng cáo', className = '' }: AddsProps) => {
  return (
    <div
      className={`flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-3 text-center text-xs font-medium uppercase tracking-wide text-gray-400 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-500 ${className}`}
    >
      {label}
    </div>
  );
};

export default Adds;
