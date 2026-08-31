import QRCode from 'qrcode';

// Version 40 (kích thước tối đa của QR code) ở mức sửa lỗi M chỉ chứa được
// tối đa 2331 byte dữ liệu dạng byte-mode (bảng tra của chuẩn QR). Đặt mốc
// thấp hơn 1 chút để còn dư chỗ, tránh sát ngưỡng khiến thư viện tự báo lỗi
// khó hiểu ("data too big") thay vì thông báo rõ ràng của mình.
export const MAX_QR_BYTES = 2000;

const QR_CODE_OPTIONS = {
  errorCorrectionLevel: 'M' as const,
  margin: 2,
  width: 280,
};

// Độ dài tính theo byte sau khi encode UTF-8 - dùng để so với MAX_QR_BYTES vì
// dung lượng QR code tính theo byte, không phải theo số ký tự (1 ký tự tiếng
// Việt có dấu chiếm nhiều hơn 1 byte).
export const getUtf8ByteLength = (text: string): number =>
  new TextEncoder().encode(text).length;

export const generateQrCodeDataUrl = (text: string): Promise<string> =>
  QRCode.toDataURL(text, QR_CODE_OPTIONS);

export const generateQrCodeSvg = (text: string): Promise<string> =>
  QRCode.toString(text, { ...QR_CODE_OPTIONS, type: 'svg' });

// Dùng chung cho cả tải PNG (href là data: URL) và SVG (href là blob: URL) -
// tạo 1 thẻ <a download> tạm, bấm rồi gỡ ngay, không cần thêm UI ẩn trong JSX.
export const triggerDownload = (href: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const svgToObjectUrl = (svg: string): string =>
  URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
