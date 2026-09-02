import { useEffect } from 'react';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useDelayedAction } from '@/hook/useDelayedAction';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearRegex,
  setFlagDotAll,
  setFlagGlobal,
  setFlagIgnoreCase,
  setFlagMultiline,
  setFlagSticky,
  setFlagUnicode,
  setPattern,
  setTestText,
  test,
} from '@/store/slices/regexSlice';
import type { RegexMatchResult, RegexTokenType } from '@/util/interface/Type';

const inputClass =
  'w-full p-2.5 text-sm border rounded-lg bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:placeholder:text-gray-500 font-mono';

const textareaClass =
  'w-full result-box-h-sm p-3 font-mono text-sm border rounded-lg bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:placeholder:text-gray-500 resize-none';

const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

const checkboxLabelClass =
  'flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 select-none cursor-pointer';

// Màu riêng cho từng loại token trong bảng giải thích - giống ý tưởng "3 màu
// jwt.io" ở trang Encryption, giúp nhận ra nhóm cú pháp chỉ bằng màu.
const tokenTypeClass: Record<RegexTokenType, string> = {
  anchor: 'text-purple-600 dark:text-purple-400',
  quantifier: 'text-amber-600 dark:text-amber-400',
  group: 'text-blue-600 dark:text-blue-400',
  class: 'text-emerald-600 dark:text-emerald-400',
  escape: 'text-rose-600 dark:text-rose-400',
  alternation: 'text-orange-600 dark:text-orange-400',
  literal: 'text-gray-700 dark:text-gray-300',
  wildcard: 'text-sky-600 dark:text-sky-400',
};

