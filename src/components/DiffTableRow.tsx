import {
  contentClass,
  emptyBg,
  emptyContentStyle,
  lineNumberClass,
  rowBg,
} from '@/components/diffStyles';
import type { TextDiffRow, TextDiffWordOp } from '@/util/interface/Type';

// Tách riêng từ TextCompareView để Text Compare và File Compare (so sánh nội
// dung file .txt/.csv) dùng chung đúng 1 bộ màu/kiểu tô - tránh 2 nơi tô lệch
// nhau nếu chỉ sửa 1 chỗ.

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

const DiffTableRow = ({ row }: { row: TextDiffRow }) => {
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

export default DiffTableRow;
