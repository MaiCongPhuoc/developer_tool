import DiffTableRow from '@/components/DiffTableRow';
import { headerCellClass } from '@/components/diffStyles';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useAppSelector } from '@/store/hooks';

type FileCompareViewProps = {
  loading: boolean;
  leftLabel: string;
  rightLabel: string;
};

// Giống hệt TextCompareView (dùng chung DiffTableRow để tô màu nhất quán),
// chỉ khác nguồn rows lấy từ state.fileCompare và header hiện tên file thật
// thay vì nhãn cố định "Original/Changed" - giống cách WinMerge hiện tên file
// đang so sánh ở đầu mỗi khung.
const FileCompareView = ({
  loading,
  leftLabel,
  rightLabel,
}: FileCompareViewProps) => {
  const rows = useAppSelector((state) => state.fileCompare.rows);

  return (
    <div className="grid grid-cols-[3rem_1fr_3rem_1fr] min-w-150 font-mono text-sm">
      <span className={headerCellClass} />
      <span
        className={`${headerCellClass} truncate px-2 py-1.5`}
        title={leftLabel}
      >
        {leftLabel}
      </span>
      <span className={headerCellClass} />
      <span
        className={`${headerCellClass} truncate px-2 py-1.5`}
        title={rightLabel}
      >
        {rightLabel}
      </span>
      {loading ? (
        <div className="col-span-4">
          <LoadingIndicator label="Comparing..." />
        </div>
      ) : (
        rows.map((row, index) => <DiffTableRow key={index} row={row} />)
      )}
    </div>
  );
};

export default FileCompareView;
