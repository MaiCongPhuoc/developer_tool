import { getDataUrlByteSize } from '@/util/imageCompressor';
import type { DocumentConversionQuality, DocumentFormat } from '@/util/interface/Type';

// 15MB - văn phòng (docx/xlsx/pdf) hiếm khi lớn hơn mức này trừ khi nhúng rất
// nhiều ảnh/media độ phân giải cao; đủ rộng rãi cho hầu hết nhu cầu thực tế
// trong khi vẫn tránh việc mammoth/xlsx/pdfjs phải xử lý file quá khổ ngay
// trên trình duyệt (không có backend nào san sẻ việc này).
export const MAX_SOURCE_DOCUMENT_SIZE = 15 * 1024 * 1024;

// PDF quá nhiều trang sẽ tạo ra file .pptx khổng lồ (mỗi trang = 1 ảnh full-
// slide) và khiến trình duyệt phải render hàng loạt canvas liên tiếp - giới
// hạn này chỉ áp dụng riêng cho chiều PDF -> PowerPoint.
export const MAX_PDF_PAGES_FOR_PPTX = 30;

const getExtension = (fileName: string): string => {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex === -1 ? '' : fileName.slice(dotIndex).toLowerCase();
};

const DOCX_EXTENSIONS = new Set(['.docx']);
const LEGACY_WORD_EXTENSIONS = new Set(['.doc']);
const EXCEL_EXTENSIONS = new Set(['.xlsx', '.xls', '.csv']);
const PDF_EXTENSIONS = new Set(['.pdf']);
const POWERPOINT_EXTENSIONS = new Set(['.pptx', '.ppt']);

export type FormatDetectionResult = { format: DocumentFormat } | { error: string };

// Chỉ dựa vào ĐUÔI FILE để nhận diện định dạng, không dựa vào MIME type của
// trình duyệt - MIME type của file văn phòng không đáng tin cậy (nhiều hệ
// điều hành/trình duyệt trả về "application/octet-stream" chung chung cho cả
// .docx lẫn .xlsx), trong khi đuôi file luôn rõ ràng.
export const detectSourceFormat = (file: File): FormatDetectionResult => {
  const ext = getExtension(file.name);

  if (DOCX_EXTENSIONS.has(ext)) return { format: 'docx' };
  if (LEGACY_WORD_EXTENSIONS.has(ext)) {
    return {
      error: `"${file.name}" is a legacy Word file (.doc), which isn't supported - open it in Word, use "Save As" to convert it to .docx, then try again.`,
    };
  }
  if (EXCEL_EXTENSIONS.has(ext)) return { format: 'xlsx' };
  if (PDF_EXTENSIONS.has(ext)) return { format: 'pdf' };
  if (POWERPOINT_EXTENSIONS.has(ext)) {
    return {
      error:
        'PowerPoint files (.ppt/.pptx) can only be created here, not read yet - please choose a Word, Excel, or PDF file as the source instead.',
    };
  }
  return {
    error: `"${file.name}" is not a supported format (only .docx, .xlsx/.xls/.csv, and .pdf are accepted).`,
  };
};

export const validateSourceDocument = (file: File): FormatDetectionResult => {
  const detected = detectSourceFormat(file);
  if ('error' in detected) return detected;
  if (file.size > MAX_SOURCE_DOCUMENT_SIZE) {
    return {
      error: `"${file.name}" is too large (max ${MAX_SOURCE_DOCUMENT_SIZE / (1024 * 1024)}MB).`,
    };
  }
  return detected;
};

// Với mỗi định dạng đích, đây là định dạng nguồn "quen thuộc nhất" người
// dùng thường muốn convert tới - dùng làm giá trị mặc định của targetFormat
// mỗi khi chọn 1 file nguồn mới, để tránh mặc định trúng ngay chính định
// dạng nguồn (convert file sang chính nó là vô nghĩa).
export const getDefaultTargetFormat = (sourceFormat: DocumentFormat): DocumentFormat =>
  sourceFormat === 'pdf' ? 'docx' : 'pdf';

const CONVERSION_QUALITY: Record<DocumentFormat, Partial<Record<DocumentFormat, DocumentConversionQuality>>> = {
  docx: { pdf: 'high', xlsx: 'basic', pptx: 'basic' },
  xlsx: { pdf: 'high', docx: 'high', pptx: 'high' },
  pdf: { docx: 'basic', xlsx: 'basic', pptx: 'image' },
  pptx: {},
};

export const getConversionQuality = (
  source: DocumentFormat,
  target: DocumentFormat
): DocumentConversionQuality | null => CONVERSION_QUALITY[source]?.[target] ?? null;

