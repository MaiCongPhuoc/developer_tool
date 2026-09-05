import type { ImageOutputFormat } from '@/util/interface/Type';

// 20MB đủ rộng rãi cho ảnh chụp từ điện thoại/máy ảnh hiện đại (thường 3-15MB)
// - mục đích của trang này chính là nén những ảnh nặng như vậy xuống còn vài
// trăm KB, nên giới hạn phải cao hơn hẳn mức 8MB của trang Color Picker
// (util/imagePixel.ts), vốn chỉ cần đủ dùng cho ảnh chụp màn hình thông thường.
export const MAX_SOURCE_IMAGE_SIZE = 20 * 1024 * 1024;

export const validateSourceImage = (file: File): string | null => {
  if (!file.type.startsWith('image/')) {
    return `"${file.name}" is not an image file.`;
  }
  if (file.size > MAX_SOURCE_IMAGE_SIZE) {
    return `"${file.name}" is too large (max ${
      MAX_SOURCE_IMAGE_SIZE / (1024 * 1024)
    }MB).`;
  }
  return null;
};

// Đọc kích thước thật (naturalWidth/Height) của 1 ảnh từ data URL - cần tải
// qua thẻ <img> vì đây là cách duy nhất trong trình duyệt để biết kích thước
// pixel gốc trước khi vẽ lên canvas.
export const loadImageElement = (dataUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      reject(new Error('Could not read this image. The file may be corrupted or in an unsupported format.'));
    };
    img.src = dataUrl;
  });

// Chỉ co nhỏ (không bao giờ phóng to) - ảnh vốn đã nhỏ hơn maxDimension thì
// giữ nguyên kích thước gốc, phóng to chỉ làm ảnh mờ đi mà không giảm dung
// lượng theo mục đích của trang này.
export const computeScaledDimensions = (
  width: number,
  height: number,
  maxDimension: number | null
): { width: number; height: number } => {
  if (!maxDimension || maxDimension <= 0) return { width, height };

  const longestSide = Math.max(width, height);
  if (longestSide <= maxDimension) return { width, height };

  const scale = maxDimension / longestSide;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

// Đọc dung lượng byte THẬT của 1 data URL base64 mà không cần giải mã toàn bộ
// (Blob/atob) - áp dụng công thức chuẩn base64: mỗi 4 ký tự mã hoá 3 byte,
// trừ đi số dấu "=" đệm ở cuối (0/1/2 byte thiếu).
export const getDataUrlByteSize = (dataUrl: string): number => {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const paddingMatch = base64.match(/=+$/);
  const padding = paddingMatch ? paddingMatch[0].length : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
};

const FORMAT_EXTENSIONS: Record<ImageOutputFormat, string> = {
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/png': 'png',
};

export const buildCompressedFileName = (
  originalName: string,
  format: ImageOutputFormat
): string => {
  const extension = FORMAT_EXTENSIONS[format];
  const dotIndex = originalName.lastIndexOf('.');
  const baseName = dotIndex === -1 ? originalName : originalName.slice(0, dotIndex);
  return `${baseName}-compressed.${extension}`;
};

export type CompressImageOptions = {
  format: ImageOutputFormat;
  // 0..1 - chỉ có tác dụng với JPEG/WebP (lossy); PNG luôn nén lossless nên
  // trình duyệt bỏ qua tham số này (xem MDN HTMLCanvasElement.toDataURL()).
  quality: number;
  // null/0 = giữ nguyên kích thước gốc, không resize.
  maxDimension: number | null;
};

export type CompressImageResult = {
  dataUrl: string;
  width: number;
  height: number;
  byteSize: number;
  // Định dạng THẬT SỰ được trình duyệt xuất ra - khác `options.format` trong
  // trường hợp hiếm gặp trình duyệt không hỗ trợ encode định dạng yêu cầu:
  // theo chuẩn, canvas.toDataURL() sẽ tự âm thầm trả về PNG thay vì lỗi.
  actualFormat: ImageOutputFormat;
};

// Nén ảnh hoàn toàn bằng Canvas API gốc của trình duyệt (vẽ lại ảnh lên canvas
// theo đúng kích thước đã tính, rồi xuất qua toDataURL với quality mong muốn)
// - không cần thư viện nén ảnh ngoài nào, tương tự cách Color Picker tự đọc
// pixel bằng canvas thay vì dùng thư viện xử lý ảnh.
export const compressImage = async (
  sourceDataUrl: string,
  options: CompressImageOptions
): Promise<CompressImageResult> => {
  const img = await loadImageElement(sourceDataUrl);
  const { width, height } = computeScaledDimensions(
    img.naturalWidth,
    img.naturalHeight,
    options.maxDimension
  );

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas is not supported in this browser.');
  }

  // JPEG không có kênh alpha - vùng trong suốt của ảnh nguồn (vd PNG) sẽ bị
  // trình duyệt tự động lấp bằng màu ĐEN khi encode nếu không tô nền trước.
  // Tô trắng trước khi vẽ ảnh lên trên để giống hành vi "flatten" thông
  // thường của các trình chỉnh sửa ảnh khi xuất JPEG.
  if (options.format === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);

  const dataUrl = canvas.toDataURL(options.format, options.quality);
  // Theo chuẩn, nếu trình duyệt không hỗ trợ encode định dạng yêu cầu, nó
  // luôn âm thầm trả về PNG thay vì báo lỗi - kiểm tra lại để biết có xảy ra
  // fallback này không (hiếm gặp, chủ yếu ở trình duyệt cũ chưa hỗ trợ WebP).
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
