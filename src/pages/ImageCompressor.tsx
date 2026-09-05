import { useEffect, useRef, useState } from 'react';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useDelayedAction } from '@/hook/useDelayedAction';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearImageCompressor,
  setCompressedResult,
  setError,
  setFormat,
  setMaxDimension,
  setOriginalImage,
  setQuality,
} from '@/store/slices/imageCompressorSlice';
import { formatFileSize } from '@/util/file';
import {
  buildCompressedFileName,
  compressImage,
  loadImageElement,
  MAX_SOURCE_IMAGE_SIZE,
  validateSourceImage,
} from '@/util/imageCompressor';
import { readFileAsDataUrl } from '@/util/imagePixel';
import type { ImageOutputFormat } from '@/util/interface/Type';
import { triggerDownload } from '@/util/qrcode';

const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

const inputClass =
  'w-full p-2.5 text-sm border rounded-lg bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:placeholder:text-gray-500';

const dropZoneBaseClass =
  'flex min-h-48 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition';

const FORMAT_OPTIONS: { id: ImageOutputFormat; label: string; hint: string }[] = [
  { id: 'image/jpeg', label: 'JPEG', hint: 'Best for photos, smallest file size' },
  { id: 'image/webp', label: 'WebP', hint: 'Best compression, supports transparency' },
  { id: 'image/png', label: 'PNG', hint: 'Lossless, larger file, keeps transparency' },
];

const MIN_QUALITY = 1;
const MAX_QUALITY = 100;
const MIN_DIMENSION = 16;
const MAX_DIMENSION_LIMIT = 10000;

