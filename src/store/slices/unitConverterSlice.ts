import type { UnitConverterState } from '@/util/interface/Interface';
import type {
  ColorFormat,
  FontSizeUnit,
  NumberBaseUnit,
  TemperatureUnit,
  UnitConverterCategory,
} from '@/util/interface/Type';
import { convertColor } from '@/util/color';
import { convertCurrencyValue, fetchExchangeRates } from '@/util/currency';
import { convertNumberBase } from '@/util/numberBase';
import { convertTemperature } from '@/util/temperature';
import {
  CATEGORY_DEFAULT_UNITS,
  convertFontSize,
  convertUnit,
  formatUnitResult,
  UNIT_TABLES,
} from '@/util/units';
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

const initialState: UnitConverterState = {
  category: 'length',
  inputValue: '',
  fromUnit: CATEGORY_DEFAULT_UNITS.length.from,
  toUnit: CATEGORY_DEFAULT_UNITS.length.to,
  basePx: '16',
  result: '',
  error: null,
  copied: false,
  currencyRates: null,
  currencyRatesUpdatedAt: null,
};

// Chỉ chấp nhận số thập phân không âm thuần (cho phép dấu chấm vì độ dài/
// cân nặng thực tế thường không phải số nguyên) - không cho qua các dạng JS
// hiểu là số nhưng người dùng phổ thông không mong đợi (vd "1e2", "0x10").
const isPlainDecimal = (value: string): boolean => /^\d+(\.\d+)?$/.test(value);

type ThunkConfig = { state: { unitConverter: UnitConverterState }; rejectValue: string };

// Tải trước danh sách tỷ giá (không cần Value hợp lệ, không tính kết quả gì
// cả) - dispatch ngay khi người dùng CHUYỂN SANG tab Currency (xem
// UnitConverter.tsx: handleCategoryChange), để dropdown From/To có ngay đủ
// ~166 mã thay vì phải đợi bấm Convert lần đầu mới thấy danh sách đầy đủ
// (trước đó dropdown chỉ hiện tạm COMMON_CURRENCY_FALLBACK - 20 mã). Không
// làm gì nếu rates đã có sẵn trong cache.
export const loadCurrencyRates = createAsyncThunk<
  { rates: Record<string, number>; updatedAt: string } | null,
  void,
  ThunkConfig
>('unitConverter/loadCurrencyRates', async (_, { getState, rejectWithValue }) => {
  if (getState().unitConverter.currencyRates) {
    return null;
  }
  try {
    return await fetchExchangeRates();
  } catch (err) {
    return rejectWithValue(
      err instanceof Error ? err.message : 'Could not fetch exchange rates.'
    );
  }
});

// Nhóm 'currency' không có hệ số quy đổi cố định (tỷ giá đổi theo thời gian
// thực) nên KHÔNG thể là 1 reducer đồng bộ như `convert` bên dưới - phải gọi
// API bên ngoài (xem util/currency.ts). Chỉ thực sự fetch khi CHƯA có rates
// trong state (currencyRates === null) - nếu đã có (từ lần convert trước
// trong cùng phiên), tái sử dụng luôn, tránh gọi API thừa. Nhờ vậy, thời
// gian "chờ" người dùng thấy chính là thời gian chờ API THẬT (chỉ xảy ra ở
// lần đầu), không còn delay giả 2s như các nhóm đơn vị khác.
export const convertCurrency = createAsyncThunk<
  { result: string; rates: Record<string, number>; updatedAt: string },
  void,
  ThunkConfig
>('unitConverter/convertCurrency', async (_, { getState, rejectWithValue }) => {
  const state = getState().unitConverter;
  const trimmed = state.inputValue.trim();
  if (!trimmed || !isPlainDecimal(trimmed)) {
    return rejectWithValue('Please enter a valid number (0 or greater).');
  }
  const value = Number(trimmed);

  let rates = state.currencyRates;
  let updatedAt = state.currencyRatesUpdatedAt ?? '';
  if (!rates) {
    try {
      const snapshot = await fetchExchangeRates();
      rates = snapshot.rates;
      updatedAt = snapshot.updatedAt;
    } catch (err) {
      return rejectWithValue(
        err instanceof Error
          ? err.message
          : 'Could not fetch exchange rates.'
      );
    }
  }

  try {
    const result = convertCurrencyValue(
      value,
      rates,
      state.fromUnit,
      state.toUnit
    );
    return { result: formatUnitResult(result), rates, updatedAt };
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : 'Currency conversion failed.'
    );
  }
});