// Chèn <mark> vào đúng những đoạn đã khớp trong testText - dữ liệu thô
// (matches) nằm trong Redux, còn JSX highlight này chỉ tính khi render, đúng
// nguyên tắc Redux state phải serializable (không lưu JSX vào store).
const renderHighlighted = (text: string, matches: RegexMatchResult[]) => {
  if (matches.length === 0) return text;

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  matches.forEach((m, i) => {
    if (m.index > cursor) {
      parts.push(text.slice(cursor, m.index));
    }
    parts.push(
      <mark
        key={i}
        className="rounded bg-yellow-300 px-0.5 dark:bg-yellow-600/70 dark:text-white"
      >
        {m.match || '​'}
      </mark>
    );
    cursor = m.index + m.match.length;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
};

const RegexTester = () => {
  const dispatch = useAppDispatch();
  const {
    pattern,
    flagGlobal,
    flagIgnoreCase,
    flagMultiline,
    flagDotAll,
    flagUnicode,
    flagSticky,
    testText,
    isMatch,
    matches,
    tokens,
    error,
  } = useAppSelector((state) => state.regex);
  const { loading, run, cancel } = useDelayedAction();

  // State sống trong Redux nên tồn tại xuyên suốt cả app, không tự mất khi
  // chuyển route như useState thường làm -> phải chủ động xoá mỗi khi vào
  // lại trang này để không còn thấy kết quả của lần trước.
  useEffect(() => {
    dispatch(clearRegex());
  }, [dispatch]);

  const handleTest = () => {
    run(() => dispatch(test()));
  };

  const handleClear = () => {
    cancel();
    dispatch(clearRegex());
  };

  // tokens chỉ được điền khi 1 lần Test gần nhất chạy thành công (xem
  // regexSlice.ts: reset về [] mỗi khi có lỗi/Clear, luôn có ít nhất 1 phần
  // tử sau khi test thành công vì pattern lúc đó chắc chắn không rỗng) -
  // dùng làm dấu hiệu "đã test xong" mà không cần thêm field state riêng.
  const hasTested = !loading && !error && tokens.length > 0;

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
        Regex Tester
      </h1>

      <div className="space-y-4 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
        {/* Pattern regex */}
        <div className="flex flex-col space-y-2">
          <label className={labelClass}>Regular Expression Pattern:</label>
          <div className="flex items-center gap-1">
            <span className="text-gray-400 dark:text-gray-500 font-mono">/</span>
            <input
              type="text"
              value={pattern}
              onChange={(e) => dispatch(setPattern(e.target.value))}
              placeholder="e.g. ^\d{3}-\d{4}$"
              className={inputClass}
              spellCheck={false}
            />
            <span className="text-gray-400 dark:text-gray-500 font-mono">/</span>
          </div>
        </div>

        {/* Flags */}
        <div className="flex flex-wrap gap-4">
          <label className={checkboxLabelClass}>
            <input
              type="checkbox"
              checked={flagGlobal}
              onChange={(e) => dispatch(setFlagGlobal(e.target.checked))}
            />
            Global (g)
          </label>
          <label className={checkboxLabelClass}>
            <input
              type="checkbox"
              checked={flagIgnoreCase}
              onChange={(e) => dispatch(setFlagIgnoreCase(e.target.checked))}
            />
            Ignore Case (i)
          </label>
          <label className={checkboxLabelClass}>
            <input
              type="checkbox"
              checked={flagMultiline}
              onChange={(e) => dispatch(setFlagMultiline(e.target.checked))}
            />
            Multiline (m)
          </label>
          <label className={checkboxLabelClass}>
            <input
              type="checkbox"
              checked={flagDotAll}
              onChange={(e) => dispatch(setFlagDotAll(e.target.checked))}
            />
            Dot All (s)
          </label>
          <label className={checkboxLabelClass}>
            <input
              type="checkbox"
              checked={flagUnicode}
              onChange={(e) => dispatch(setFlagUnicode(e.target.checked))}
            />
            Unicode (u)
          </label>
          <label className={checkboxLabelClass}>
            <input
              type="checkbox"
              checked={flagSticky}
              onChange={(e) => dispatch(setFlagSticky(e.target.checked))}
            />
            Sticky (y)
          </label>
        </div>

        {/* Văn bản cần kiểm tra */}
        <div className="flex flex-col space-y-2">
          <label className={labelClass}>Test String:</label>
          <textarea
            value={testText}
            onChange={(e) => dispatch(setTestText(e.target.value))}
            placeholder="Enter text to test against the pattern above..."
            className={textareaClass}
            spellCheck={false}
          />
        </div>

        {/* Thanh công cụ */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleTest}
            disabled={loading}
            className="flex-1 sm:flex-none min-w-30 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Processing...' : 'Test'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 sm:flex-none min-w-30 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition"
          >
            Clear
          </button>
        </div>

        {/* Thông báo lỗi nếu có */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="w-full p-3 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
            <LoadingIndicator />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Badge kết quả match - chỉ hiện sau khi đã Test thành công ít
                nhất 1 lần, tránh báo "No match" giả trước khi người dùng
                làm gì cả. */}
            {hasTested && (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    isMatch
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {isMatch
                    ? `Match found (${matches.length})`
                    : 'No match'}
                </span>
              </div>
            )}

            {/* Văn bản đã tô sáng phần khớp - luôn hiện khung, giống pattern
                "sẽ xuất hiện ở đây..." của các trang trước (UUID, Password...) */}
            <div className="flex flex-col space-y-2">
              <label className={labelClass}>Highlighted Text:</label>
              <div className="w-full result-box-max-h overflow-auto p-3 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
                {hasTested ? (
                  <p className="whitespace-pre-wrap break-words font-mono text-sm text-gray-800 dark:text-gray-100">
                    {testText
                      ? renderHighlighted(testText, matches)
                      : (
                        <span className="text-gray-400 dark:text-gray-500 font-sans">
                          (empty test string)
                        </span>
                      )}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    The highlighted match result will appear here...
                  </p>
                )}
              </div>
            </div>

            {/* Danh sách các kết quả khớp */}
            <div className="flex flex-col space-y-2">
              <label className={labelClass}>
                Matches
                {hasTested && matches.length > 0
                  ? ` (${matches.length}${matches.length >= 1000 ? '+' : ''})`
                  : ''}
                :
              </label>
              <div className="w-full result-box-max-h overflow-auto p-3 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
                {!hasTested ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Matches will appear here after you click Test...
                  </p>
                ) : matches.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    No matches found.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {matches.map((m, i) => (
                      <li
                        key={i}
                        className="font-mono text-sm text-gray-800 dark:text-gray-100"
                      >
                        <span className="text-gray-400 dark:text-gray-500">
                          #{i + 1} @{m.index}:{' '}
                        </span>
                        <span className="break-all">
                          "{m.match || '(empty match)'}"
                        </span>
                        {m.groups.length > 0 && (
                          <span className="block pl-6 text-xs text-gray-500 dark:text-gray-400">
                            Groups:{' '}
                            {m.groups
                              .map((g, gi) =>
                                g === undefined
                                  ? `#${gi + 1}=(unmatched)`
                                  : `#${gi + 1}="${g}"`
                              )
                              .join(', ')}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Bảng giải thích cú pháp regex */}
            <div className="flex flex-col space-y-2">
              <label className={labelClass}>Syntax Explanation:</label>
              <div className="w-full result-box-max-h overflow-auto border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
                {hasTested ? (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {tokens.map((token, i) => (
                      <li
                        key={i}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 p-2.5 text-sm"
                      >
                        <code
                          className={`shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-mono ${tokenTypeClass[token.type]} dark:bg-gray-800`}
                        >
                          {token.value}
                        </code>
                        <span className="text-gray-600 dark:text-gray-300">
                          {token.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-3 text-sm text-gray-400 dark:text-gray-500">
                    The regex syntax breakdown will appear here...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegexTester;
