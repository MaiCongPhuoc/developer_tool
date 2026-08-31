import type { CSSProperties } from 'react';
import type { TextDiffRow } from '@/util/interface/Type';

// Class/style dùng chung cho bảng diff (DiffTableRow) và các view bọc nó
// (TextCompareView, FileCompareView) - tách riêng khỏi DiffTableRow.tsx vì
// file chỉ export component mới được Fast Refresh tối ưu đúng cách.

// Màu nền theo loại dòng, giống quy ước phổ biến của các công cụ so sánh text
// (WinMerge, git diff...): đỏ = xoá, xanh lá = thêm, vàng = sửa đổi.
export const rowBg: Record<TextDiffRow['type'], string> = {
  equal: '',
  delete: 'bg-red-100 dark:bg-red-900/30',
  insert: 'bg-green-100 dark:bg-green-900/30',
  replace: 'bg-yellow-100 dark:bg-yellow-900/20',
};

// Nền trung tính + vệt sọc chéo thay cho phần dòng không tồn tại ở 1 bên (khi
// 1 bên bị thêm/xoá nguyên dòng) - giống ô trống gạch chéo của WinMerge, cố
// tình không dùng màu đỏ/xanh của rowBg vì bên này không có nội dung nào cả.
export const emptyBg = 'bg-gray-50 dark:bg-gray-800/40';

export const emptyContentStyle: CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(135deg, rgba(100,116,139,0.18) 0, rgba(100,116,139,0.18) 1px, transparent 1px, transparent 8px)',
};

export const lineNumberClass =
  'shrink-0 select-none px-2 py-0.5 text-right text-gray-400 dark:text-gray-600 border-b border-gray-100 dark:border-gray-800';

export const contentClass =
  'min-w-0 whitespace-pre-wrap break-all px-2 py-0.5 text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800';

export const headerCellClass =
  'sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs font-sans font-medium text-gray-500 dark:text-gray-400';