export const unitConverterSlice = createSlice({
  name: 'unitConverter',
  initialState,
  reducers: {
    setCategory: (state, action: PayloadAction<UnitConverterCategory>) => {
      state.category = action.payload;
      const defaults = CATEGORY_DEFAULT_UNITS[action.payload];
      state.fromUnit = defaults.from;
      state.toUnit = defaults.to;
      state.result = '';
      state.error = null;
    },
    setInputValue: (state, action: PayloadAction<string>) => {
      state.inputValue = action.payload;
      state.error = null;
    },
    setFromUnit: (state, action: PayloadAction<string>) => {
      state.fromUnit = action.payload;
    },
    setToUnit: (state, action: PayloadAction<string>) => {
      state.toUnit = action.payload;
    },
    setBasePx: (state, action: PayloadAction<string>) => {
      state.basePx = action.payload;
      state.error = null;
    },
    swapUnits: (state) => {
      const temp = state.fromUnit;
      state.fromUnit = state.toUnit;
      state.toUnit = temp;
    },
    convert: (state) => {
      // Nhóm 'currency' dùng thunk convertCurrency riêng ở trên (cần gọi
      // API) - reducer đồng bộ này không xử lý được nhóm đó. Guard này chỉ
      // mang tính phòng vệ vì UI luôn dispatch đúng action theo category;
      // đồng thời giúp TypeScript thu hẹp kiểu category cho đoạn code bên
      // dưới (UNIT_TABLES không có khoá 'currency').
      if (state.category === 'currency') {
        return;
      }

      const trimmed = state.inputValue.trim();

      // color/numberBase quy đổi CÁCH BIỂU DIỄN chứ không phải giá trị số
      // học đơn thuần, nên không dùng chung isPlainDecimal (vốn chỉ chấp
      // nhận số thập phân không âm) như các nhóm còn lại.
      if (state.category === 'color') {
        if (!trimmed) {
          state.error = 'Please enter a color value to convert.';
          state.result = '';
          return;
        }
        try {
          state.result = convertColor(
            trimmed,
            state.fromUnit as ColorFormat,
            state.toUnit as ColorFormat
          );
          state.error = null;
        } catch (err: unknown) {
          state.error =
            err instanceof Error ? err.message : 'Invalid color value.';
          state.result = '';
        }
        return;
      }

      if (state.category === 'numberBase') {
        if (!trimmed) {
          state.error = 'Please enter a value to convert.';
          state.result = '';
          return;
        }
        try {
          state.result = convertNumberBase(
            trimmed,
            state.fromUnit as NumberBaseUnit,
            state.toUnit as NumberBaseUnit
          );
          state.error = null;
        } catch (err: unknown) {
          state.error = err instanceof Error ? err.message : 'Invalid number.';
          state.result = '';
        }
        return;
      }

      // Nhiệt độ có thể âm (vd -40°C) - khác length/weight/storage không
      // bao giờ âm - nên cần regex số có dấu riêng, không dùng isPlainDecimal.
      if (state.category === 'temperature') {
        const isSignedDecimal = /^-?\d+(\.\d+)?$/.test(trimmed);
        if (!trimmed || !isSignedDecimal) {
          state.error = 'Please enter a valid number.';
          state.result = '';
          return;
        }
        try {
          const result = convertTemperature(
            Number(trimmed),
            state.fromUnit as TemperatureUnit,
            state.toUnit as TemperatureUnit
          );
          state.result = formatUnitResult(result);
          state.error = null;
        } catch (err: unknown) {
          state.error =
            err instanceof Error ? err.message : 'Conversion failed.';
          state.result = '';
        }
        return;
      }

      if (!trimmed || !isPlainDecimal(trimmed)) {
        state.error = 'Please enter a valid number (0 or greater).';
        state.result = '';
        return;
      }
      const value = Number(trimmed);

      if (state.category === 'fontSize') {
        const basePxTrimmed = state.basePx.trim();
        const basePxValue = Number(basePxTrimmed);
        if (
          !basePxTrimmed ||
          !isPlainDecimal(basePxTrimmed) ||
          basePxValue <= 0
        ) {
          state.error = 'Base font size must be a number greater than 0.';
          state.result = '';
          return;
        }

        const result = convertFontSize(
          value,
          state.fromUnit as FontSizeUnit,
          state.toUnit as FontSizeUnit,
          basePxValue
        );
        state.result = formatUnitResult(result);
        state.error = null;
        return;
      }

      const units = UNIT_TABLES[state.category];
      try {
        const result = convertUnit(value, units, state.fromUnit, state.toUnit);
        state.result = formatUnitResult(result);
        state.error = null;
      } catch (err: unknown) {
        state.error =
          err instanceof Error ? err.message : 'Conversion failed.';
        state.result = '';
      }
    },
    // Giữ lại cache tỷ giá (currencyRates/currencyRatesUpdatedAt) thay vì
    // xoá sạch như mọi field khác - rời trang rồi quay lại (hoặc bấm Clear)
    // không nên bắt người dùng chờ gọi lại API trong khi tỷ giá 1 ngày mới
    // đổi 1 lần. Chỉ mất cache khi reload lại cả trang thật.
    clearUnitConverter: (state) => ({
      ...initialState,
      currencyRates: state.currencyRates,
      currencyRatesUpdatedAt: state.currencyRatesUpdatedAt,
    }),
    setCopied: (state, action: PayloadAction<boolean>) => {
      state.copied = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCurrencyRates.fulfilled, (state, action) => {
        if (action.payload) {
          state.currencyRates = action.payload.rates;
          state.currencyRatesUpdatedAt = action.payload.updatedAt;
        }
      })
      .addCase(loadCurrencyRates.rejected, (state, action) => {
        state.error = action.payload ?? 'Could not fetch exchange rates.';
      })
      .addCase(convertCurrency.fulfilled, (state, action) => {
        state.result = action.payload.result;
        state.currencyRates = action.payload.rates;
        state.currencyRatesUpdatedAt = action.payload.updatedAt;
        state.error = null;
      })
      .addCase(convertCurrency.rejected, (state, action) => {
        state.result = '';
        state.error = action.payload ?? 'Could not convert currency.';
      });
  },
});

export const {
  setCategory,
  setInputValue,
  setFromUnit,
  setToUnit,
  setBasePx,
  swapUnits,
  convert,
  clearUnitConverter,
  setCopied,
  setError,
} = unitConverterSlice.actions;

export default unitConverterSlice.reducer;
