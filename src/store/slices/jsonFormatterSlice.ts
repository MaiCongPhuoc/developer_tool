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
      // Bỏ qua cả khoảng trắng LẪN các dấu phẩy khác phía sau (không chỉ 1
      // khoảng trắng) - để xử lý đúng nhiều dấu phẩy thừa liên tiếp (vd
      // "[1,2,,]"). Nếu chỉ nhìn ký tự không-khoảng-trắng kế tiếp, dấu phẩy
      // đứng ngay trước 1 dấu phẩy khác (không phải "}"/"]") sẽ bị coi nhầm
      // là "không thừa" và giữ lại, khiến chuỗi sau khi "dọn" vẫn còn 1 dấu
      // phẩy thừa trước "}"/"]" và JSON.parse vẫn báo lỗi.
      let next = i + 1;
      while (next < json.length && /\s/.test(json[next])) {
        next++;
      }
      while (next < json.length && json[next] === ',') {
        next++;
        while (next < json.length && /\s/.test(json[next])) {
          next++;
        }
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
      // Xoá thông báo lỗi cũ ngay khi người dùng bắt đầu sửa lại input - nếu
      // không, lỗi của lần Format trước sẽ tiếp tục hiển thị (có thể không
      // còn đúng với nội dung mới) cho tới khi bấm Format lần nữa.
      state.error = null;
    },
    formatJson: (state) => {
      // Notepad trên Windows lưu file "UTF-8 with BOM" rất phổ biến khi gõ
      // tiếng Việt, để lại 1 ký tự BOM (U+FEFF) ẩn ở đầu chuỗi. `.trim()` coi
      // BOM là khoảng trắng nên input vẫn "trông" không rỗng, nhưng
      // `JSON.parse` gốc lại không chấp nhận BOM và báo lỗi cú pháp dù JSON
      // phía sau hoàn toàn hợp lệ - nên cắt bỏ BOM trước khi parse.
      const input = state.inputJson.replace(/^﻿/, '');

      if (!input.trim()) {
        state.error = 'Please enter a JSON string.';
        state.formattedJson = '';
        return;
      }

      try {
        const parsed = parsePreservingBigInt(stripTrailingCommas(input));
        state.formattedJson = stringifyPreservingBigInt(parsed, 2);
        state.error = null;
        // Format lại (không phải Clear) vẫn phải xoá trạng thái thu gọn cũ -
        // nếu không, node ở cùng path với JSON mới (dù cấu trúc khác hẳn) sẽ
        // "thừa hưởng" nhầm trạng thái thu gọn/mở rộng của JSON trước đó.
        state.collapsedPaths = {};
      } catch (err: unknown) {
        state.error =
          err instanceof Error
            ? `JSON syntax error: ${err.message}`
            : 'Unknown JSON syntax error.';
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
        // cây chỉ hiển thị khi formattedJson hợp lệ, nhưng vẫn có thể xảy ra
        // nếu path/giá trị gửi lên không khớp với cây hiện tại) - báo lỗi rõ
        // ràng cho người dùng thay vì âm thầm bỏ qua, khiến họ tưởng đã sửa
        // thành công trong khi giá trị không hề đổi.
        state.error = 'Could not apply this edit. Please re-format and try again.';
      }
    },
    // Đặt thông báo lỗi trực tiếp - dùng cho các lỗi phát sinh NGOÀI luồng
    // format/edit chính (vd Copy vào clipboard thất bại) nhưng vẫn cần hiện
    // lên cùng 1 banner đỏ để người dùng luôn thấy lỗi, không bị "nuốt" âm thầm.
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
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
  setError,
} = jsonFormatterSlice.actions;

export default jsonFormatterSlice.reducer;
