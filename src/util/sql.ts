// Định dạng lại 1 câu lệnh SQL cho dễ đọc (kiểu MySQL): từ khoá viết HOA,
// mỗi mệnh đề chính (SELECT/FROM/WHERE/JOIN...) xuống dòng riêng, các điều
// kiện AND/OR và danh sách cột (phân tách bởi dấu phẩy) được thụt lề.
//
// Khác với JSON/XML, SQL không có cấu trúc cây rõ ràng để parse thành AST
// đầy đủ (rất phức tạp) - nên ở đây dùng cách đơn giản hơn nhưng vẫn cho kết
// quả đẹp với các câu lệnh phổ biến: tách chuỗi thành các "token" (từ khoá,
// tên bảng/cột, chuỗi, số, dấu câu...), rồi duyệt qua từng token và quyết
// định khi nào xuống dòng/thụt lề dựa theo loại token. Mỗi loại token có 1
// hàm xử lý riêng (handleXxx) để logic tổng của prettifySql không bị phình to.

type SqlTokenType = 'word' | 'string' | 'number' | 'comment' | 'punct';

type SqlToken = { text: string; type: SqlTokenType };

// Các hàm tổng hợp/window function - tô màu riêng (khác màu với từ khoá mệnh
// đề) khi hiển thị để dễ phân biệt "hành động" với "cấu trúc câu lệnh".
const FUNCTION_KEYWORDS = new Set([
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
  'OVER', 'PARTITION', 'ROWS', 'RANGE', 'PRECEDING', 'FOLLOWING', 'UNBOUNDED',
  'CURRENT', 'ROW', 'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'NTILE', 'LAG',
  'LEAD', 'FIRST_VALUE', 'LAST_VALUE', 'COALESCE',
]);

// Từ khoá sẽ được viết HOA khi in ra, tên bảng/cột/alias thì giữ nguyên như
// người dùng đã nhập.
const KEYWORDS = new Set([
  'SELECT', 'DISTINCT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'NULL', 'IS',
  'IN', 'LIKE', 'BETWEEN', 'AS', 'ON', 'JOIN', 'INNER', 'LEFT', 'RIGHT',
  'FULL', 'OUTER', 'CROSS', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT',
  'OFFSET', 'ASC', 'DESC', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET',
  'DELETE', 'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX', 'VIEW', 'PRIMARY',
  'KEY', 'FOREIGN', 'REFERENCES', 'DEFAULT', 'UNIQUE', 'CHECK', 'CONSTRAINT',
  'UNION', 'ALL', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'TOP', 'RETURNING', 'WITH', 'RECURSIVE',
  'TRUE', 'FALSE', 'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION',
  ...FUNCTION_KEYWORDS,
]);

// Cụm nhiều từ luôn đi liền nhau nên gộp thành 1 token logic trước khi xử lý
// xuống dòng (không thể để "GROUP" xuống dòng tách khỏi "BY"). Liệt kê cụm
// dài trước để khớp đúng trước khi thử cụm ngắn hơn.
const MULTI_WORD_KEYWORDS = [
  'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN',
  'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN',
  'GROUP BY', 'ORDER BY', 'INSERT INTO', 'DELETE FROM', 'UNION ALL',
];

// Từ khoá luôn bắt đầu 1 dòng mới, thụt lề về mốc gốc của mệnh đề hiện tại
const TOP_LEVEL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT',
  'OFFSET', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
  'UNION', 'UNION ALL', 'RETURNING',
]);

const JOIN_KEYWORDS = new Set([
  'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN',
  'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN',
]);

// Các từ mà sau nó, dấu "(" cần có khoảng trắng phía trước (mở ngoặc cho 1
// nhóm điều kiện/danh sách giá trị). Còn lại mặc định "(" dính liền vào phía
// trước (kiểu gọi hàm: COUNT(id), SUM(price)...).
const SPACE_BEFORE_PAREN_WORDS = new Set(['IN', 'EXISTS', 'VALUES', 'AND', 'OR', 'NOT', 'OVER', 'AS']);

// Các dấu câu "dính" vào token đứng trước, không có khoảng trắng phía trước
const HUGS_PREVIOUS = new Set([')', ',', ';', '.']);

