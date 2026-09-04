import { configureStore } from '@reduxjs/toolkit';
import sidebarReducer from './slices/sidebarSlice';
import jsonFormatterReducer from './slices/jsonFormatterSlice';
import xmlFormatterReducer from './slices/xmlFormatterSlice';
import sqlFormatterReducer from './slices/sqlFormatterSlice';
import jwtReducer from './slices/jwtSlice';
import dummyTextReducer from './slices/dummyTextSlice';
import textCompareReducer from './slices/textCompareSlice';
import fileCompareReducer from './slices/fileCompareSlice';
import uuidReducer from './slices/uuidSlice';
import passwordReducer from './slices/passwordSlice';
import qrCodeReducer from './slices/qrCodeSlice';
import timeConverterReducer from './slices/timeConverterSlice';
import regexReducer from './slices/regexSlice';
import unitConverterReducer from './slices/unitConverterSlice';
import colorPickerReducer from './slices/colorPickerSlice';
import markdownReducer from './slices/markdownSlice';
import htmlPreviewReducer from './slices/htmlPreviewSlice';

export const store = configureStore({
  reducer: {
    sidebar: sidebarReducer, // Gom các slices vào đây
    jsonFormatter: jsonFormatterReducer,
    xmlFormatter: xmlFormatterReducer,
    sqlFormatter: sqlFormatterReducer,
    jwt: jwtReducer,
    dummyText: dummyTextReducer,
    textCompare: textCompareReducer,
    fileCompare: fileCompareReducer,
    uuid: uuidReducer,
    password: passwordReducer,
    qrCode: qrCodeReducer,
    timeConverter: timeConverterReducer,
    regex: regexReducer,
    unitConverter: unitConverterReducer,
    colorPicker: colorPickerReducer,
    markdown: markdownReducer,
    htmlPreview: htmlPreviewReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // updateJsonValue có thể mang giá trị kiểu BigInt (dùng cho số nguyên
      // quá lớn để number giữ chính xác) - middleware mặc định của RTK coi
      // BigInt là "không serialize được" nên báo warning nhầm. State thực sự
      // lưu lại (formattedJson/inputJson) luôn là string đã stringify, nên
      // bỏ qua kiểm tra riêng cho path này là an toàn.
      serializableCheck: {
        ignoredActionPaths: ['payload.value'],
      },
    }),
});

// Type định nghĩa cho RootState và AppDispatch (Dùng chuẩn hóa cho TypeScript)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