const ImageCompressor = () => {
  const dispatch = useAppDispatch();
  const {
    originalName,
    originalSize,
    originalDataUrl,
    originalWidth,
    originalHeight,
    format,
    quality,
    maxDimension,
    compressedDataUrl,
    compressedSize,
    compressedWidth,
    compressedHeight,
    error,
  } = useAppSelector((state) => state.imageCompressor);
  const { loading, run, cancel } = useDelayedAction();

  // "Đang đọc file vừa chọn" (thật, không qua delay giả) - tách riêng khỏi
  // `loading`/isCompressing bên dưới, giống pattern readingSide của
  // FileCompare, vì đây là bước hoàn toàn khác (đọc file) chứ không phải nén.
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  // "Đang nén" (thật) - dùng CHUNG với `loading` (delay giả 2s của
  // useDelayedAction) để quyết định hiện LoadingIndicator, đề phòng ảnh lớn
  // khiến bước nén thật sự lâu hơn 2s (xem handleCompress).
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theo dõi ảnh gốc ĐANG HIỂN THỊ bằng ref (thay vì chỉ đọc từ closure) để
  // handleCompress có thể tự kiểm tra lại SAU KHI nén xong (bất đồng bộ) xem
  // ảnh gốc có còn là ảnh lúc bấm Compress không - tránh trường hợp người
  // dùng đổi sang ảnh khác hoặc bấm Clear trong lúc đang nén, khiến kết quả
  // nén của ảnh CŨ bị dispatch đè lên ảnh MỚI đang hiển thị.
  const originalDataUrlRef = useRef(originalDataUrl);
  useEffect(() => {
    originalDataUrlRef.current = originalDataUrl;
  }, [originalDataUrl]);

  // State sống trong Redux nên tồn tại xuyên suốt cả app, không tự mất khi
  // chuyển route như useState thường làm -> phải chủ động xoá mỗi khi vào
  // lại trang này để không còn thấy ảnh/kết quả của lần trước.
  useEffect(() => {
    dispatch(clearImageCompressor());
  }, [dispatch]);

  const isBusy = loading || isCompressing;

  const handleFile = async (file: File) => {
    const validationError = validateSourceImage(file);
    if (validationError) {
      dispatch(setError(validationError));
      return;
    }

    cancel();
    setIsLoadingImage(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const img = await loadImageElement(dataUrl);
      dispatch(
        setOriginalImage({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
          width: img.naturalWidth,
          height: img.naturalHeight,
        })
      );
    } catch (err) {
      dispatch(
        setError(err instanceof Error ? err.message : `Could not read "${file.name}".`)
      );
    } finally {
      setIsLoadingImage(false);
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
      dispatch(setError('Please drop only one image at a time.'));
      return;
    }
    handleFile(files[0]);
  };

  const openPicker = () => {
    if (!isLoadingImage && !isBusy) fileInputRef.current?.click();
  };

  const handleCompress = () => {
    if (!originalDataUrl) return;

    const trimmedMax = maxDimension.trim();
    let maxDimensionPx: number | null = null;
    if (trimmedMax) {
      // Chỉ chấp nhận số nguyên dương thuần (giống pattern count/length của
      // UuidState/PasswordGeneratorState) - không cho qua các dạng JS hiểu
      // là số nhưng người dùng không mong đợi ở đây (vd "1e3").
      const isPlainInteger = /^\d+$/.test(trimmedMax);
      const parsed = Number(trimmedMax);
      if (!isPlainInteger || !Number.isInteger(parsed)) {
        dispatch(
          setError(
            'Max dimension must be a valid integer, or leave it empty to keep the original size.'
          )
        );
        return;
      }
      if (parsed < MIN_DIMENSION || parsed > MAX_DIMENSION_LIMIT) {
        dispatch(
          setError(
            `Max dimension must be between ${MIN_DIMENSION} and ${MAX_DIMENSION_LIMIT}px.`
          )
        );
        return;
      }
      maxDimensionPx = parsed;
    }

    const trimmedQuality = quality.trim();
    const isPlainQualityInteger = /^\d+$/.test(trimmedQuality);
    const qualityValue = Number(trimmedQuality);
    if (
      !isPlainQualityInteger ||
      !Number.isInteger(qualityValue) ||
      qualityValue < MIN_QUALITY ||
      qualityValue > MAX_QUALITY
    ) {
      dispatch(
        setError(`Quality must be an integer between ${MIN_QUALITY} and ${MAX_QUALITY}.`)
      );
      return;
    }

    const sourceDataUrl = originalDataUrl;
    const requestedFormat = format;

    run(async () => {
      setIsCompressing(true);
      try {
        const result = await compressImage(sourceDataUrl, {
          format: requestedFormat,
          quality: qualityValue / 100,
          maxDimension: maxDimensionPx,
        });

        // Ảnh gốc đã bị đổi/xoá trong lúc đang nén (chọn ảnh khác, hoặc bấm
        // Clear) - bỏ qua kết quả này, KHÔNG dispatch đè lên state của ảnh
        // mới đang hiển thị.
        if (originalDataUrlRef.current !== sourceDataUrl) return;

        dispatch(
          setCompressedResult({
            dataUrl: result.dataUrl,
            size: result.byteSize,
            width: result.width,
            height: result.height,
          })
        );

        if (result.actualFormat !== requestedFormat) {
          dispatch(setFormat(result.actualFormat));
          dispatch(
            setError(
              `Your browser could not export as ${requestedFormat.replace('image/', '').toUpperCase()}, so it fell back to ${result.actualFormat
                .replace('image/', '')
                .toUpperCase()} instead.`
            )
          );
        }
      } catch (err) {
        if (originalDataUrlRef.current !== sourceDataUrl) return;
        dispatch(
          setError(err instanceof Error ? err.message : 'Could not compress this image.')
        );
      } finally {
        setIsCompressing(false);
      }
    });
  };

  const handleClear = () => {
    cancel();
    setIsCompressing(false);
    setIsLoadingImage(false);
    dispatch(clearImageCompressor());
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = () => {
    if (!compressedDataUrl || !originalName) return;
    triggerDownload(compressedDataUrl, buildCompressedFileName(originalName, format));
  };

  const reductionPercent =
    originalSize && compressedSize
      ? Math.round((1 - compressedSize / originalSize) * 100)
      : null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
        Image Compressor
      </h1>

      <div className="space-y-4 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
        {/* Khu vực chọn ảnh cần nén */}
        <div className="flex flex-col space-y-2">
          <label className={labelClass}>
            Image to compress (max {MAX_SOURCE_IMAGE_SIZE / (1024 * 1024)}MB):
          </label>
          <div
            role="button"
            tabIndex={0}
            aria-label={originalName ? `Change ${originalName}` : 'Select an image to compress'}
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
              accept="image/*"
              className="hidden"
              onChange={handleInputChange}
            />

            {isLoadingImage ? (
              <LoadingIndicator label="Reading image..." />
            ) : originalDataUrl ? (
              <div className="flex w-full flex-col items-center gap-2">
                <img
                  src={originalDataUrl}
                  alt={originalName ?? 'Uploaded image'}
                  className="max-h-40 max-w-full rounded-md object-contain"
                />
                <p
                  className="w-full truncate text-center text-sm font-medium text-gray-800 dark:text-gray-100"
                  title={originalName ?? ''}
                >
                  {originalName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(originalSize ?? 0)}
                  {originalWidth && originalHeight
                    ? ` · ${originalWidth} × ${originalHeight}px`
                    : ''}
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
                <span className="text-sm">Drag & drop an image here</span>
                <span className="text-xs">or click anywhere to browse</span>
              </div>
            )}
          </div>
        </div>

        {/* Tuỳ chọn nén */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col space-y-2">
            <label className={labelClass}>Output format:</label>
            <div className="flex flex-wrap rounded-lg border border-gray-200 p-1 dark:border-gray-700 w-fit">
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => dispatch(setFormat(opt.id))}
                  title={opt.hint}
                  className={`min-w-20 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    format === opt.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <label className={labelClass}>
              Quality: {quality}%
              {format === 'image/png' && (
                <span className="ml-1 text-xs font-normal text-gray-400 dark:text-gray-500">
                  (PNG is lossless - ignored)
                </span>
              )}
            </label>
            <input
              type="range"
              min={MIN_QUALITY}
              max={MAX_QUALITY}
              step={1}
              value={quality}
              disabled={format === 'image/png'}
              onChange={(e) => dispatch(setQuality(e.target.value))}
              className="mt-2.5 w-full accent-blue-600 disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label className={labelClass}>Max width/height (px):</label>
            <input
              type="text"
              inputMode="numeric"
              value={maxDimension}
              onChange={(e) => dispatch(setMaxDimension(e.target.value))}
              placeholder="Original size"
              className={inputClass}
            />
          </div>
        </div>

        {/* Thanh công cụ */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCompress}
            disabled={isBusy || isLoadingImage || !originalDataUrl}
            className="flex-1 sm:flex-none min-w-30 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBusy ? 'Compressing...' : 'Compress'}
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
            {!isBusy && compressedDataUrl && (
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
              <LoadingIndicator label="Compressing..." />
            ) : compressedDataUrl ? (
              <div className="space-y-3">
                {reductionPercent !== null && (
                  <div
                    className={`text-sm font-medium rounded-lg px-3 py-2 ${
                      reductionPercent > 0
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}
                  >
                    {reductionPercent > 0
                      ? `Reduced by ${reductionPercent}% (${formatFileSize(
                          originalSize ?? 0
                        )} → ${formatFileSize(compressedSize ?? 0)})`
                      : `The compressed file (${formatFileSize(
                          compressedSize ?? 0
                        )}) is not smaller than the original (${formatFileSize(
                          originalSize ?? 0
                        )}). Try a lower quality or a smaller max dimension.`}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <p className={labelClass}>Original</p>
                    <div className="inline-block max-w-full rounded-lg border border-gray-300 bg-white p-2">
                      <img
                        src={originalDataUrl ?? ''}
                        alt="Original"
                        className="max-h-64 max-w-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(originalSize ?? 0)} · {originalWidth} ×{' '}
                      {originalHeight}px
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <p className={labelClass}>Compressed</p>
                    <div className="inline-block max-w-full rounded-lg border border-gray-300 bg-white p-2">
                      <img
                        src={compressedDataUrl}
                        alt="Compressed"
                        className="max-h-64 max-w-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(compressedSize ?? 0)} · {compressedWidth} ×{' '}
                      {compressedHeight}px
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-16 text-center">
                Upload an image and click Compress to see the result here...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCompressor;