// "u" (unicode) để [\p{L}...] nhận diện được chữ cái có dấu (tiếng Việt...),
// không thì mỗi ký tự có dấu sẽ bị tách thành 1 token riêng lẻ (xấu, sai).
// Từ khoá 1 dòng: "--" và "#" là 2 kiểu comment chuẩn của MySQL; "//" không
// phải cú pháp MySQL thật nhưng vẫn chấp nhận cho khoan dung (nhiều người
// quen viết comment kiểu C/Java sẽ gõ nhầm).
const TOKEN_REGEX =
  /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`|--[^\n]*|#[^\n]*|\/\/[^\n]*|\/\*[\s\S]*?\*\/|\d+\.\d+|\d+|[\p{L}_][\p{L}\p{N}_$\p{M}]*|<=|>=|<>|!=|\|\||[(),;.]|\S/gu;

// Comment 1 dòng ("--", "#", "//") ăn hết phần còn lại tới "\n" - khác với
// comment khối "/* */" vốn có dấu đóng riêng nên không bao giờ "ăn lố".
const isLineCommentText = (text: string): boolean =>
  text.startsWith('--') || text.startsWith('#') || text.startsWith('//');

const classify = (text: string): SqlTokenType => {
  const first = text[0];
  if (first === "'" || first === '"' || first === '`') return 'string';
  if (isLineCommentText(text) || text.startsWith('/*')) return 'comment';
  if (/^\d/.test(text)) return 'number';
  if (/^[\p{L}_]/u.test(text)) return 'word';
  return 'punct';
};

const tokenize = (sql: string): SqlToken[] =>
  (sql.match(TOKEN_REGEX) ?? []).map((text) => ({ text, type: classify(text) }));

// Gộp các cụm nhiều từ trong MULTI_WORD_KEYWORDS thành 1 token duy nhất
const mergeKeywordPhrases = (tokens: SqlToken[]): SqlToken[] => {
  const merged: SqlToken[] = [];
  let i = 0;

  tokenLoop: while (i < tokens.length) {
    for (const phrase of MULTI_WORD_KEYWORDS) {
      const words = phrase.split(' ');
      const slice = tokens.slice(i, i + words.length);
      const matches =
        slice.length === words.length &&
        slice.every((t, idx) => t.type === 'word' && t.text.toUpperCase() === words[idx]);

      if (matches) {
        merged.push({ text: phrase, type: 'word' });
        i += words.length;
        continue tokenLoop;
      }
    }

    merged.push(tokens[i]);
    i += 1;
  }

  return merged;
};

