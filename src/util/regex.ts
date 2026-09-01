import type { RegexMatchResult, RegexToken } from './interface/Type';

// Regex chạy trên chính trình duyệt của người dùng (không gửi lên server) -
// nếu pattern gây "catastrophic backtracking" (vd (a+)+$ khớp với chuỗi dài
// toàn "a"), tab trình duyệt của chính người dùng có thể bị treo tạm thời.
// Đây là rủi ro chung của mọi regex tester chạy client-side (kể cả các trang
// nổi tiếng), không phải lỗi ứng dụng - giới hạn độ dài dưới đây chỉ giảm bớt
// worst-case chứ không loại bỏ hoàn toàn rủi ro này.
export const MAX_PATTERN_LENGTH = 500;
export const MAX_TEST_TEXT_LENGTH = 20000;
export const MAX_MATCHES = 1000;

export type RegexFlagOptions = {
  global: boolean;
  ignoreCase: boolean;
  multiline: boolean;
  dotAll: boolean;
  unicode: boolean;
  sticky: boolean;
};

export const buildFlags = (flags: RegexFlagOptions): string => {
  let result = '';
  if (flags.global) result += 'g';
  if (flags.ignoreCase) result += 'i';
  if (flags.multiline) result += 'm';
  if (flags.dotAll) result += 's';
  if (flags.unicode) result += 'u';
  if (flags.sticky) result += 'y';
  return result;
};

// Tìm tất cả kết quả khớp. RegExp cần flag 'g' mới lặp lại exec() được nhiều
// lần, nên luôn thêm 'g' vào bản dùng để quét nội bộ - nhưng nếu người dùng
// KHÔNG bật Global thì chỉ giữ lại kết quả ĐẦU TIÊN, đúng hành vi thật của
// 1 regex không có 'g' (chỉ khớp 1 lần đầu tiên tìm thấy).
export const findMatches = (
  pattern: string,
  flags: string,
  text: string
): RegexMatchResult[] => {
  const isGlobal = flags.includes('g');
  const execFlags = isGlobal ? flags : `${flags}g`;
  const regex = new RegExp(pattern, execFlags);

  const results: RegexMatchResult[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    results.push({
      match: match[0],
      index: match.index,
      groups: match.slice(1),
    });

    // Regex có thể khớp chuỗi rỗng (vd "a*" khớp "" ở mọi vị trí) - nếu không
    // tự tăng lastIndex thì vòng lặp sẽ đứng yên mãi ở cùng 1 vị trí.
    if (match[0].length === 0) {
      regex.lastIndex += 1;
    }
    if (!isGlobal || results.length >= MAX_MATCHES) break;
  }

  return results;
};

