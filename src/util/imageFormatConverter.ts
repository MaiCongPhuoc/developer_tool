import type { ImageOutputFormat } from '@/util/interface/Type';
import {
  getDataUrlByteSize,
  loadImageElement,
  MAX_SOURCE_IMAGE_SIZE,
  validateSourceImage,
} from '@/util/imageCompressor';

// Tái dùng nguyên logic đọc ảnh/kiểm tra file hợp lệ từ Image Compressor (2
// trang cùng thao tác trên 1 ảnh tải lên qua Canvas API, không có lý do chọn
// giới hạn dung lượng khác nhau) - tránh copy lại y hệt logic.
export { loadImageElement, MAX_SOURCE_IMAGE_SIZE, validateSourceImage };

const FORMAT_EXTENSIONS: Record<ImageOutputFormat, string> = {
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/png': 'png',
};

export const buildConvertedFileName = (
  originalName: string,
  format: ImageOutputFormat
): string => {
  const extension = FORMAT_EXTENSIONS[format];
  const dotIndex = originalName.lastIndexOf('.');
  const baseName = dotIndex === -1 ? originalName : originalName.slice(0, dotIndex);
  return `${baseName}-converted.${extension}`;
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const cleaned = hex.replace('#', '');
  return {
    r: parseInt(cleaned.slice(0, 2), 16),
    g: parseInt(cleaned.slice(2, 4), 16),
    b: parseInt(cleaned.slice(4, 6), 16),
  };
};

// Khoảng cách Euclid xa nhất có thể giữa 2 màu RGB (đen và trắng) - dùng để
// quy đổi tolerance dạng % (0-100, dễ hiểu với người dùng) sang ngưỡng
// khoảng cách màu tuyệt đối.
const MAX_RGB_DISTANCE = Math.sqrt(3 * 255 * 255);

// Xoá nền theo màu (chroma-key đơn giản): mọi pixel có màu đủ GẦN bgColor
// (trong ngưỡng tolerancePercent) sẽ bị đặt alpha = 0 (trong suốt hoàn
// toàn). Đây KHÔNG PHẢI xoá nền bằng AI/nhận diện chủ thể (việc đó cần 1
// model nhận diện ảnh, ngoài khả năng của Canvas API gốc trình duyệt) - chỉ
// hoạt động tốt với ảnh có nền PHẲNG, 1 màu (ảnh sản phẩm chụp phông nền
// trắng, logo...). Ảnh có nền phức tạp (nhiều màu, có bóng đổ, hoạ tiết) sẽ
// cho kết quả không sạch - cần tăng tolerance để bắt hết nền, đổi lại dễ ăn
// lẹm vào chủ thể nếu chủ thể có màu gần giống nền.
const applyBackgroundRemoval = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bgColor: string,
  tolerancePercent: number
): void => {
  const { r: bgR, g: bgG, b: bgB } = hexToRgb(bgColor);
  const threshold = (tolerancePercent / 100) * MAX_RGB_DISTANCE;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const dr = data[i] - bgR;
    const dg = data[i + 1] - bgG;
    const db = data[i + 2] - bgB;
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);
    if (distance <= threshold) {
      data[i + 3] = 0;
    }
  }
  ctx.putImageData(imageData, 0, 0);
};

export type ConvertImageOptions = {
  format: ImageOutputFormat;
  // 0..1 - chỉ có tác dụng với JPEG/WebP (lossy); PNG luôn lossless nên
  // trình duyệt bỏ qua tham số này (xem MDN HTMLCanvasElement.toDataURL()).
  quality: number;
  removeBackground: boolean;
  bgColor: string;
  // 0..100
  bgTolerance: number;
};

export type ConvertImageResult = {
  dataUrl: string;
  width: number;
  height: number;
  byteSize: number;
  // Định dạng THẬT SỰ được trình duyệt xuất ra - xem comment actualFormat ở
  // util/imageCompressor.ts (hiếm gặp, chủ yếu trình duyệt cũ chưa hỗ trợ WebP).
  actualFormat: ImageOutputFormat;
};

// Đổi định dạng ảnh (và xoá nền theo màu, nếu bật) hoàn toàn bằng Canvas API
// gốc của trình duyệt - vẽ lại ảnh gốc lên canvas rồi xuất qua toDataURL với
// định dạng đích, không cần thư viện xử lý ảnh ngoài nào.
export const convertImage = async (
  sourceDataUrl: string,
  options: ConvertImageOptions
): Promise<ConvertImageResult> => {
  const img = await loadImageElement(sourceDataUrl);
  const width = img.naturalWidth;
  const height = img.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  // willReadFrequently báo trước cho trình duyệt biết canvas này sẽ bị đọc
  // lại pixel (getImageData) ngay sau khi vẽ - trình duyệt có thể chọn cách
  // dựng canvas tối ưu hơn cho việc đọc thay vì chỉ để hiển thị.
  const ctx = canvas.getContext('2d', { willReadFrequently: options.removeBackground });
  if (!ctx) {
    throw new Error('Canvas is not supported in this browser.');
  }

  // JPEG không có kênh alpha - vùng trong suốt của ảnh nguồn (vd PNG) sẽ bị
  // trình duyệt tự động lấp bằng màu ĐEN khi encode nếu không tô nền trước
  // (giống hành vi ở util/imageCompressor.ts).
  if (options.format === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);

  // Xoá nền chỉ có ý nghĩa khi định dạng đích còn giữ được kênh alpha vừa
  // tạo ra (PNG/WebP) - với JPEG, bước tô nền trắng ở trên đã "khoá" pixel,
  // và JPEG sẽ bỏ luôn alpha khi encode nên xoá nền ở đây là vô ích.
  if (options.removeBackground && options.format !== 'image/jpeg') {
    applyBackgroundRemoval(ctx, width, height, options.bgColor, options.bgTolerance);
  }

  const dataUrl = canvas.toDataURL(options.format, options.quality);
  const actualFormat: ImageOutputFormat = dataUrl.startsWith('data:image/png')
    ? 'image/png'
    : options.format;

  return {
    dataUrl,
    width,
    height,
    byteSize: getDataUrlByteSize(dataUrl),
    actualFormat,
  };
};

// Lấy màu tại 1 điểm ảnh cụ thể trên ảnh gốc (mặc định góc trên-trái) để gợi
// ý màu nền - hữu ích vì đa số ảnh nền phẳng có màu nền đồng nhất ngay tại
// góc ảnh, giúp người dùng khỏi phải tự đoán/gõ tay mã màu nền chính xác.
export const sampleCornerColor = async (dataUrl: string): Promise<string> => {
  const img = await loadImageElement(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Canvas is not supported in this browser.');
  }
  ctx.drawImage(img, 0, 0);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
};
