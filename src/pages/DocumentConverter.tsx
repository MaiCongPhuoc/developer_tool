import { useEffect, useRef, useState } from 'react';
import LoadingIndicator from '@/components/LoadingIndicator';
import { FileIcon } from '@/icons';
import { useDelayedAction } from '@/hook/useDelayedAction';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearDocumentConverter,
  setConvertedResult,
  setError,
  setOriginalFile,
  setPreview,
  setTargetFormat,
} from '@/store/slices/documentConverterSlice';
import { formatFileSize } from '@/util/file';
import {
  blobToDataUrl,
  buildConvertedFileName,
  buildDocxPdfBlob,
  buildDocxPptxBlob,
  buildDocxXlsxBlob,
  buildPdfDocxBlob,
  buildPdfPptxBlob,
  buildPdfXlsxBlob,
  buildXlsxDocxBlob,
  buildXlsxPdfBlob,
  buildXlsxPptxBlob,
  CONVERSION_QUALITY_LABEL,
  dataUrlToArrayBuffer,
  getConversionQuality,
  MAX_SOURCE_DOCUMENT_SIZE,
  parseDocxSource,
  parsePdfSource,
  parseXlsxSource,
  validateSourceDocument,
  type ParsedSource,
} from '@/util/documentConverter';
import { readFileAsDataUrl } from '@/util/imagePixel';
import type { DocumentFormat } from '@/util/interface/Type';
import { triggerDownload } from '@/util/qrcode';

const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

const dropZoneBaseClass =
  'flex min-h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition';

const ALL_FORMATS: DocumentFormat[] = ['docx', 'xlsx', 'pdf', 'pptx'];

const FORMAT_LABELS: Record<DocumentFormat, string> = {
  docx: 'Word',
  xlsx: 'Excel',
  pdf: 'PDF',
  pptx: 'PowerPoint',
};

// Chấp nhận cả .doc/.ppt/.pptx trong hộp thoại chọn file (dù validateSourceDocument
// sẽ từ chối chúng với thông báo rõ ràng) thay vì lọc ngay từ accept - thuộc
// tính accept của trình duyệt chỉ là GỢI Ý (người dùng vẫn chọn được "All
// Files"), nên validate ở code vẫn là nơi thực sự chặn, còn accept ở đây chỉ
// cần đủ rộng để không gây khó hiểu khi hộp thoại tự ẩn bớt file của họ.
const FILE_ACCEPT = '.docx,.doc,.xlsx,.xls,.csv,.pdf,.pptx,.ppt';

// CSS tối giản cho khung xem trước - iframe là 1 document HOÀN TOÀN riêng
// biệt (srcDoc), không thừa hưởng Tailwind của trang cha, nên phải tự chèn
// style pha sẵn. Nền luôn trắng bất kể dark mode của app, giống 1 tờ giấy in
// thật - tự nhiên cho nội dung Word/Excel hơn là theo theme.
const PREVIEW_IFRAME_STYLE = `<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; margin: 0; padding: 12px; font-size: 13px; }
  table { border-collapse: collapse; }
  td, th { border: 1px solid #d1d5db; padding: 3px 8px; }
  img { max-width: 100%; }
</style>`;

// sandbox="" (rỗng) chặn TOÀN BỘ quyền của iframe (script, form, popup...) -
// nội dung preview chỉ là HTML tĩnh do mammoth/xlsx TỰ DỰNG lại (không copy
// nguyên si markup từ file gốc), nên không cần bất kỳ quyền nào, khác hẳn
// iframe "allow-scripts" của HTML Previewer (nơi người dùng cố ý muốn chạy
// script họ gõ) - xem thêm giải thích ở HtmlPreviewer.tsx.
const PREVIEW_IFRAME_SANDBOX = '';

