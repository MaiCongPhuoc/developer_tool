import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  toggleCollapse,
  updateJsonValue,
} from '@/store/slices/jsonFormatterSlice';
import type { JsonPath, JsonPrimitive, JsonValue } from '@/util/interface/Type';
import {
  parsePreservingBigInt,
  stringifyPreservingBigInt,
} from '@/util/bigIntJson';

type JsonContainer = JsonValue[] | { [key: string]: JsonValue };

const isContainer = (value: JsonValue): value is JsonContainer =>
  value !== null && typeof value === 'object';

// Thử parse lại y hệt cú pháp JSON (true/false/null/số/"chuỗi có ngoặc kép").
// Gõ gì không hợp lệ JSON thì coi nguyên văn phần vừa gõ là 1 chuỗi thường.
// Số nguyên vượt Number.MAX_SAFE_INTEGER được giữ nguyên bằng BigInt, tránh
// bị JS làm tròn sai (vd gõ 47 chữ số 1 mà hiển thị lại thành 1.111...e+43).
const parseEditedValue = (text: string): JsonPrimitive => {
  const trimmed = text.trim();
  if (/^-?\d+$/.test(trimmed) && !Number.isSafeInteger(Number(trimmed))) {
    return BigInt(trimmed);
  }

  try {
    return JSON.parse(text) as JsonPrimitive;
  } catch {
    return text;
  }
};

const valueColorClass = (value: JsonPrimitive): string => {
  if (typeof value === 'string') return 'text-amber-700 dark:text-amber-400';
  if (typeof value === 'number' || typeof value === 'bigint')
    return 'text-emerald-600 dark:text-emerald-400';
  if (typeof value === 'boolean') return 'text-purple-600 dark:text-purple-400';
  return 'text-gray-500 dark:text-gray-400'; // null
};

const punctuationClass = 'text-gray-500 dark:text-gray-400';

const PropertyKey = ({ propertyKey }: { propertyKey?: string | number }) => {
  if (propertyKey === undefined) return null;
  return (
    <>
      <span className="text-blue-600 dark:text-blue-400">"{propertyKey}"</span>
      <span className={punctuationClass}>: </span>
    </>
  );
};

type NodeProps = {
  path: JsonPath;
  propertyKey?: string | number;
  value: JsonValue;
  isLast: boolean;
};

// Điều hướng: object/array -> JsonContainerNode (có thể thu gọn),
// còn lại (string/number/boolean/null) -> JsonLeafNode (sửa được).
const JsonTreeNode = ({ path, propertyKey, value, isLast }: NodeProps) => {
  if (isContainer(value)) {
    return (
      <JsonContainerNode
        path={path}
        propertyKey={propertyKey}
        value={value}
        isLast={isLast}
      />
    );
  }

  return (
    <JsonLeafNode
      path={path}
      propertyKey={propertyKey}
      value={value}
      isLast={isLast}
    />
  );
};

type ContainerNodeProps = {
  path: JsonPath;
  propertyKey?: string | number;
  value: JsonContainer;
  isLast: boolean;
};

const JsonContainerNode = ({
  path,
  propertyKey,
  value,
  isLast,
}: ContainerNodeProps) => {
  const dispatch = useAppDispatch();
  // Dùng path (vd ["features", 0]) làm khoá lưu trạng thái thu gọn trong Redux
  const pathKey = JSON.stringify(path);
  const isCollapsed = useAppSelector((state) =>
    Boolean(state.jsonFormatter.collapsedPaths[pathKey])
  );

  const isArray = Array.isArray(value);
  const entries: [string | number, JsonValue][] = isArray
    ? value.map((item, index): [string | number, JsonValue] => [index, item])
    : Object.entries(value);

  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';

  // Object/array rỗng: không có gì để thu gọn -> không hiện mũi tên
  if (entries.length === 0) {
    return (
      <div className="font-mono text-sm">
        <PropertyKey propertyKey={propertyKey} />
        <span className={punctuationClass}>
          {openBracket}
          {closeBracket}
          {!isLast && ','}
        </span>
      </div>
    );
  }

  return (
    <div className="font-mono text-sm">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => dispatch(toggleCollapse(pathKey))}
          aria-label={isCollapsed ? 'Mở rộng node' : 'Thu gọn node'}
          aria-expanded={!isCollapsed}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-800 dark:hover:text-blue-400"
        >
          <span
            className={`inline-block text-lg leading-none transition-transform ${
              isCollapsed ? '' : 'rotate-90'
            }`}
          >
            ›
          </span>
        </button>
        <span>
          <PropertyKey propertyKey={propertyKey} />
          <span className={punctuationClass}>
            {isCollapsed
              ? `${openBracket}...${closeBracket}${!isLast ? ',' : ''}`
              : openBracket}
          </span>
        </span>
      </div>

      {!isCollapsed && (
        <>
          <div className="ml-4 border-l border-gray-200 pl-3 dark:border-gray-700">
            {entries.map(([key, item], index) => (
              <JsonTreeNode
                key={key}
                path={[...path, key]}
                propertyKey={isArray ? undefined : key}
                value={item}
                isLast={index === entries.length - 1}
              />
            ))}
          </div>
          <div className={punctuationClass}>
            {closeBracket}
            {!isLast && ','}
          </div>
        </>
      )}
    </div>
  );
};

