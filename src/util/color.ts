import type { ColorFormat } from './interface/Type';

type Rgb = { r: number; g: number; b: number };
type Hsl = { h: number; s: number; l: number };

const parseHex = (value: string): Rgb => {
  const cleaned = value.trim().replace(/^#/, '');
  // Dạng rút gọn #RGB -> nhân đôi mỗi ký tự thành #RRGGBB (vd "f53" -> "ff5533").
  const expanded =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => c + c)
          .join('')
      : cleaned;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    throw new Error(
      `"${value}" is not a valid HEX color. Expected format: #RRGGBB or #RGB.`
    );
  }
  return {
    r: parseInt(expanded.slice(0, 2), 16),
    g: parseInt(expanded.slice(2, 4), 16),
    b: parseInt(expanded.slice(4, 6), 16),
  };
};

// Chấp nhận cả "255, 87, 51" lẫn "rgb(255, 87, 51)"/"rgba(255, 87, 51, 0.5)"
// cho tiện dán trực tiếp từ CSS - kênh alpha (nếu có) bị bỏ qua vì 3 định
// dạng HEX/RGB/HSL ở đây đều không lưu alpha.
const RGB_PATTERN =
  /^(?:rgba?\(\s*)?(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*[\d.]+\s*)?\)?$/i;

const parseRgb = (value: string): Rgb => {
  const match = value.trim().match(RGB_PATTERN);
  if (!match) {
    throw new Error(
      `"${value}" is not a valid RGB color. Expected format: r, g, b (e.g. 255, 87, 51).`
    );
  }
  const [r, g, b] = [match[1], match[2], match[3]].map(Number);
  if ([r, g, b].some((channel) => channel > 255)) {
    throw new Error('RGB values must be between 0 and 255.');
  }
  return { r, g, b };
};

const HSL_PATTERN =
  /^(?:hsla?\(\s*)?(-?[\d.]+)(?:deg)?\s*,\s*(-?[\d.]+)%?\s*,\s*(-?[\d.]+)%?\s*(?:,\s*[\d.]+\s*)?\)?$/i;

const parseHsl = (value: string): Rgb => {
  const match = value.trim().match(HSL_PATTERN);
  if (!match) {
    throw new Error(
      `"${value}" is not a valid HSL color. Expected format: h, s%, l% (e.g. 9, 100%, 60%).`
    );
  }
  const h = Number(match[1]);
  const s = Number(match[2]);
  const l = Number(match[3]);
  if (s < 0 || s > 100 || l < 0 || l > 100) {
    throw new Error('HSL saturation/lightness must be between 0 and 100.');
  }
  // Hue có tính tuần hoàn (360deg = 0deg) - đưa mọi giá trị (kể cả âm) về
  // đúng khoảng [0, 360) trước khi tính, thay vì báo lỗi.
  return hslToRgb({ h: ((h % 360) + 360) % 360, s, l });
};

// Công thức chuẩn HSL -> RGB (CSS Color Module Level 3).
const hslToRgb = ({ h, s, l }: Hsl): Rgb => {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (h < 60) [rp, gp, bp] = [c, x, 0];
  else if (h < 120) [rp, gp, bp] = [x, c, 0];
  else if (h < 180) [rp, gp, bp] = [0, c, x];
  else if (h < 240) [rp, gp, bp] = [0, x, c];
  else if (h < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];

  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  };
};

// Công thức chuẩn RGB -> HSL.
const rgbToHsl = ({ r, g, b }: Rgb): Hsl => {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rNorm) h = ((gNorm - bNorm) / delta) % 6;
    else if (max === gNorm) h = (bNorm - rNorm) / delta + 2;
    else h = (rNorm - gNorm) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const formatHex = ({ r, g, b }: Rgb): string =>
  `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase()}`;

const formatRgb = ({ r, g, b }: Rgb): string => `rgb(${r}, ${g}, ${b})`;

const formatHsl = (rgb: Rgb): string => {
  const { h, s, l } = rgbToHsl(rgb);
  return `hsl(${h}, ${s}%, ${l}%)`;
};

const parseColor = (value: string, format: ColorFormat): Rgb => {
  switch (format) {
    case 'hex':
      return parseHex(value);
    case 'rgb':
      return parseRgb(value);
    case 'hsl':
      return parseHsl(value);
  }
};

const formatColor = (rgb: Rgb, format: ColorFormat): string => {
  switch (format) {
    case 'hex':
      return formatHex(rgb);
    case 'rgb':
      return formatRgb(rgb);
    case 'hsl':
      return formatHsl(rgb);
  }
};

export const convertColor = (
  value: string,
  from: ColorFormat,
  to: ColorFormat
): string => formatColor(parseColor(value, from), to);

// Dùng riêng cho swatch xem trước màu trên UI - luôn trả về HEX bất kể định
// dạng đầu vào, để gán thẳng vào style backgroundColor. Trả về null thay vì
// ném lỗi vì đây chỉ là tiện ích hiển thị phụ, không nên làm hỏng luồng
// chính nếu giá trị chưa hợp lệ.
export const getColorPreviewHex = (
  value: string,
  format: ColorFormat
): string | null => {
  try {
    return formatHex(parseColor(value, format));
  } catch {
    return null;
  }
};
