import type { JsonPrimitive, JsonValue } from '@/util/interface/Type';

// Phần hiển thị dùng chung cho JsonTreeView (cây JSON sửa được, gắn với
// jsonFormatterSlice) - tách ra để không lặp lại cách tô màu/thụt lề.

export type JsonContainer = JsonValue[] | { [key: string]: JsonValue };

export const isJsonContainer = (value: JsonValue): value is JsonContainer =>
  value !== null && typeof value === 'object';

export const jsonValueColorClass = (value: JsonPrimitive): string => {
  if (typeof value === 'string') return 'text-amber-700 dark:text-amber-400';
  if (typeof value === 'number' || typeof value === 'bigint')
    return 'text-emerald-600 dark:text-emerald-400';
  if (typeof value === 'boolean') return 'text-purple-600 dark:text-purple-400';
  return 'text-gray-500 dark:text-gray-400'; // null
};

export const jsonPunctuationClass = 'text-gray-500 dark:text-gray-400';

// Placeholder rỗng, kích thước đúng bằng nút mũi tên (h-6 w-6) - đặt ở đầu
// các dòng "lá" (không có nút thu gọn) để nội dung của chúng thẳng cột với
// các node "container" cùng cấp (vốn có thêm nút mũi tên ở đầu dòng).
export const JsonToggleSpacer = () => (
  <span className="inline-block h-6 w-6 shrink-0" aria-hidden="true" />
);

export const JsonPropertyKey = ({
  propertyKey,
}: {
  propertyKey?: string | number;
}) => {
  if (propertyKey === undefined) return null;
  return (
    <>
      <span className="text-blue-600 dark:text-blue-400">"{propertyKey}"</span>
      <span className={jsonPunctuationClass}>: </span>
    </>
  );
};