// Bộ "tokenizer" tự viết: quét chuỗi pattern (dạng text thô, KHÔNG parse
// thành cây cú pháp đầy đủ) và nhận diện các thành phần regex phổ biến theo
// thứ tự ưu tiên (mỗi alternative là 1 capturing group riêng trong regex bên
// dưới - group nào "trúng" sẽ cho biết token vừa quét thuộc loại nào).
// Thứ tự alternative rất quan trọng: các dạng "(?...)" đặc biệt phải đứng
// TRƯỚC "(" thường, vì alternation của regex chọn theo alternative khớp ĐẦU
// TIÊN (không phải khớp dài nhất) tại cùng 1 vị trí.
const TOKEN_PATTERN =
  /(\\(?:u\{[0-9A-Fa-f]+\}|u[0-9A-Fa-f]{4}|x[0-9A-Fa-f]{2}|c[A-Za-z]|[pP]\{[^}]+\}|k<[^>]+>|\d+|.))|(\(\?<[A-Za-z_$][\w$]*>)|(\(\?:)|(\(\?=)|(\(\?!)|(\(\?<=)|(\(\?<!)|(\()|(\))|(\[\^?(?:\\.|[^\]\\])*\])|(\|)|(\^)|(\$)|(\.)|(\{\d+(?:,\d*)?\}\??)|([*+?]\??)|([\s\S])/y;

const ESCAPE_DESCRIPTIONS: Record<string, string> = {
  d: 'Digit (0-9)',
  D: 'Non-digit',
  w: 'Word character (letter, digit, underscore)',
  W: 'Non-word character',
  s: 'Whitespace character',
  S: 'Non-whitespace character',
  b: 'Word boundary',
  B: 'Non-word boundary',
  n: 'Newline character',
  r: 'Carriage return character',
  t: 'Tab character',
  '0': 'Null character',
};

const describeEscape = (token: string): string => {
  const body = token.slice(1);
  if (/^u\{[0-9A-Fa-f]+\}$/.test(body)) {
    return `Unicode code point U+${body.slice(2, -1).toUpperCase()}`;
  }
  if (/^u[0-9A-Fa-f]{4}$/.test(body)) {
    return `Unicode character U+${body.slice(1).toUpperCase()}`;
  }
  if (/^x[0-9A-Fa-f]{2}$/.test(body)) {
    return `Hex character 0x${body.slice(1).toUpperCase()}`;
  }
  if (/^c[A-Za-z]$/.test(body)) {
    return `Control character Ctrl+${body.slice(1).toUpperCase()}`;
  }
  if (/^[pP]\{.+\}$/.test(body)) {
    const negated = body[0] === 'P';
    return `Unicode property${negated ? ' - NOT' : ''} matching "${body.slice(2, -1)}"`;
  }
  if (/^k<.+>$/.test(body)) {
    return `Backreference to named group "${body.slice(2, -1)}"`;
  }
  if (/^\d+$/.test(body)) {
    return `Backreference to group #${body}`;
  }
  return ESCAPE_DESCRIPTIONS[body] ?? `Escaped literal character "${body}"`;
};

const describeBraceQuantifier = (token: string): string => {
  const lazy = token.endsWith('?');
  const core = lazy ? token.slice(0, -1) : token; // "{n,m}" | "{n,}" | "{n}"
  const inner = core.slice(1, -1);
  const [minStr, maxStr] = inner.split(',');

  let description: string;
  if (maxStr === undefined) {
    description = `Repeat exactly ${minStr} times`;
  } else if (maxStr === '') {
    description = `Repeat ${minStr} or more times`;
  } else {
    description = `Repeat between ${minStr} and ${maxStr} times`;
  }
  return lazy ? `${description} (lazy - matches as few as possible)` : description;
};

const SIMPLE_QUANTIFIER_DESCRIPTIONS: Record<string, string> = {
  '*': 'Repeat 0 or more times',
  '+': 'Repeat 1 or more times',
  '?': 'Optional (0 or 1 time)',
};

const describeSimpleQuantifier = (token: string): string => {
  const lazy = token.length === 2;
  const base = token[0];
  const description = SIMPLE_QUANTIFIER_DESCRIPTIONS[base];
  return lazy ? `${description} (lazy - matches as few as possible)` : description;
};

// Diễn giải 1 chuỗi pattern regex thành danh sách token dễ đọc. Đây là bộ
// quét tự viết theo kỹ thuật "lexer bằng 1 regex tổng hợp nhiều alternative"
// - không phải trình phân tích cú pháp (parser) đầy đủ nên không phát hiện
// được pattern SAI cú pháp (vd thiếu dấu đóng ngoặc) - việc đó do `new
// RegExp()` đảm nhiệm ở nơi gọi hàm này (xem regexSlice.ts).
export const explainRegex = (pattern: string): RegexToken[] => {
  const rawTokens: RegexToken[] = [];
  let groupCounter = 0;

  TOKEN_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TOKEN_PATTERN.exec(pattern)) !== null) {
    const value = match[0];
    let type: RegexToken['type'];
    let description: string;

    if (match[1] !== undefined) {
      type = 'escape';
      description = describeEscape(value);
    } else if (match[2] !== undefined) {
      groupCounter += 1;
      type = 'group';
      const name = value.slice(3, -1);
      description = `Start of capturing group #${groupCounter} (named "${name}")`;
    } else if (match[3] !== undefined) {
      type = 'group';
      description = 'Start of non-capturing group';
    } else if (match[4] !== undefined) {
      type = 'group';
      description = 'Start of positive lookahead - checks what follows without consuming it';
    } else if (match[5] !== undefined) {
      type = 'group';
      description = 'Start of negative lookahead - checks what does NOT follow';
    } else if (match[6] !== undefined) {
      type = 'group';
      description = 'Start of positive lookbehind - checks what precedes without consuming it';
    } else if (match[7] !== undefined) {
      type = 'group';
      description = 'Start of negative lookbehind - checks what does NOT precede';
    } else if (match[8] !== undefined) {
      groupCounter += 1;
      type = 'group';
      description = `Start of capturing group #${groupCounter}`;
    } else if (match[9] !== undefined) {
      type = 'group';
      description = 'End of group';
    } else if (match[10] !== undefined) {
      type = 'class';
      const negated = value.startsWith('[^');
      const content = negated ? value.slice(2, -1) : value.slice(1, -1);
      description = negated
        ? `Character class - NOT matching any of: ${content || '(empty)'}`
        : `Character class - matching one of: ${content || '(empty)'}`;
    } else if (match[11] !== undefined) {
      type = 'alternation';
      description = 'OR - matches the pattern before or after this';
    } else if (match[12] !== undefined) {
      type = 'anchor';
      description = 'Start of string/line anchor';
    } else if (match[13] !== undefined) {
      type = 'anchor';
      description = 'End of string/line anchor';
    } else if (match[14] !== undefined) {
      type = 'wildcard';
      description = 'Any character (except line breaks, unless "s" flag is on)';
    } else if (match[15] !== undefined) {
      type = 'quantifier';
      description = describeBraceQuantifier(value);
    } else if (match[16] !== undefined) {
      type = 'quantifier';
      description = describeSimpleQuantifier(value);
    } else {
      type = 'literal';
      description = `Literal character "${value}"`;
    }

    rawTokens.push({ type, value, description });
  }

  // Gộp các ký tự literal liền kề thành 1 dòng duy nhất (vd "hello" thay vì 5
  // dòng h/e/l/l/o riêng lẻ) để bảng giải thích dễ đọc hơn, "trực quan" hơn.
  const merged: RegexToken[] = [];
  for (const token of rawTokens) {
    const last = merged[merged.length - 1];
    if (token.type === 'literal' && last?.type === 'literal') {
      last.value += token.value;
      last.description = `Literal text "${last.value}"`;
    } else {
      merged.push({ ...token });
    }
  }

  return merged;
};