// "--" là comment 1 dòng, đúng chuẩn SQL nó ăn hết phần còn lại tới khi gặp
// ký tự xuống dòng thật ("\n"). Nếu người dùng dán cả câu lệnh dài trên 1
// dòng duy nhất (vd copy từ nơi khác làm mất hết dấu xuống dòng), thì 1
// comment "--" ở giữa câu có thể lỡ nuốt luôn toàn bộ phần code phía sau nó
// -> parse sai/không format được gì cả.
//
// Dấu hiệu để nhận ra đúng tình huống này (khác với 1 comment bình thường,
// ngắn, kết thúc đúng ở dấu xuống dòng thật): nó luôn là token CUỐI CÙNG sau
// khi tokenize xong, vì tokenize chỉ dừng lại giữa chừng khi gặp "\n" - nếu
// dừng ở đó thì các token phía sau vẫn được tách bình thường và comment sẽ
// không phải token cuối. Khi phát hiện, tìm vị trí "SELECT" (hoặc "(SELECT")
// gần nhất bên trong nó - dấu hiệu 1 subquery/CTE thực sự bắt đầu - để cắt
// phần "chú thích" lại đúng chỗ và parse tiếp phần còn lại như code.
const COMMENT_CODE_BOUNDARY = /\(\s*select\b|\bselect\b/i;

const rescueOverreachingLineComment = (tokens: SqlToken[]): SqlToken[] => {
  const last = tokens[tokens.length - 1];
  if (!last || last.type !== 'comment' || !isLineCommentText(last.text)) {
    return tokens;
  }

  const match = COMMENT_CODE_BOUNDARY.exec(last.text);
  if (!match) return tokens;

  const commentText = last.text.slice(0, match.index).replace(/\s+$/, '');
  const codeText = last.text.slice(match.index);

  return [
    ...tokens.slice(0, -1),
    { text: commentText, type: 'comment' as const },
    ...rescueOverreachingLineComment(tokenize(codeText)),
  ];
};

const isIndentOnly = (line: string): boolean => line.trim() === '';

// Ngữ cảnh (state) dùng chung xuyên suốt quá trình duyệt token: dòng đang
// build, mốc thụt lề hiện tại, và các "ngăn xếp" để nhớ lại thụt lề trước đó
// khi thoát khỏi 1 subquery ("(...)") hay 1 khối CASE...END.
type FormatContext = {
  lines: string[];
  currentLine: string;
  indent: number;
  parenDepth: number;
  // parenDepth tại thời điểm mệnh đề hiện tại (SELECT/WHERE/JOIN...) bắt đầu
  // - so sánh với parenDepth lúc gặp dấu phẩy/AND/OR để biết chúng thuộc
  // mệnh đề hiện tại (cần xuống dòng) hay nằm sâu trong 1 hàm/nhóm điều kiện
  clauseParenDepth: number;
  parenStack: { isSubquery: boolean; savedIndent: number; savedClauseParenDepth: number }[];
  caseStack: number[];
};

const createContext = (): FormatContext => ({
  lines: [],
  currentLine: '',
  indent: 0,
  parenDepth: 0,
  clauseParenDepth: 0,
  parenStack: [],
  caseStack: [],
});

const newLine = (ctx: FormatContext, nextIndent: number) => {
  ctx.lines.push(ctx.currentLine.replace(/\s+$/, ''));
  ctx.currentLine = '  '.repeat(nextIndent);
};

const appendToken = (ctx: FormatContext, text: string) => {
  if (isIndentOnly(ctx.currentLine)) {
    ctx.currentLine += text;
    return;
  }
  const lastChar = ctx.currentLine[ctx.currentLine.length - 1];
  if (HUGS_PREVIOUS.has(text) || lastChar === '(' || lastChar === '.') {
    ctx.currentLine += text;
  } else {
    ctx.currentLine += ` ${text}`;
  }
};

// Quyết định "(" có cần khoảng trắng phía trước không: có nếu nó mở 1 nhóm
// điều kiện/danh sách giá trị (vd "IN (", "AS (", "users (" ngay sau INSERT
// INTO) hoặc đứng sau 1 toán tử (vd "< ("), không có nếu nó là ngoặc gọi hàm
// (vd "COUNT(") hoặc ngoặc lồng ngay trong ngoặc khác (vd "((a - b) / c)").
const openParenPrefix = (tokens: SqlToken[], i: number, currentLine: string): string => {
  if (isIndentOnly(currentLine)) return '(';

  const prev = tokens[i - 1];
  if (!prev) return ' (';

  // Toán tử/dấu câu đứng trước "(" - chỉ ngoặc mở khác mới dính liền (ngoặc
  // lồng nhau), còn lại (toán tử so sánh, dấu phẩy...) đều cần khoảng trắng
  if (prev.type === 'punct') {
    return prev.text === '(' ? '(' : ' (';
  }

  if (prev.type === 'word') {
    const prevUpper = prev.text.toUpperCase();
    const prevIsClauseWord =
      SPACE_BEFORE_PAREN_WORDS.has(prevUpper) ||
      TOP_LEVEL_KEYWORDS.has(prevUpper) ||
      JOIN_KEYWORDS.has(prevUpper);

    // vd "INSERT INTO users (" - tên bảng đứng ngay sau 1 từ khoá mệnh đề
    // thì "(" theo sau tên bảng vẫn cần khoảng trắng, không phải gọi hàm
    const prevPrev = tokens[i - 2];
    const prevFollowsClauseKeyword =
      !KEYWORDS.has(prevUpper) &&
      prevPrev?.type === 'word' &&
      TOP_LEVEL_KEYWORDS.has(prevPrev.text.toUpperCase());

    return prevIsClauseWord || prevFollowsClauseKeyword ? ' (' : '(';
  }

  // comment/chuỗi/số đứng ngay trước "(" - trường hợp hiếm, mặc định có
  // khoảng trắng cho an toàn
  return ' (';
};

const handleCloseParen = (ctx: FormatContext) => {
  const closed = ctx.parenStack.pop();
  ctx.parenDepth = Math.max(0, ctx.parenDepth - 1);
  if (closed) {
    if (closed.isSubquery) newLine(ctx, closed.savedIndent);
    ctx.indent = closed.savedIndent;
    ctx.clauseParenDepth = closed.savedClauseParenDepth;
  }
  appendToken(ctx, ')');
};

// Token có ý nghĩa đầu tiên kể từ index cho trước, bỏ qua các comment xen
// giữa - vd "(-- ghi chú\n SELECT ..." vẫn phải nhận ra đây là subquery dù
// token ngay sau "(" là comment chứ không phải "SELECT".
const firstMeaningfulToken = (tokens: SqlToken[], fromIndex: number): SqlToken | undefined => {
  for (let j = fromIndex; j < tokens.length; j += 1) {
    if (tokens[j].type !== 'comment') return tokens[j];
  }
  return undefined;
};

const handleOpenParen = (ctx: FormatContext, tokens: SqlToken[], i: number) => {
  ctx.currentLine += openParenPrefix(tokens, i, ctx.currentLine);

  const next = firstMeaningfulToken(tokens, i + 1);
  const isSubquery = !!next && next.type === 'word' && next.text.toUpperCase() === 'SELECT';
  ctx.parenStack.push({ isSubquery, savedIndent: ctx.indent, savedClauseParenDepth: ctx.clauseParenDepth });
  ctx.parenDepth += 1;

  if (isSubquery) {
    ctx.indent += 1;
    newLine(ctx, ctx.indent);
  }
};

const handleClauseKeyword = (ctx: FormatContext, displayText: string) => {
  if (!isIndentOnly(ctx.currentLine)) newLine(ctx, ctx.indent);
  appendToken(ctx, displayText);
  ctx.clauseParenDepth = ctx.parenDepth;
};

const handleAndOr = (ctx: FormatContext, displayText: string) => {
  if (ctx.parenDepth === ctx.clauseParenDepth) newLine(ctx, ctx.indent + 1);
  appendToken(ctx, displayText);
};

const handleCaseStart = (ctx: FormatContext) => {
  appendToken(ctx, 'CASE');
  ctx.caseStack.push(ctx.indent);
  ctx.indent += 1;
};

const handleWhenElse = (ctx: FormatContext, displayText: string) => {
  if (ctx.caseStack.length > 0) newLine(ctx, ctx.indent);
  appendToken(ctx, displayText);
};

const handleCaseEnd = (ctx: FormatContext) => {
  const returnIndent = ctx.caseStack.pop();
  if (returnIndent !== undefined) {
    newLine(ctx, returnIndent);
    ctx.indent = returnIndent;
  }
  appendToken(ctx, 'END');
};

const handleComma = (ctx: FormatContext) => {
  appendToken(ctx, ',');
  if (ctx.parenDepth === ctx.clauseParenDepth) newLine(ctx, ctx.indent + 1);
};

// Dấu ";" kết thúc 1 câu lệnh - nếu phía sau còn câu lệnh khác thì tách hẳn
// ra, chừa 1 dòng trống và format lại từ mốc thụt lề gốc.
const handleSemicolon = (ctx: FormatContext, tokens: SqlToken[], i: number) => {
  appendToken(ctx, ';');
  const hasMoreSql = tokens.slice(i + 1).some((t) => t.type !== 'comment');
  if (!hasMoreSql) return;

  ctx.lines.push(ctx.currentLine.replace(/\s+$/, ''));
  ctx.lines.push('');
  ctx.currentLine = '';
  ctx.indent = 0;
  ctx.parenDepth = 0;
  ctx.clauseParenDepth = 0;
};

// Token bình thường: từ khoá lẻ (uppercase nếu nằm trong KEYWORDS), tên
// bảng/cột, chuỗi, số, comment... không kéo theo thay đổi thụt lề.
const handlePlainToken = (ctx: FormatContext, token: SqlToken, upper: string) => {
  const display = token.type === 'word' && KEYWORDS.has(upper) ? upper : token.text;
  appendToken(ctx, display);

  // Comment 1 dòng ("--"/"#"/"//") ăn hết phần còn lại của dòng gốc -> phải
  // xuống dòng ngay sau nó, nếu không token kế tiếp sẽ bị coi như nằm trong comment
  if (token.type === 'comment' && isLineCommentText(token.text)) {
    newLine(ctx, ctx.indent);
  }
};

const processToken = (ctx: FormatContext, tokens: SqlToken[], i: number) => {
  const token = tokens[i];
  const upper = token.type === 'word' ? token.text.toUpperCase() : '';
  const isPunct = (char: string) => token.type === 'punct' && token.text === char;

  if (isPunct(')')) return handleCloseParen(ctx);
  if (isPunct('(')) return handleOpenParen(ctx, tokens, i);

  // Đang nằm trong 1 ngoặc "không phải subquery" (vd OVER (PARTITION BY ...
  // ORDER BY ...) của window function) thì ORDER BY/GROUP BY... bên trong đó
  // không phải mệnh đề mới của câu lệnh ngoài - không được xuống dòng/reset
  // thụt lề như 1 mệnh đề top-level thật sự.
  const innermostParen = ctx.parenStack[ctx.parenStack.length - 1];
  const insideNonSubqueryParen = !!innermostParen && !innermostParen.isSubquery;

  if (!insideNonSubqueryParen && token.type === 'word' && TOP_LEVEL_KEYWORDS.has(upper)) {
    return handleClauseKeyword(ctx, upper);
  }
  if (!insideNonSubqueryParen && token.type === 'word' && JOIN_KEYWORDS.has(upper)) {
    return handleClauseKeyword(ctx, upper);
  }
  if (token.type === 'word' && (upper === 'AND' || upper === 'OR')) return handleAndOr(ctx, upper);
  if (token.type === 'word' && upper === 'CASE') return handleCaseStart(ctx);
  if (token.type === 'word' && (upper === 'WHEN' || upper === 'ELSE')) return handleWhenElse(ctx, upper);
  if (token.type === 'word' && upper === 'END') return handleCaseEnd(ctx);
  if (isPunct(',')) return handleComma(ctx);
  if (isPunct(';')) return handleSemicolon(ctx, tokens, i);
  return handlePlainToken(ctx, token, upper);
};

// Định dạng chuỗi SQL thành nhiều dòng, thụt lề 2 space (đồng bộ với cách
// xml.ts đang thụt lề), từ khoá viết HOA.
export const prettifySql = (sql: string): string => {
  const tokens = mergeKeywordPhrases(rescueOverreachingLineComment(tokenize(sql)));
  if (tokens.length === 0) return '';

  const ctx = createContext();
  for (let i = 0; i < tokens.length; i += 1) {
    processToken(ctx, tokens, i);
  }

  ctx.lines.push(ctx.currentLine.replace(/\s+$/, ''));
  return ctx.lines.join('\n').trim();
};

// Tách chuỗi SQL (đã format) thành từng đoạn kèm class màu, để trang SQL.tsx
// render trực tiếp thành các <span> - giúp từ khoá/chuỗi/số/comment có màu
// riêng, dễ đọc hơn. Khoảng trắng/xuống dòng giữa các token được giữ nguyên
// (không tô màu) để không phá vỡ định dạng đã thụt lề.
export type SqlHighlightSegment = { text: string; className: string };

const highlightClassName = (token: SqlToken): string => {
  if (token.type === 'comment') return 'text-gray-400 dark:text-gray-500 italic';
  if (token.type === 'string') return 'text-amber-700 dark:text-amber-400';
  if (token.type === 'number') return 'text-emerald-600 dark:text-emerald-400';
  if (token.type === 'punct') return 'text-gray-500 dark:text-gray-400';

  const upper = token.text.toUpperCase();
  if (FUNCTION_KEYWORDS.has(upper)) return 'text-purple-600 dark:text-purple-400 font-semibold';
  if (KEYWORDS.has(upper)) return 'text-blue-600 dark:text-blue-400 font-semibold';
  return '';
};

export const highlightSqlSegments = (sql: string): SqlHighlightSegment[] => {
  const segments: SqlHighlightSegment[] = [];
  // Giữ nguyên flags gốc (đặc biệt là "u") - thiếu "u" thì [\p{L}...] không
  // còn được hiểu là Unicode property escape nữa, làm vỡ việc nhận diện từ
  const regex = new RegExp(TOKEN_REGEX.source, TOKEN_REGEX.flags);
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(sql)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: sql.slice(lastIndex, match.index), className: '' });
    }
    const text = match[0];
    segments.push({ text, className: highlightClassName({ text, type: classify(text) }) });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < sql.length) {
    segments.push({ text: sql.slice(lastIndex), className: '' });
  }

  return segments;
};
