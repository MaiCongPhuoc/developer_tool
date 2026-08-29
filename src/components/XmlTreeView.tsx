import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  toggleCollapse,
  updateXmlValue,
} from '@/store/slices/xmlFormatterSlice';
import { parseXml } from '@/util/xml';
import type { XmlElementNode, XmlPath } from '@/util/interface/Type';

const punctuationClass = 'text-gray-500 dark:text-gray-400';
const tagClass = 'text-blue-600 dark:text-blue-400';
const attrNameClass = 'text-purple-600 dark:text-purple-400';
const attrValueClass = 'text-amber-700 dark:text-amber-400';
const textClass = 'text-emerald-600 dark:text-emerald-400';

// Placeholder rỗng, kích thước đúng bằng nút mũi tên (h-6 w-6) - đặt ở đầu
// các dòng "lá" (không có nút thu gọn) để tên thẻ của chúng thẳng cột với
// tên thẻ của các node "cha" cùng cấp (vốn có thêm nút mũi tên ở đầu dòng).
const ToggleSpacer = () => (
  <span className="inline-block h-6 w-6 shrink-0" aria-hidden="true" />
);

type EditableValueProps = {
  value: string;
  colorClass: string;
  onCommit: (value: string) => void;
};

// Input không kiểm soát (uncontrolled) dùng chung cho cả nội dung text của
// thẻ và giá trị attribute — mô phỏng đúng cách JsonLeafNode đã làm: `key`
// đổi theo `value` để React tự tạo input mới khi giá trị đổi từ nguồn khác
// (sửa ở ô Input rồi bấm lại Format, hoặc chính giá trị này vừa commit).
const EditableValue = ({ value, colorClass, onCommit }: EditableValueProps) => {
  const commit = (draft: string) => {
    if (draft === value) return;
    onCommit(draft);
  };

  return (
    <input
      key={value}
      defaultValue={value}
      onBlur={(e) => commit(e.target.value)}
      onChange={(e) => {
        e.currentTarget.style.width = `${Math.max(
          e.currentTarget.value.length,
          1
        )}ch`;
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
        if (e.key === 'Escape') {
          e.currentTarget.value = value;
          e.currentTarget.style.width = `${Math.max(value.length, 1)}ch`;
          e.currentTarget.blur();
        }
      }}
      style={{
        width: `${Math.max(value.length, 1)}ch`,
        // box-sizing: content-box để border không "ăn" vào phần chữ (Tailwind
        // Preflight đặt border-box mặc định) - xem lý do đầy đủ ở JsonTreeView.
        boxSizing: 'content-box',
      }}
      className={`${colorClass} rounded border border-transparent bg-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none dark:hover:border-gray-600`}
    />
  );
};

const AttributesInline = ({
  attributes,
  path,
}: {
  attributes: Record<string, string>;
  path: XmlPath;
}) => {
  const dispatch = useAppDispatch();

  return (
    <>
      {Object.entries(attributes).map(([name, value]) => (
        <span key={name} className="ml-1 whitespace-nowrap">
          <span className={attrNameClass}>{name}</span>
          <span className={punctuationClass}>=&quot;</span>
          <EditableValue
            value={value}
            colorClass={attrValueClass}
            onCommit={(newValue) =>
              dispatch(
                updateXmlValue({
                  target: { kind: 'attribute', path, attrName: name },
                  value: newValue,
                })
              )
            }
          />
          <span className={punctuationClass}>&quot;</span>
        </span>
      ))}
    </>
  );
};

type XmlNodeProps = {
  node: XmlElementNode;
  path: XmlPath;
};

// Điều hướng theo cấu trúc của node: phần tử tự đóng, phần tử "lá" (chỉ có 1
// con là text, nội dung sửa được) hiển thị gọn 1 dòng, còn lại là phần tử
// "container" có nút thu gọn/mở rộng.
const XmlElementRow = ({ node, path }: XmlNodeProps) => {
  const dispatch = useAppDispatch();
  const pathKey = JSON.stringify(path);
  const isCollapsed = useAppSelector((state) =>
    Boolean(state.xmlFormatter.collapsedPaths[pathKey])
  );

  // Thẻ tự đóng (không có con)
  if (node.children.length === 0) {
    return (
      <div className="flex items-center gap-1 font-mono text-sm">
        <ToggleSpacer />
        <span className="inline-flex items-baseline whitespace-nowrap">
          <span className={punctuationClass}>{'<'}</span>
          <span className={tagClass}>{node.tagName}</span>
          <AttributesInline attributes={node.attributes} path={path} />
          <span className={punctuationClass}> {'/>'}</span>
        </span>
      </div>
    );
  }

  // Chỉ có 1 con là text (vd <year>2005</year>) -> hiện gọn 1 dòng, không cần
  // nút thu gọn vì đã ngắn sẵn; nội dung text sửa được trực tiếp
  if (node.children.length === 1 && node.children[0].type === 'text') {
    const textValue = node.children[0].value;
    return (
      <div className="flex items-center gap-1 font-mono text-sm">
        <ToggleSpacer />
        <span className="inline-flex min-w-0 items-baseline whitespace-nowrap">
          <span className={punctuationClass}>{'<'}</span>
          <span className={tagClass}>{node.tagName}</span>
          <AttributesInline attributes={node.attributes} path={path} />
          <span className={punctuationClass}>{'>'}</span>
          <EditableValue
            value={textValue}
            colorClass={textClass}
            onCommit={(newValue) =>
              dispatch(
                updateXmlValue({
                  target: { kind: 'text', path },
                  value: newValue,
                })
              )
            }
          />
          <span className={punctuationClass}>{'</'}</span>
          <span className={tagClass}>{node.tagName}</span>
          <span className={punctuationClass}>{'>'}</span>
        </span>
      </div>
    );
  }

  const elementChildren = node.children.filter(
    (child): child is XmlElementNode => child.type === 'element'
  );

  return (
    <div className="font-mono text-sm">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => dispatch(toggleCollapse(pathKey))}
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
        <span className="inline-flex items-baseline whitespace-nowrap">
          <span className={punctuationClass}>{'<'}</span>
          <span className={tagClass}>{node.tagName}</span>
          <AttributesInline attributes={node.attributes} path={path} />
          <span className={punctuationClass}>{'>'}</span>
          {isCollapsed && (
            <>
              <span className={punctuationClass}>...</span>
              <span className={punctuationClass}>{'</'}</span>
              <span className={tagClass}>{node.tagName}</span>
              <span className={punctuationClass}>{'>'}</span>
            </>
          )}
        </span>
      </div>

      {!isCollapsed && (
        <>
          <div className="ml-4 border-l border-gray-200 pl-3 dark:border-gray-700">
            {elementChildren.map((child, index) => (
              <XmlElementRow
                key={index}
                node={child}
                path={[...path, index]}
              />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <ToggleSpacer />
            <span className={punctuationClass}>
              {'</'}
              <span className={tagClass}>{node.tagName}</span>
              {'>'}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

// Component gốc: đọc formattedXml từ Redux, parse rồi render thành cây
const XmlTreeView = () => {
  const formattedXml = useAppSelector(
    (state) => state.xmlFormatter.formattedXml
  );

  const rootNode = useMemo<XmlElementNode | undefined>(() => {
    if (!formattedXml) return undefined;
    try {
      return parseXml(formattedXml);
    } catch {
      return undefined;
    }
  }, [formattedXml]);

  if (!rootNode) return null;

  return <XmlElementRow node={rootNode} path={[]} />;
};

export default XmlTreeView;
