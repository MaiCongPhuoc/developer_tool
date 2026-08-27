import type { JsonFormatterState } from '@/util/interface/Interface';
import type { JsonPath, JsonPrimitive, JsonValue } from '@/util/interface/Type';
import {
  parsePreservingBigInt,
  stringifyPreservingBigInt,
} from '@/util/bigIntJson';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// JSON.parse() từ chối dấu phẩy thừa trước "}" hoặc "]" (theo đúng chuẩn JSON),
// nên ta phải "dọn" chuỗi trước khi parse. Hàm này duyệt từng ký tự, bỏ qua
// phần nằm trong dấu nháy kép (chuỗi) để không xoá nhầm dấu phẩy hợp lệ bên trong value.
const stripTrailingCommas = (json: string): string => {
  let result = '';
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < json.length; i++) {
    const char = json[i];

    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\' && inString) {
      result += char;
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    if (char === ',' && !inString) {
      let next = i + 1;
      while (next < json.length && /\s/.test(json[next])) {
        next++;
      }
      if (json[next] === '}' || json[next] === ']') {
        continue;
      }
    }

    result += char;
  }

  return result;
};

// Gán `value` vào đúng vị trí `path` trong `root` (đi từ node gốc dựa theo
// từng key/index trong path). Dùng cho việc sửa 1 giá trị lá trên cây JSON.
const setValueAtPath = (
  root: JsonValue,
  path: JsonPath,
  value: JsonPrimitive
): JsonValue => {
  if (path.length === 0) {
    return value;
  }

  let target = root as Record<string | number, JsonValue>;
  for (let i = 0; i < path.length - 1; i++) {
    target = target[path[i]] as Record<string | number, JsonValue>;
  }
  target[path[path.length - 1]] = value;

  return root;
};

const initialState: JsonFormatterState = {
  inputJson: '',
  formattedJson: '',
  error: null,
  copied: false,
  collapsedPaths: {},
};

export const jsonFormatterSlice = createSlice({
  name: 'jsonFormatter',
  initialState,
  reducers: {
    setInputJson: (state, action: PayloadAction<string>) => {
      state.inputJson = action.payload;
    },
    formatJson: (state) => {
      if (!state.inputJson.trim()) {
        state.error = 'Vui lòng nhập chuỗi JSON.';
        state.formattedJson = '';
        return;
      }

      try {
        const parsed = parsePreservingBigInt(
          stripTrailingCommas(state.inputJson)
        );
        state.formattedJson = stringifyPreservingBigInt(parsed, 2);
        state.error = null;
      } catch (err: unknown) {
        state.error =
          err instanceof Error
            ? `Lỗi cú pháp JSON: ${err.message}`
            : 'Lỗi cú pháp JSON không xác định.';
        state.formattedJson = '';
      }
    },
    clearJson: (state) => {
      state.inputJson = '';
      state.formattedJson = '';
      state.error = null;
      state.collapsedPaths = {};
    },
    setCopied: (state, action: PayloadAction<boolean>) => {
      state.copied = action.payload;
    },
    // Thu gọn <-> mở rộng 1 node (object/array) trên cây JSON
    toggleCollapse: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      state.collapsedPaths[key] = !state.collapsedPaths[key];
    },
    // Sửa giá trị 1 node lá trên cây JSON, đồng bộ lại cả formattedJson (pretty)
    // và inputJson (compact) từ cùng 1 object đã cập nhật
    updateJsonValue: (
      state,
      action: PayloadAction<{ path: JsonPath; value: JsonPrimitive }>
    ) => {
      try {
        const parsed = parsePreservingBigInt(state.formattedJson);
        const updated = setValueAtPath(
          parsed,
          action.payload.path,
          action.payload.value
        );
        state.formattedJson = stringifyPreservingBigInt(updated, 2);
        state.inputJson = stringifyPreservingBigInt(updated);
        state.error = null;
      } catch {
        // formattedJson hiện không hợp lệ để parse lại (không nên xảy ra vì
        // cây chỉ hiển thị khi formattedJson hợp lệ) -> bỏ qua, không sửa gì
      }
    },
  },
});

export const {
  setInputJson,
  formatJson,
  clearJson,
  setCopied,
  toggleCollapse,
  updateJsonValue,
} = jsonFormatterSlice.actions;

export default jsonFormatterSlice.reducer;
