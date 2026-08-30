type LoadingIndicatorProps = {
  label?: string;
};

// Khung chờ dùng chung cho khu vực kết quả của các trang tool, hiện trong
// lúc useDelayedAction đang đếm giờ trước khi trả kết quả thật.
const LoadingIndicator = ({
  label = 'Processing...',
}: LoadingIndicatorProps) => (
  <div className="flex h-full min-h-32 flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-500">
    <span className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
    <p className="text-sm">{label}</p>
  </div>
);

export default LoadingIndicator;
