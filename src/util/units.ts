import type {
  ColorFormat,
  FontSizeUnit,
  NumberBaseUnit,
  TemperatureUnit,
  UnitConverterCategory,
} from './interface/Type';

export type UnitDefinition = {
  id: string;
  label: string;
  // Hệ số quy đổi 1 đơn vị này ra đơn vị cơ sở chung của cả nhóm (m cho
  // length, kg cho weight, byte cho storage). Quy đổi giữa 2 đơn vị bất kỳ
  // trong cùng nhóm luôn đi qua bước trung gian này: value * factor(from)
  // -> giá trị theo đơn vị cơ sở -> / factor(to).
  factor: number;
};

export const LENGTH_UNITS: UnitDefinition[] = [
  { id: 'km', label: 'Kilometer (km)', factor: 1000 },
  { id: 'm', label: 'Meter (m)', factor: 1 },
  { id: 'dm', label: 'Decimeter (dm)', factor: 0.1 },
  { id: 'cm', label: 'Centimeter (cm)', factor: 0.01 },
  { id: 'mm', label: 'Millimeter (mm)', factor: 0.001 },
  { id: 'um', label: 'Micrometer (µm)', factor: 0.000001 },
  { id: 'mi', label: 'Mile (mi)', factor: 1609.344 },
  { id: 'yd', label: 'Yard (yd)', factor: 0.9144 },
  { id: 'ft', label: 'Foot (ft)', factor: 0.3048 },
  { id: 'in', label: 'Inch (in)', factor: 0.0254 },
];

// Tấn/Tạ/Yến là đơn vị đo khối lượng quen thuộc ở Việt Nam - theo đúng cách
// dùng phổ biến: 1 tấn = 1000kg, 1 tạ = 100kg, 1 yến = 10kg.
export const WEIGHT_UNITS: UnitDefinition[] = [
  { id: 'ton', label: 'Tấn (ton) - 1000kg', factor: 1000 },
  { id: 'ta', label: 'Tạ (quintal) - 100kg', factor: 100 },
  { id: 'yen', label: 'Yến - 10kg', factor: 10 },
  { id: 'kg', label: 'Kilogram (kg)', factor: 1 },
  { id: 'g', label: 'Gram (g)', factor: 0.001 },
  { id: 'mg', label: 'Milligram (mg)', factor: 0.000001 },
  { id: 'lb', label: 'Pound (lb/lbs)', factor: 0.45359237 },
  { id: 'oz', label: 'Ounce (oz)', factor: 0.028349523125 },
];

// Quy ước dùng bội số nhị phân 1024 (1 KB = 1024 B, 1 MB = 1024 KB...) -
// đúng theo cách các công cụ dev quen dùng cho "dung lượng lưu trữ" (giống
// cách Windows/macOS hiển thị dung lượng file), dù về mặt SI thuần tuý
// KB/MB/GB lẽ ra phải là bội số 1000 (đơn vị nhị phân chuẩn IEC gọi là
// KiB/MiB/GiB) - đây là điểm khác biệt nên biết khi so sánh với 1 số công cụ
// khác dùng quy ước 1000.
export const STORAGE_UNITS: UnitDefinition[] = [
  { id: 'bit', label: 'Bit', factor: 1 / 8 },
  { id: 'B', label: 'Byte (B)', factor: 1 },
  { id: 'KB', label: 'Kilobyte (KB)', factor: 1024 },
  { id: 'MB', label: 'Megabyte (MB)', factor: 1024 ** 2 },
  { id: 'GB', label: 'Gigabyte (GB)', factor: 1024 ** 3 },
  { id: 'TB', label: 'Terabyte (TB)', factor: 1024 ** 4 },
  { id: 'PB', label: 'Petabyte (PB)', factor: 1024 ** 5 },
];

export const FONT_SIZE_UNITS: { id: FontSizeUnit; label: string }[] = [
  { id: 'px', label: 'Pixel (px)' },
  { id: 'rem', label: 'Root em (rem)' },
  { id: 'em', label: 'Em (em)' },
  { id: '%', label: 'Percent (%)' },
];

