import type { TemperatureUnit } from './interface/Type';

// Nhiệt độ cần phép biến đổi AFFINE (có cả nhân lẫn cộng, vd F = C*9/5 + 32),
// khác hẳn length/weight/storage chỉ cần nhân đơn thuần với 1 hệ số cố định -
// vì vậy không dùng chung được UnitDefinition/convertUnit ở util/units.ts.
// Quy đổi qua Celsius làm đơn vị trung gian, giống cách length/weight quy
// qua m/kg.
const toCelsius = (value: number, from: TemperatureUnit): number => {
  switch (from) {
    case 'celsius':
      return value;
    case 'fahrenheit':
      return (value - 32) * (5 / 9);
    case 'kelvin':
      return value - 273.15;
  }
};

const fromCelsius = (celsius: number, to: TemperatureUnit): number => {
  switch (to) {
    case 'celsius':
      return celsius;
    case 'fahrenheit':
      return celsius * (9 / 5) + 32;
    case 'kelvin':
      return celsius + 273.15;
  }
};

const ABSOLUTE_ZERO_CELSIUS = -273.15;

export const convertTemperature = (
  value: number,
  from: TemperatureUnit,
  to: TemperatureUnit
): number => {
  const celsius = toCelsius(value, from);
  // Làm tròn nhẹ trước khi so sánh - sai số dấu phẩy động (vd
  // -273.15000000000003 do phép trừ 0-273.15) có thể khiến giá trị đúng ngay
  // tại 0 Kelvin bị đánh giá nhầm là "dưới không tuyệt đối".
  const roundedCelsius = Math.round(celsius * 1e9) / 1e9;
  if (roundedCelsius < ABSOLUTE_ZERO_CELSIUS) {
    throw new Error(
      'Temperature cannot be below absolute zero (-273.15°C / -459.67°F / 0K).'
    );
  }
  return fromCelsius(celsius, to);
};