export const CONVERSION_QUALITY_LABEL: Record<DocumentConversionQuality, string> = {
  high: 'High quality - keeps tables/core formatting',
  basic: 'Basic - keeps text content only, loses tables/layout',
  image: 'Image-based - each PDF page becomes a slide image, visually accurate but text is not editable',
};

// ---- Chuyển đổi qua lại giữa base64 data URL (lưu trong Redux, giống
// pattern originalDataUrl của ImageFormatConverterState) và ArrayBuffer/Blob
// (dạng mà mammoth/xlsx/pdfjs/docx/pptxgenjs thực sự cần để xử lý). ----

export const dataUrlToArrayBuffer = (dataUrl: string): ArrayBuffer => {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
};

export const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Could not read the generated file.'));
    reader.readAsDataURL(blob);
  });

export { getDataUrlByteSize };

export const MIME_BY_FORMAT: Record<DocumentFormat, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

const EXTENSION_BY_FORMAT: Record<DocumentFormat, string> = {
  docx: 'docx',
  xlsx: 'xlsx',
  pdf: 'pdf',
  pptx: 'pptx',
};

export const buildConvertedFileName = (originalName: string, format: DocumentFormat): string => {
  const dotIndex = originalName.lastIndexOf('.');
  const baseName = dotIndex === -1 ? originalName : originalName.slice(0, dotIndex);
  return `${baseName}-converted.${EXTENSION_BY_FORMAT[format]}`;
};



// ---- Các hàm xử lý NẶNG: chỉ nạp thư viện (docx, xlsx, pdf.js, pptxgenjs,
// jspdf, html2canvas, mammoth, jszip - tổng hơn 2MB) ngay lúc người dùng thực
// sự bấm chuyển đổi, thay vì nhét vào bundle JS chính khiến MỌI trang phải tải
// và chạy chúng ngay từ đầu (trên điện thoại sẽ làm các nút bấm "đơ" vài giây).
// Giữ nguyên tên và chữ ký hàm để DocumentConverter.tsx không phải đổi cách dùng.
type HeavyModule = typeof import('./documentConverterHeavy');
const loadHeavy = () => import('./documentConverterHeavy');

export type {
  DocxSourceData,
  InjectableXlsxImage,
  ParsedSource,
  PdfSourceData,
  XlsxEmbeddedImage,
  XlsxSheetData,
  XlsxSourceData,
} from './documentConverterHeavy';

export const parseDocxSource = (...args: Parameters<HeavyModule['parseDocxSource']>) =>
  loadHeavy().then((m) => m.parseDocxSource(...args));
export const parseXlsxSource = (...args: Parameters<HeavyModule['parseXlsxSource']>) =>
  loadHeavy().then((m) => m.parseXlsxSource(...args));
export const parsePdfSource = (...args: Parameters<HeavyModule['parsePdfSource']>) =>
  loadHeavy().then((m) => m.parsePdfSource(...args));

export const buildDocxPdfBlob = (...args: Parameters<HeavyModule['buildDocxPdfBlob']>) =>
  loadHeavy().then((m) => m.buildDocxPdfBlob(...args));
export const buildDocxXlsxBlob = (...args: Parameters<HeavyModule['buildDocxXlsxBlob']>) =>
  loadHeavy().then((m) => m.buildDocxXlsxBlob(...args));
export const buildDocxPptxBlob = (...args: Parameters<HeavyModule['buildDocxPptxBlob']>) =>
  loadHeavy().then((m) => m.buildDocxPptxBlob(...args));

export const buildXlsxPdfBlob = (...args: Parameters<HeavyModule['buildXlsxPdfBlob']>) =>
  loadHeavy().then((m) => m.buildXlsxPdfBlob(...args));
export const buildXlsxDocxBlob = (...args: Parameters<HeavyModule['buildXlsxDocxBlob']>) =>
  loadHeavy().then((m) => m.buildXlsxDocxBlob(...args));
export const buildXlsxPptxBlob = (...args: Parameters<HeavyModule['buildXlsxPptxBlob']>) =>
  loadHeavy().then((m) => m.buildXlsxPptxBlob(...args));

export const buildPdfDocxBlob = (...args: Parameters<HeavyModule['buildPdfDocxBlob']>) =>
  loadHeavy().then((m) => m.buildPdfDocxBlob(...args));
// Bản gốc đồng bộ (trả về Blob) - giờ phải bất đồng bộ vì cần nạp thư viện
// trước, nên nơi gọi cần `await`.
export const buildPdfXlsxBlob = (...args: Parameters<HeavyModule['buildPdfXlsxBlob']>) =>
  loadHeavy().then((m) => m.buildPdfXlsxBlob(...args));
export const buildPdfPptxBlob = (...args: Parameters<HeavyModule['buildPdfPptxBlob']>) =>
  loadHeavy().then((m) => m.buildPdfPptxBlob(...args));
