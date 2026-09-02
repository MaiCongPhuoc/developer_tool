// Dùng cho ống hút màu trên ảnh tải lên (fallback khi trình duyệt không hỗ
// trợ EyeDropper API - xem util/eyedropper.ts) - đọc 1 điểm ảnh bất kỳ trên
// ảnh do người dùng tải lên bằng Canvas API gốc của trình duyệt
// (getImageData), không cần thư viện ngoài. Vì ảnh đến từ file cục bộ
// (data: URL cùng origin, không phải URL cross-origin) nên canvas không bị
// "tainted" - đọc pixel bình thường, không gặp lỗi bảo mật CORS.

// 8MB đủ rộng rãi cho ảnh chụp màn hình/thiết kế thông thường, đồng thời
// tránh ảnh quá khổ làm chậm canvas/máy người dùng.
export const MAX_IMAGE_FILE_SIZE = 8 * 1024 * 1024;

export const validateImageFile = (file: File): string | null => {
  if (!file.type.startsWith('image/')) {
    return `"${file.name}" is not an image file.`;
  }
  if (file.size > MAX_IMAGE_FILE_SIZE) {
    return `"${file.name}" is too large (max ${
      MAX_IMAGE_FILE_SIZE / (1024 * 1024)
    }MB).`;
  }
  return null;
};

export const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => {
      reject(new Error(`Could not read "${file.name}".`));
    };
    reader.readAsDataURL(file);
  });
