import type {
  TextDiffRow,
  TextDiffStats,
  TextDiffWordOp,
} from '@/util/interface/Type';

// Thuật toán LCS bên dưới có độ phức tạp O(n*m) theo số dòng, nên giới hạn cả
// số dòng mỗi bên lẫn tích của chúng để tránh treo trình duyệt với text quá lớn.
const MAX_LINES_PER_SIDE = 5000;
const MAX_LINE_PAIRS = 4_000_000;

const splitLines = (text: string): string[] => text.split(/\r\n|\r|\n/);

// Tách 1 dòng thành các token (chuỗi chữ/số liền nhau, chuỗi khoảng trắng,
// hoặc từng ký tự khác) để so sánh mức "từ" bên trong 1 dòng bị sửa - nhờ vậy
// chỉ phần thực sự khác nhau được tô đậm thay vì tô nguyên cả dòng.
const tokenize = (line: string): string[] =>
  line.match(/[A-Za-z0-9_]+|\s+|[^\sA-Za-z0-9_]/g) ?? [];

type ArrayDiffOp<T> =
  | { type: 'equal'; aIndex: number; bIndex: number; value: T }
  | { type: 'delete'; aIndex: number; value: T }
  | { type: 'insert'; bIndex: number; value: T };

// LCS (Longest Common Subsequence) tổng quát, dùng chung cho cả so sánh theo
// dòng (2 mảng dòng) lẫn so sánh theo từ bên trong 1 cặp dòng bị sửa (2 mảng
// token). dp dùng mảng phẳng (Uint32Array) thay vì mảng 2 chiều cho nhẹ bộ nhớ.
function diffArrays<T>(a: T[], b: T[]): ArrayDiffOp<T>[] {
  const n = a.length;
  const m = b.length;
  const width = m + 1;
  const dp = new Uint32Array((n + 1) * width);

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * width + j] =
        a[i] === b[j]
          ? dp[(i + 1) * width + (j + 1)] + 1
          : Math.max(dp[(i + 1) * width + j], dp[i * width + (j + 1)]);
    }
  }

  const ops: ArrayDiffOp<T>[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: 'equal', aIndex: i, bIndex: j, value: a[i] });
      i++;
      j++;
    } else if (dp[(i + 1) * width + j] >= dp[i * width + (j + 1)]) {
      ops.push({ type: 'delete', aIndex: i, value: a[i] });
      i++;
    } else {
      ops.push({ type: 'insert', bIndex: j, value: b[j] });
      j++;
    }
  }
  while (i < n) {
    ops.push({ type: 'delete', aIndex: i, value: a[i] });
    i++;
  }
  while (j < m) {
    ops.push({ type: 'insert', bIndex: j, value: b[j] });
    j++;
  }
  return ops;
}

// So 2 dòng đã được xác định là "sửa đổi" (replace) ở mức từ, trả về danh
// sách token kèm loại thay đổi cho mỗi bên để component tô màu riêng phần
// thêm/xoá bên trong dòng.
const diffWords = (
  leftLine: string,
  rightLine: string
): { leftWords: TextDiffWordOp[]; rightWords: TextDiffWordOp[] } => {
  const ops = diffArrays(tokenize(leftLine), tokenize(rightLine));

  const leftWords: TextDiffWordOp[] = [];
  const rightWords: TextDiffWordOp[] = [];
  for (const op of ops) {
    if (op.type === 'equal') {
      leftWords.push({ type: 'equal', value: op.value });
      rightWords.push({ type: 'equal', value: op.value });
    } else if (op.type === 'delete') {
      leftWords.push({ type: 'delete', value: op.value });
    } else {
      rightWords.push({ type: 'insert', value: op.value });
    }
  }
  return { leftWords, rightWords };
};

export interface TextDiffResult {
  rows: TextDiffRow[];
  stats: TextDiffStats;
}

// So sánh 2 đoạn text theo dòng, giống chế độ 2 khung song song của WinMerge:
// - Dòng giống nhau ở cả 2 bên -> 'equal'
// - Các đoạn dòng bị xoá/thêm liên tiếp -> ghép cặp theo thứ tự thành dòng
//   'replace' (sửa đổi) rồi so tiếp ở mức từ; phần dư không ghép được thì giữ
//   nguyên là 'delete' (chỉ có ở bên trái) hoặc 'insert' (chỉ có ở bên phải).
export const compareTexts = (
  leftText: string,
  rightText: string
): TextDiffResult => {
  const leftLines = splitLines(leftText);
  const rightLines = splitLines(rightText);

  if (
    leftLines.length > MAX_LINES_PER_SIDE ||
    rightLines.length > MAX_LINES_PER_SIDE ||
    leftLines.length * rightLines.length > MAX_LINE_PAIRS
  ) {
    throw new Error(
      `Text too large to compare (max ${MAX_LINES_PER_SIDE} lines per side).`
    );
  }

  const ops = diffArrays(leftLines, rightLines);

  const rows: TextDiffRow[] = [];
  const stats: TextDiffStats = {
    equal: 0,
    inserted: 0,
    deleted: 0,
    modified: 0,
  };

  let pendingDeletes: number[] = [];
  let pendingInserts: number[] = [];

  const flushPending = () => {
    const pairCount = Math.min(pendingDeletes.length, pendingInserts.length);

    for (let k = 0; k < pairCount; k++) {
      const li = pendingDeletes[k];
      const ri = pendingInserts[k];
      const { leftWords, rightWords } = diffWords(
        leftLines[li],
        rightLines[ri]
      );
      rows.push({
        type: 'replace',
        leftLine: leftLines[li],
        rightLine: rightLines[ri],
        leftLineNumber: li + 1,
        rightLineNumber: ri + 1,
        leftWords,
        rightWords,
      });
      stats.modified++;
    }
    for (let k = pairCount; k < pendingDeletes.length; k++) {
      const li = pendingDeletes[k];
      rows.push({
        type: 'delete',
        leftLine: leftLines[li],
        rightLine: null,
        leftLineNumber: li + 1,
        rightLineNumber: null,
      });
      stats.deleted++;
    }
    for (let k = pairCount; k < pendingInserts.length; k++) {
      const ri = pendingInserts[k];
      rows.push({
        type: 'insert',
        leftLine: null,
        rightLine: rightLines[ri],
        leftLineNumber: null,
        rightLineNumber: ri + 1,
      });
      stats.inserted++;
    }

    pendingDeletes = [];
    pendingInserts = [];
  };

  for (const op of ops) {
    if (op.type === 'equal') {
      flushPending();
      rows.push({
        type: 'equal',
        leftLine: op.value,
        rightLine: op.value,
        leftLineNumber: op.aIndex + 1,
        rightLineNumber: op.bIndex + 1,
      });
      stats.equal++;
    } else if (op.type === 'delete') {
      pendingDeletes.push(op.aIndex);
    } else {
      pendingInserts.push(op.bIndex);
    }
  }
  flushPending();

  return { rows, stats };
};