export const TEMPERATURE_UNITS: { id: TemperatureUnit; label: string }[] = [
  { id: 'celsius', label: 'Celsius (°C)' },
  { id: 'fahrenheit', label: 'Fahrenheit (°F)' },
  { id: 'kelvin', label: 'Kelvin (K)' },
];

export const NUMBER_BASE_UNITS: { id: NumberBaseUnit; label: string }[] = [
  { id: 'decimal', label: 'Decimal (Base 10)' },
  { id: 'binary', label: 'Binary (Base 2)' },
  { id: 'octal', label: 'Octal (Base 8)' },
  { id: 'hexadecimal', label: 'Hexadecimal (Base 16)' },
];

export const COLOR_FORMAT_UNITS: { id: ColorFormat; label: string }[] = [
  { id: 'hex', label: 'HEX' },
  { id: 'rgb', label: 'RGB' },
  { id: 'hsl', label: 'HSL' },
];

// Chỉ 3 nhóm này có hệ số quy đổi CỐ ĐỊNH tính offline được - fontSize cần
// thêm basePx (xem convertFontSize), currency cần tỷ giá sống từ API (xem
// util/currency.ts) nên cả 2 không thuộc bảng này.
export const UNIT_TABLES: Record<'length' | 'weight' | 'storage', UnitDefinition[]> = {
  length: LENGTH_UNITS,
  weight: WEIGHT_UNITS,
  storage: STORAGE_UNITS,
};

export const CATEGORY_DEFAULT_UNITS: Record<
  UnitConverterCategory,
  { from: string; to: string }
> = {
  length: { from: 'm', to: 'km' },
  weight: { from: 'kg', to: 'g' },
  storage: { from: 'MB', to: 'GB' },
  fontSize: { from: 'px', to: 'rem' },
  currency: { from: 'USD', to: 'VND' },
  temperature: { from: 'celsius', to: 'fahrenheit' },
  numberBase: { from: 'decimal', to: 'hexadecimal' },
  color: { from: 'hex', to: 'rgb' },
};

// Quy đổi giữa 2 đơn vị bất kỳ trong CÙNG 1 bảng (length/weight/storage) -
// đi qua đơn vị cơ sở chung của bảng đó (xem factor ở UnitDefinition).
export const convertUnit = (
  value: number,
  units: UnitDefinition[],
  fromId: string,
  toId: string
): number => {
  const from = units.find((u) => u.id === fromId);
  const to = units.find((u) => u.id === toId);
  if (!from || !to) {
    throw new Error('Unknown unit selected.');
  }
  const base = value * from.factor;
  return base / to.factor;
};

// px/rem/em/% là đơn vị TƯƠNG ĐỐI (phụ thuộc ngữ cảnh CSS thực tế: rem theo
// font-size của <html>, em theo font-size của phần tử cha, % cũng theo 1 giá
// trị tham chiếu khác) - không có hệ số quy đổi cố định như length/weight.
// Để đơn giản hoá thành 1 phép quy đổi có thể tính được, công cụ này quy ước:
// coi em tính giống hệt rem (không rõ font-size của phần tử cha thực tế),
// và % là phần trăm so với chính basePx. Đây là quy ước phổ biến của hầu hết
// các "px to rem converter" online, không phải hành vi CSS chính xác 100%
// trong mọi trường hợp lồng nhau - luôn hiện rõ giả định này trên giao diện.
export const convertFontSize = (
  value: number,
  from: FontSizeUnit,
  to: FontSizeUnit,
  basePx: number
): number => {
  let ratio: number;
  switch (from) {
    case 'px':
      ratio = value / basePx;
      break;
    case 'rem':
    case 'em':
      ratio = value;
      break;
    case '%':
      ratio = value / 100;
      break;
  }

  switch (to) {
    case 'px':
      return ratio * basePx;
    case 'rem':
    case 'em':
      return ratio;
    case '%':
      return ratio * 100;
  }
};

// Làm tròn tới 6 chữ số thập phân rồi bỏ số 0 thừa ở cuối, tránh hiện artifact
// dấu phẩy động kiểu "3.1799999999999997" lên màn hình.
export const formatUnitResult = (value: number): string => {
  if (!Number.isFinite(value)) return '0';
  return Number(value.toFixed(6)).toString();
};