const DocumentConverter = () => {
  const dispatch = useAppDispatch();
  const {
    originalName,
    originalSize,
    originalDataUrl,
    originalFormat,
    previewHtml,
    previewImageDataUrl,
    targetFormat,
    convertedDataUrl,
    convertedSize,
    convertedFileName,
    error,
  } = useAppSelector((state) => state.documentConverter);
  const { loading, run, cancel } = useDelayedAction();

  // "Đang đọc + phân tích file vừa chọn" (thật) - đọc byte, rồi chạy mammoth/
  // xlsx/pdfjs để dựng preview, TÁCH riêng khỏi `loading`/isConverting bên
  // dưới, theo đúng pattern của ImageFormatConverter.
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  // Chỉ PDF cần hiển thị "trang 1 / N trang" - không thuộc business state cần
  // giữ lại (chỉ để hiển thị cạnh preview), nên để local thay vì Redux.
  const [sourcePageCount, setSourcePageCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dữ liệu ĐÃ PHÂN TÍCH của file nguồn (HTML/text của docx, AOA của xlsx,
  // hoặc pageCount/textByPage/getPageImage của pdf) - đây là dữ liệu LÀM
  // VIỆC thật sự dùng để convert, không phải state hiển thị nên KHÔNG đưa
  // vào Redux (giống cách ColorPicker/ImageCompressor không đưa HTMLImageElement
  // vào Redux) - đặc biệt với PDF, closure getPageImage/destroy giữ tham
  // chiếu tới PDFDocumentProxy của pdfjs, hoàn toàn không serialize được.
  const parsedSourceRef = useRef<ParsedSource | null>(null);

  // Theo dõi file gốc ĐANG HIỂN THỊ bằng ref để handleConvert có thể tự kiểm
  // tra lại SAU KHI convert xong (bất đồng bộ) xem file gốc có còn là file
  // lúc bấm Convert không - tránh trường hợp người dùng đổi file khác/bấm
  // Clear trong lúc đang convert (giống hệt pattern của Image pages).
  const originalDataUrlRef = useRef(originalDataUrl);
  useEffect(() => {
    originalDataUrlRef.current = originalDataUrl;
  }, [originalDataUrl]);

  const destroyParsedSource = () => {
    if (parsedSourceRef.current?.kind === 'pdf') {
      parsedSourceRef.current.destroy();
    }
    parsedSourceRef.current = null;
  };

  // State sống trong Redux nên tồn tại xuyên suốt cả app, không tự mất khi
  // chuyển route như useState thường làm -> phải chủ động xoá mỗi khi vào
  // lại trang này để không còn thấy file/kết quả của lần trước.
  useEffect(() => {
    dispatch(clearDocumentConverter());
    return () => destroyParsedSource();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const isBusy = loading || isConverting;

  const handleFile = async (file: File) => {
    const validation = validateSourceDocument(file);
    if ('error' in validation) {
      dispatch(setError(validation.error));
      return;
    }

    cancel();
    destroyParsedSource();
    setSourcePageCount(null);
    setIsLoadingFile(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const arrayBuffer = dataUrlToArrayBuffer(dataUrl);

      dispatch(
        setOriginalFile({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
          format: validation.format,
        })
      );

      if (validation.format === 'docx') {
        const parsed = await parseDocxSource(arrayBuffer);
        parsedSourceRef.current = parsed;
        dispatch(setPreview({ html: parsed.html, imageDataUrl: null }));
      } else if (validation.format === 'xlsx') {
        const parsed = await parseXlsxSource(arrayBuffer);
        parsedSourceRef.current = parsed;
        dispatch(setPreview({ html: parsed.html, imageDataUrl: null }));
      } else {
        const parsed = await parsePdfSource(arrayBuffer);
        parsedSourceRef.current = parsed;
        setSourcePageCount(parsed.pageCount);
        dispatch(setPreview({ html: null, imageDataUrl: parsed.thumbnailDataUrl }));
      }
    } catch (err) {
      dispatch(
        setError(
          err instanceof Error
            ? `Could not read "${file.name}": ${err.message}`
            : `Could not read "${file.name}". It may be corrupted or password-protected.`
        )
      );
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset ngay value của input để lần sau chọn lại ĐÚNG file cũ vẫn bắn sự
    // kiện onChange - trình duyệt chỉ bắn onChange khi value thực sự đổi.
    e.target.value = '';
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    if (files.length > 1) {
      dispatch(setError('Please drop only one file at a time.'));
      return;
    }
    handleFile(files[0]);
  };

  const openPicker = () => {
    if (!isLoadingFile && !isBusy) fileInputRef.current?.click();
  };

  const handleConvert = () => {
    const parsed = parsedSourceRef.current;
    if (!originalDataUrl || !parsed) return;

    const sourceDataUrl = originalDataUrl;
    const requestedTarget = targetFormat;

    run(async () => {
      setIsConverting(true);
      try {
        let blob: Blob;
        if (parsed.kind === 'docx') {
          if (requestedTarget === 'pdf') blob = await buildDocxPdfBlob(parsed.html);
          else if (requestedTarget === 'xlsx') blob = await buildDocxXlsxBlob(parsed.html);
          else if (requestedTarget === 'pptx') blob = await buildDocxPptxBlob(parsed.html);
          else throw new Error('Unsupported conversion.');
        } else if (parsed.kind === 'xlsx') {
          if (requestedTarget === 'pdf')
            blob = await buildXlsxPdfBlob(parsed.aoa, parsed.originalRowIndexes, parsed.images);
          else if (requestedTarget === 'docx')
            blob = await buildXlsxDocxBlob(parsed.aoa, parsed.originalRowIndexes, parsed.images);
          else if (requestedTarget === 'pptx')
            blob = await buildXlsxPptxBlob(parsed.aoa, parsed.originalRowIndexes, parsed.images);
          else throw new Error('Unsupported conversion.');
        } else {
          if (requestedTarget === 'docx') blob = await buildPdfDocxBlob(parsed.textByPage);
          else if (requestedTarget === 'xlsx') blob = buildPdfXlsxBlob(parsed.textByPage);
          else if (requestedTarget === 'pptx')
            blob = await buildPdfPptxBlob(parsed.getPageImage, parsed.pageCount);
          else throw new Error('Unsupported conversion.');
        }

        // File gốc đã bị đổi/xoá trong lúc đang convert (chọn file khác,
        // hoặc bấm Clear) - bỏ qua kết quả này, KHÔNG dispatch đè lên state
        // của file mới đang hiển thị.
        if (originalDataUrlRef.current !== sourceDataUrl) return;

        const convertedDataUrl = await blobToDataUrl(blob);
        dispatch(
          setConvertedResult({
            dataUrl: convertedDataUrl,
            size: blob.size,
            fileName: buildConvertedFileName(originalName ?? 'document', requestedTarget),
          })
        );
      } catch (err) {
        if (originalDataUrlRef.current !== sourceDataUrl) return;
        dispatch(setError(err instanceof Error ? err.message : 'Could not convert this file.'));
      } finally {
        setIsConverting(false);
      }
    });
  };

  const handleClear = () => {
    cancel();
    destroyParsedSource();
    setSourcePageCount(null);
    setIsConverting(false);
    setIsLoadingFile(false);
    dispatch(clearDocumentConverter());
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = () => {
    if (!convertedDataUrl || !convertedFileName) return;
    triggerDownload(convertedDataUrl, convertedFileName);
  };

  const targetOptions = ALL_FORMATS.filter((format) => format !== originalFormat);
  const quality = originalFormat ? getConversionQuality(originalFormat, targetFormat) : null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
        Document Format
      </h1>

      <div className="space-y-4 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
        {/* Khu vực chọn file cần convert */}
        <div className="flex flex-col space-y-2">
          <label className={labelClass}>
            File to convert - Word (.docx), Excel (.xlsx/.xls/.csv), or PDF (max{' '}
            {MAX_SOURCE_DOCUMENT_SIZE / (1024 * 1024)}MB):
          </label>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            PowerPoint (.pptx) can only be created as an output here - it can&apos;t be used as the
            source yet.
          </p>
          <div
            role="button"
            tabIndex={0}
            aria-label={originalName ? `Change ${originalName}` : 'Select a file to convert'}
            className={`${dropZoneBaseClass} ${
              isDragOver
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/60 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500 dark:hover:bg-blue-900/10'
            }`}
            onClick={openPicker}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openPicker();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={FILE_ACCEPT}
              className="hidden"
              onChange={handleInputChange}
            />

            {isLoadingFile ? (
              <LoadingIndicator label="Reading file..." />
            ) : originalName ? (
              <div className="flex w-full flex-col items-center gap-2">
                <FileIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                <p
                  className="w-full truncate text-center text-sm font-medium text-gray-800 dark:text-gray-100"
                  title={originalName}
                >
                  {originalName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(originalSize ?? 0)}
                  {originalFormat ? ` · Detected: ${FORMAT_LABELS[originalFormat]}` : ''}
                  {sourcePageCount ? ` · ${sourcePageCount} page(s)` : ''}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openPicker();
                  }}
                  className="text-xs px-2.5 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 transition"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                <span className="text-sm">Drag & drop a file here</span>
                <span className="text-xs">or click anywhere to browse</span>
              </div>
            )}
          </div>
        </div>

        {/* Xem trước nội dung file nguồn */}
        {(previewHtml || previewImageDataUrl) && (
          <div className="flex flex-col space-y-2">
            <label className={labelClass}>Preview:</label>
            {previewHtml && (
              <iframe
                srcDoc={PREVIEW_IFRAME_STYLE + previewHtml}
                sandbox={PREVIEW_IFRAME_SANDBOX}
                title="Document preview"
                className="h-56 w-full rounded-lg border border-gray-200 bg-white dark:border-gray-700"
              />
            )}
            {previewImageDataUrl && (
              <img
                src={previewImageDataUrl}
                alt="First page preview"
                className="max-h-56 rounded-lg border border-gray-200 object-contain dark:border-gray-700"
              />
            )}
          </div>
        )}

        {/* Chọn định dạng đích */}
        <div className="flex flex-col space-y-2">
          <label className={labelClass}>Convert to:</label>
          <div className="flex flex-wrap rounded-lg border border-gray-200 p-1 dark:border-gray-700 w-fit">
            {targetOptions.map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => dispatch(setTargetFormat(format))}
                className={`min-w-24 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  targetFormat === format
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {FORMAT_LABELS[format]}
              </button>
            ))}
          </div>
          {quality && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {CONVERSION_QUALITY_LABEL[quality]}
            </p>
          )}
        </div>

        {/* Thanh công cụ */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleConvert}
            disabled={isBusy || isLoadingFile || !originalDataUrl}
            className="flex-1 sm:flex-none min-w-30 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBusy ? 'Converting...' : 'Convert'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 sm:flex-none min-w-30 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition"
          >
            Clear
          </button>
        </div>

        {/* Thông báo lỗi nếu có */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Kết quả */}
        <div className="flex flex-col space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className={labelClass}>Result:</label>
            {!isBusy && convertedDataUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className="text-xs px-2.5 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 transition"
              >
                Download
              </button>
            )}
          </div>

          <div className="w-full p-3 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
            {isBusy ? (
              <LoadingIndicator label="Converting..." />
            ) : convertedDataUrl ? (
              <div className="flex items-center gap-3">
                <FileIcon className="h-8 w-8 shrink-0 text-blue-500" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                    {convertedFileName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(convertedSize ?? 0)} · {FORMAT_LABELS[targetFormat]}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-16 text-center">
                Upload a file and click Convert to see the result here...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentConverter;
