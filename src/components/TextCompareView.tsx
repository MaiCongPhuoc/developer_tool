import DiffTableRow from '@/components/DiffTableRow';
import { headerCellClass } from '@/components/diffStyles';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useAppSelector } from '@/store/hooks';

// Hiển thị kết quả so sánh dạng 2 khung song song, luôn nằm chung 1 khối
// scroll duy nhất (CSS grid 4 cột) nên 2 bên tự động cuộn đồng bộ theo dòng,
// không cần tự đồng bộ scroll bằng JS. Header (Original/Changed) luôn hiện
// sẵn kể cả khi chưa bấm Compare; trong lúc `loading` (đang chờ kết quả giả
// lập từ useDelayedAction) hiện khung chờ ngay dưới header; rows rỗng và
// không loading thì chỉ có header, chưa có gì bên dưới.
const TextCompareView = ({ loading }: { loading: boolean }) => {
  const rows = useAppSelector((state) => state.textCompare.rows);

  return (
    <div className="grid grid-cols-[3rem_1fr_3rem_1fr] min-w-150 font-mono text-sm">
      <span className={headerCellClass} />
      <span className={`${headerCellClass} px-2 py-1.5`}>Original</span>
      <span className={headerCellClass} />
      <span className={`${headerCellClass} px-2 py-1.5`}>Changed</span>
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

export default TextCompareView;
