import { useState } from 'react';
import type { JsonPath, JsonPrimitive, JsonValue } from '@/util/interface/Type';
import { stringifyPreservingBigInt } from '@/util/bigIntJson';
import {
  isJsonContainer,
  jsonPunctuationClass,
  jsonValueColorClass,
  JsonPropertyKey,
  JsonToggleSpacer,
  type JsonContainer,
} from './JsonTreePrimitives';

// Giống JsonTreeView (trang JSON Formatter) nhưng chỉ để xem, không sửa được:
// không có <input>, không đụng tới Redux - trạng thái thu gọn/mở rộng sống
// bằng useState riêng của từng lần render component này (mỗi cây độc lập,
// vd header và payload của JWT là 2 cây tách biệt).
type CollapsedPaths = Record<string, boolean>;

type NodeProps = {
  path: JsonPath;
  propertyKey?: string | number;
  value: JsonValue;
  isLast: boolean;
  collapsedPaths: CollapsedPaths;
  onToggle: (pathKey: string) => void;
};

const JsonTreeNode = ({
  path,
  propertyKey,
  value,
  isLast,
  collapsedPaths,
  onToggle,
}: NodeProps) => {
  if (isJsonContainer(value)) {
    return (
      <JsonContainerNode
        path={path}
        propertyKey={propertyKey}
        value={value}
        isLast={isLast}
        collapsedPaths={collapsedPaths}
        onToggle={onToggle}
      />
    );
  }

  return <JsonLeafNode propertyKey={propertyKey} value={value} isLast={isLast} />;
};

type ContainerNodeProps = {
  path: JsonPath;
  propertyKey?: string | number;
  value: JsonContainer;
  isLast: boolean;
  collapsedPaths: CollapsedPaths;
  onToggle: (pathKey: string) => void;
};

const JsonContainerNode = ({
  path,
  propertyKey,
  value,
  isLast,
  collapsedPaths,
  onToggle,
}: ContainerNodeProps) => {
  const pathKey = JSON.stringify(path);
  const isCollapsed = Boolean(collapsedPaths[pathKey]);

  const isArray = Array.isArray(value);
  const entries: [string | number, JsonValue][] = isArray
    ? value.map((item, index): [string | number, JsonValue] => [index, item])
    : Object.entries(value);

  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';

  if (entries.length === 0) {
    return (
      <div className="flex items-center gap-1 font-mono text-sm">
        <JsonToggleSpacer />
        <span className="whitespace-nowrap">
          <JsonPropertyKey propertyKey={propertyKey} />
          <span className={jsonPunctuationClass}>
            {openBracket}
            {closeBracket}
            {!isLast && ','}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="font-mono text-sm">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onToggle(pathKey)}
          aria-label={isCollapsed ? 'Expand node' : 'Collapse node'}
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
        <span className="whitespace-nowrap">
          <JsonPropertyKey propertyKey={propertyKey} />
          <span className={jsonPunctuationClass}>
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
                collapsedPaths={collapsedPaths}
                onToggle={onToggle}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <JsonToggleSpacer />
            <span className={jsonPunctuationClass}>
              {closeBracket}
              {!isLast && ','}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

type LeafNodeProps = {
  propertyKey?: string | number;
  value: JsonPrimitive;
  isLast: boolean;
};

const JsonLeafNode = ({ propertyKey, value, isLast }: LeafNodeProps) => (
  <div className="flex items-center gap-1 font-mono text-sm">
    <JsonToggleSpacer />
    <span className="whitespace-nowrap">
      <JsonPropertyKey propertyKey={propertyKey} />
      <span className={jsonValueColorClass(value)}>
        {stringifyPreservingBigInt(value)}
      </span>
      {!isLast && <span className={jsonPunctuationClass}>,</span>}
    </span>
  </div>
);

const ReadOnlyJsonTree = ({ value }: { value: JsonValue }) => {
  const [collapsedPaths, setCollapsedPaths] = useState<CollapsedPaths>({});

  const handleToggle = (pathKey: string) => {
    setCollapsedPaths((prev) => ({ ...prev, [pathKey]: !prev[pathKey] }));
  };

  return (
    <JsonTreeNode
      path={[]}
      value={value}
      isLast
      collapsedPaths={collapsedPaths}
      onToggle={handleToggle}
    />
  );
};

export default ReadOnlyJsonTree;
