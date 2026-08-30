import type { CSSProperties } from 'react';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useAppSelector } from '@/store/hooks';
import type { TextDiffRow, TextDiffWordOp } from '@/util/interface/Type';

// Màu nền theo loại dòng, giống quy ước phổ biến của các công cụ so sánh text
// (WinMerge, git diff...): đỏ = xoá, xanh lá = thêm, vàng = sửa đổi.
const rowBg: Record<TextDiffRow['type'], string> = {
  equal: '',
  delete: 'bg-red-100 dark:bg-red-900/30',
  insert: 'bg-green-100 dark:bg-green-900/30',
  replace: 'bg-yellow-100 dark:bg-yellow-900/20',
};

// Nền trung tính + vệt sọc chéo thay cho phần dòng không tồn tại ở 1 bên (khi
// 1 bên bị thêm/xoá nguyên dòng) - giống ô trống gạch chéo của WinMerge, cố
// tình không dùng màu đỏ/xanh của rowBg vì bên này không có nội dung nào cả.
const emptyBg = 'bg-gray-50 dark:bg-gray-800/40';

const emptyContentStyle: CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(135deg, rgba(100,116,139,0.18) 0, rgba(100,116,139,0.18) 1px, transparent 1px, transparent 8px)',
};

const lineNumberClass =
  'shrink-0 select-none px-2 py-0.5 text-right text-gray-400 dark:text-gray-600 border-b border-gray-100 dark:border-gray-800';

const contentClass =
  'min-w-0 whitespace-pre-wrap break-all px-2 py-0.5 text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800';

const headerCellClass =
  'sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs font-sans font-medium text-gray-500 dark:text-gray-400';

// Tô từng token theo loại thay đổi - chỉ token thực sự khác nhau mới có nền
// đậm hơn nền chung của dòng, phần còn lại giữ nguyên để dễ đọc.
const WordSpans = ({ words }: { words: TextDiffWordOp[] }) => (
  <>
    {words.map((word, index) => (
      <span
        key={index}
        className={
          word.type === 'delete'
            ? 'rounded-sm bg-red-300/70 dark:bg-red-700/60'
            : word.type === 'insert'
              ? 'rounded-sm bg-green-300/70 dark:bg-green-700/60'
              : ''
        }
      >
        {word.value}
      </span>
    ))}
  </>
);

const DiffRow = ({ row }: { row: TextDiffRow }) => {
  const isLeftEmpty = row.leftLine === null;
  const isRightEmpty = row.rightLine === null;

  return (
    <>
      <div
        className={`${lineNumberClass} ${isLeftEmpty ? emptyBg : rowBg[row.type]}`}
      >
        {row.leftLineNumber ?? ''}
      </div>
      <div
        className={`${contentClass} ${isLeftEmpty ? emptyBg : rowBg[row.type]}`}
        style={isLeftEmpty ? emptyContentStyle : undefined}
      >
        {row.leftWords ? <WordSpans words={row.leftWords} /> : row.leftLine}
      </div>
      <div
        className={`${lineNumberClass} ${isRightEmpty ? emptyBg : rowBg[row.type]}`}
      >
        {row.rightLineNumber ?? ''}
      </div>
      <div
        className={`${contentClass} ${isRightEmpty ? emptyBg : rowBg[row.type]}`}
        style={isRightEmpty ? emptyContentStyle : undefined}
      >
        {row.rightWords ? (
          <WordSpans words={row.rightWords} />
        ) : (
          row.rightLine
        )}
      </div>
    </>
  );
};

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
        rows.map((row, index) => <DiffRow key={index} row={row} />)
      )}
    </div>
  );
};

export default TextCompareView;