type LeafNodeProps = {
  path: JsonPath;
  propertyKey?: string | number;
  value: JsonPrimitive;
  isLast: boolean;
};

const JsonLeafNode = ({ path, propertyKey, value, isLast }: LeafNodeProps) => {
  const dispatch = useAppDispatch();
  const literal = stringifyPreservingBigInt(value);

  const commit = (draft: string) => {
    if (draft === literal) return;
    dispatch(updateJsonValue({ path, value: parseEditedValue(draft) }));
  };

  return (
    <div className="flex items-baseline font-mono text-sm">
      <PropertyKey propertyKey={propertyKey} />
      {/* input không kiểm soát (uncontrolled): mỗi khi `literal` đổi do 1 nguồn
          bên ngoài (sửa ở ô Input rồi bấm lại Format JSON, hoặc chính giá trị
          này vừa được commit), `key` đổi theo -> React tạo hẳn 1 input mới với
          defaultValue mới, thay vì phải dùng useEffect để đồng bộ state thủ công. */}
      <input
        key={literal}
        defaultValue={literal}
        onBlur={(e) => commit(e.target.value)}
        onChange={(e) => {
          // Gõ tới đâu, giãn rộng theo tới đó (tính theo số ký tự vì input
          // dùng font-mono). min-w-0 + flex-shrink (mặc định của flex item)
          // ở dưới sẽ tự chặn lại nếu độ rộng này vượt quá phần còn trống
          // của dòng, để không bị tràn ra ngoài khung Formatted Output.
          e.currentTarget.style.width = `${Math.max(
            e.currentTarget.value.length,
            2
          )}ch`;
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
          if (e.key === 'Escape') {
            e.currentTarget.value = literal;
            e.currentTarget.style.width = `${Math.max(literal.length, 2)}ch`;
            e.currentTarget.blur();
          }
        }}
        style={{
          width: `${Math.max(literal.length, 2)}ch`,
          // Tailwind Preflight đặt box-sizing: border-box mặc định, khiến viền
          // (border) 1px của input bị tính lấn vào đúng phần chữ (width theo
          // ch chỉ vừa đủ chữ, không còn chỗ cho border) -> hụt mất 1 chút ký
          // tự cuối. Đổi riêng input này sang content-box để border cộng
          // thêm ra ngoài, không đụng vào vùng hiển thị chữ.
          boxSizing: 'content-box',
        }}
        className={`${valueColorClass(
          value
        )} min-w-0 rounded border border-transparent bg-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none dark:hover:border-gray-600`}
      />
      {!isLast && <span className={punctuationClass}>,</span>}
    </div>
  );
};

// Component gốc: đọc formattedJson từ Redux, parse rồi render thành cây
const JsonTreeView = () => {
  const formattedJson = useAppSelector(
    (state) => state.jsonFormatter.formattedJson
  );

  const rootValue = useMemo<JsonValue | undefined>(() => {
    if (!formattedJson) return undefined;
    try {
      return parsePreservingBigInt(formattedJson);
    } catch {
      return undefined;
    }
  }, [formattedJson]);

  if (rootValue === undefined) return null;

  return <JsonTreeNode path={[]} value={rootValue} isLast />;
};

export default JsonTreeView;
