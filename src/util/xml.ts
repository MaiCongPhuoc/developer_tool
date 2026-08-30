import type { XmlElementNode, XmlNode } from '@/util/interface/Type';

// Chuyển 1 phần tử DOM (Element) thành cây dữ liệu thuần (plain object) để có
// thể lưu vào Redux — bản thân DOM node không phải dữ liệu "thuần"
// (serializable) nên không thể lưu thẳng vào store.
const elementToNode = (el: Element): XmlElementNode => {
  const attributes: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    attributes[attr.name] = attr.value;
  }

  const children: XmlNode[] = [];
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      children.push(elementToNode(child as Element));
    } else if (
      // CDATA (<![CDATA[...]]>) mang dữ liệu thật giống hệt text node, chỉ
      // khác cú pháp khai báo - phải gộp chung với TEXT_NODE ở đây, nếu không
      // nội dung CDATA sẽ không rơi vào bất kỳ nhánh nào, bị loại khỏi
      // `children` hoàn toàn và biến mất sau khi format (vd cả 1 thẻ có CDATA
      // bị format lại thành thẻ tự đóng rỗng).
      child.nodeType === Node.TEXT_NODE ||
      child.nodeType === Node.CDATA_SECTION_NODE
    ) {
      const text = child.textContent ?? '';
      if (text.trim()) {
        children.push({ type: 'text', value: text.trim() });
      }
    }
  }

  return { type: 'element', tagName: el.tagName, attributes, children };
};

// Parse chuỗi XML thành cây dữ liệu thuần, dùng DOMParser có sẵn của trình
// duyệt (không cần cài thư viện ngoài). DOMParser không throw lỗi khi XML sai
// cú pháp mà nhét 1 thẻ <parsererror> vào document trả về, nên phải tự kiểm tra.
export const parseXml = (xml: string): XmlElementNode => {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error(parserError.textContent?.trim() || 'Invalid XML syntax.');
  }
  if (!doc.documentElement) {
    throw new Error('No root element found.');
  }

  return elementToNode(doc.documentElement);
};

const escapeXmlText = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escapeXmlAttr = (text: string): string =>
  escapeXmlText(text).replace(/"/g, '&quot;');

const attributesToString = (attributes: Record<string, string>): string =>
  Object.entries(attributes)
    .map(([name, value]) => ` ${name}="${escapeXmlAttr(value)}"`)
    .join('');

const stringifyNode = (node: XmlNode, indent: string): string => {
  if (node.type === 'text') {
    return `${indent}${escapeXmlText(node.value)}`;
  }

  const attrs = attributesToString(node.attributes);

  if (node.children.length === 0) {
    return `${indent}<${node.tagName}${attrs} />`;
  }

  // Chỉ có 1 con là text (vd <year>2005</year>) -> viết gọn trên 1 dòng
  if (node.children.length === 1 && node.children[0].type === 'text') {
    return `${indent}<${node.tagName}${attrs}>${escapeXmlText(
      node.children[0].value
    )}</${node.tagName}>`;
  }

  const childrenStr = node.children
    .map((child) => stringifyNode(child, `${indent}  `))
    .join('\n');

  return `${indent}<${node.tagName}${attrs}>\n${childrenStr}\n${indent}</${node.tagName}>`;
};

// Format cây XML thành chuỗi đẹp, thụt lề 2 space, luôn thêm khai báo XML
// chuẩn ở đầu (kể cả khi input gốc không có).
export const stringifyXml = (root: XmlElementNode): string =>
  `<?xml version="1.0" encoding="UTF-8"?>\n${stringifyNode(root, '')}`;

const stringifyNodeCompact = (node: XmlNode): string => {
  if (node.type === 'text') {
    return escapeXmlText(node.value);
  }

  const attrs = attributesToString(node.attributes);

  if (node.children.length === 0) {
    return `<${node.tagName}${attrs} />`;
  }

  return `<${node.tagName}${attrs}>${node.children
    .map(stringifyNodeCompact)
    .join('')}</${node.tagName}>`;
};

// Format cây XML thành chuỗi gọn 1 dòng (không thụt lề, không khai báo XML) —
// dùng để đồng bộ ngược lại ô Input sau khi sửa giá trị trên cây.
export const stringifyXmlCompact = (root: XmlElementNode): string =>
  stringifyNodeCompact(root);
