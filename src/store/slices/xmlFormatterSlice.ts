import type { XmlFormatterState } from '@/util/interface/Interface';
import type { XmlEditTarget, XmlElementNode } from '@/util/interface/Type';
import { parseXml, stringifyXml, stringifyXmlCompact } from '@/util/xml';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Đi tới đúng node theo path (mảng chỉ số con), rồi gán giá trị mới vào text
// content (thẻ dạng lá) hoặc attribute tương ứng. Trả về false nếu path/loại
// node không hợp lệ (vd path trỏ tới thẻ không phải dạng lá cho target 'text').
const setXmlValueAtTarget = (
  root: XmlElementNode,
  target: XmlEditTarget,
  value: string
): boolean => {
  let node = root;
  for (const index of target.path) {
    const child = node.children[index];
    if (!child || child.type !== 'element') return false;
    node = child;
  }

  if (target.kind === 'attribute') {
    node.attributes[target.attrName] = value;
    return true;
  }

  if (node.children.length === 1 && node.children[0].type === 'text') {
    node.children[0].value = value;
    return true;
  }

  return false;
};

const initialState: XmlFormatterState = {
  inputXml: '',
  formattedXml: '',
  error: null,
  copied: false,
  collapsedPaths: {},
};

export const xmlFormatterSlice = createSlice({
  name: 'xmlFormatter',
  initialState,
  reducers: {
    setInputXml: (state, action: PayloadAction<string>) => {
      state.inputXml = action.payload;
    },
    formatXml: (state) => {
      if (!state.inputXml.trim()) {
        state.error = 'Please enter an XML string.';
        state.formattedXml = '';
        return;
      }

      try {
        const parsed = parseXml(state.inputXml);
        state.formattedXml = stringifyXml(parsed);
        state.error = null;
      } catch (err: unknown) {
        state.error =
          err instanceof Error
            ? `XML syntax error: ${err.message}`
            : 'Unknown XML syntax error.';
        state.formattedXml = '';
      }
    },
    clearXml: (state) => {
      state.inputXml = '';
      state.formattedXml = '';
      state.error = null;
      state.collapsedPaths = {};
    },
    setCopied: (state, action: PayloadAction<boolean>) => {
      state.copied = action.payload;
    },
    // Thu gọn <-> mở rộng 1 node (phần tử có con) trên cây XML
    toggleCollapse: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      state.collapsedPaths[key] = !state.collapsedPaths[key];
    },
    // Sửa nội dung text hoặc giá trị attribute của 1 node, đồng bộ lại cả
    // formattedXml (pretty) và inputXml (gọn 1 dòng) từ cùng 1 cây đã cập nhật
    updateXmlValue: (
      state,
      action: PayloadAction<{ target: XmlEditTarget; value: string }>
    ) => {
      try {
        const parsed = parseXml(state.formattedXml);
        const applied = setXmlValueAtTarget(
          parsed,
          action.payload.target,
          action.payload.value
        );
        if (!applied) return;

        state.formattedXml = stringifyXml(parsed);
        state.inputXml = stringifyXmlCompact(parsed);
        state.error = null;
      } catch {
        // formattedXml hiện không hợp lệ để parse lại (không nên xảy ra vì
        // cây chỉ hiển thị khi formattedXml hợp lệ) -> bỏ qua, không sửa gì
      }
    },
  },
});

export const {
  setInputXml,
  formatXml,
  clearXml,
  setCopied,
  toggleCollapse,
  updateXmlValue,
} = xmlFormatterSlice.actions;

export default xmlFormatterSlice.reducer;
