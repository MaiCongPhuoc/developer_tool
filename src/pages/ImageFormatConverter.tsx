import { useEffect, useRef, useState } from 'react';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useDelayedAction } from '@/hook/useDelayedAction';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearImageFormatConverter,
  setBgColor,
  setBgTolerance,
  setConvertedResult,
  setError,
  setOriginalImage,
  setQuality,
  setRemoveBackground,
  setTargetFormat,
} from '@/store/slices/imageFormatConverterSlice';
import { formatFileSize } from '@/util/file';
import {
  buildConvertedFileName,
  convertImage,
  loadImageElement,
  MAX_SOURCE_IMAGE_SIZE,
  sampleCornerColor,
  validateSourceImage,
} from '@/util/imageFormatConverter';
import { readFileAsDataUrl } from '@/util/imagePixel';
import type { ImageOutputFormat } from '@/util/interface/Type';
import { triggerDownload } from '@/util/qrcode';
import ToolGuide from '@/components/ToolGuide';

const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

const dropZoneBaseClass =
  'flex min-h-48 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition';

const FORMAT_OPTIONS: { id: ImageOutputFormat; label: string; hint: string }[] = [
  { id: 'image/jpeg', label: 'JPEG', hint: 'Small file size, no transparency support' },
  { id: 'image/webp', label: 'WebP', hint: 'Best compression for the web, supports transparency' },
  { id: 'image/png', label: 'PNG', hint: 'Lossless, larger file, supports transparency' },
];

const MIN_QUALITY = 1;
const MAX_QUALITY = 100;
const MIN_TOLERANCE = 0;
const MAX_TOLERANCE = 100;

// CSS checkerboard kinh điển để mô phỏng nền "trong suốt" (giống Photoshop/
// Figma) - không có cách nào khác để mắt thường phân biệt được vùng ảnh có
// alpha = 0 với vùng chỉ tình cờ có màu trắng/xám giống nền card.
const transparencyGridStyle: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(45deg, #80808040 25%, transparent 25%), ' +
    'linear-gradient(-45deg, #80808040 25%, transparent 25%), ' +
    'linear-gradient(45deg, transparent 75%, #80808040 75%), ' +
    'linear-gradient(-45deg, transparent 75%, #80808040 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
};

const ImageFormatConverter = () => {
  const dispatch = useAppDispatch();
  const {
    originalName,
    originalSize,
    originalDataUrl,
    originalWidth,
    originalHeight,
    targetFormat,
    quality,
    removeBackground,
    bgColor,
    bgTolerance,
    convertedDataUrl,
    convertedSize,
    convertedWidth,
    convertedHeight,
    convertedFormat,
    error,
  } = useAppSelector((state) => state.imageFormatConverter);
  const { loading, run, cancel } = useDelayedAction();

  // "Đang đọc file vừa chọn" (thật, không qua delay giả) - tách riêng khỏi
  // `loading`/isConverting bên dưới, theo đúng pattern của ImageCompressor.
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  // "Đang convert" (thật) - dùng CHUNG với `loading` (delay giả 2s) để quyết
  // định hiện LoadingIndicator, đề phòng ảnh lớn khiến việc đọc/ghi pixel
  // (đặc biệt bước xoá nền, phải quét TỪNG pixel) lâu hơn 2s.
  const [isConverting, setIsConverting] = useState(false);
  const [isPickingColor, setIsPickingColor] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theo dõi ảnh gốc ĐANG HIỂN THỊ bằng ref để handleConvert có thể tự kiểm
  // tra lại SAU KHI convert xong (bất đồng bộ) xem ảnh gốc có còn là ảnh lúc
  // bấm Convert không - tránh trường hợp người dùng đổi ảnh khác/bấm Clear
  // trong lúc đang convert (giống hệt pattern của ImageCompressor).
  const originalDataUrlRef = useRef(originalDataUrl);
  useEffect(() => {
    originalDataUrlRef.current = originalDataUrl;
  }, [originalDataUrl]);

  // State sống trong Redux nên tồn tại xuyên suốt cả app, không tự mất khi
  // chuyển route như useState thường làm -> phải chủ động xoá mỗi khi vào
  // lại trang này để không còn thấy ảnh/kết quả của lần trước.
  useEffect(() => {
    dispatch(clearImageFormatConverter());
  }, [dispatch]);

  const isBusy = loading || isConverting;
  const supportsTransparency = targetFormat !== 'image/jpeg';

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

  const handlePickCornerColor = async () => {
    if (!originalDataUrl || isBusy || isLoadingImage) return;
    setIsPickingColor(true);
    try {
      const color = await sampleCornerColor(originalDataUrl);
      dispatch(setBgColor(color));
    } catch (err) {
      dispatch(
        setError(err instanceof Error ? err.message : 'Could not sample color from this image.')
      );
    } finally {
      setIsPickingColor(false);
    }
  };

  const handleConvert = () => {
    if (!originalDataUrl) return;

    const trimmedQuality = quality.trim();
    // Chỉ chấp nhận số nguyên dương thuần, giống pattern quality của
    // ImageCompressor - không cho qua các dạng JS hiểu là số nhưng người
    // dùng không mong đợi ở đây (vd "1e3").
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

    const shouldRemoveBackground = removeBackground && supportsTransparency;
    let toleranceValue = 0;
    if (shouldRemoveBackground) {
      const trimmedTolerance = bgTolerance.trim();
      const isPlainToleranceInteger = /^\d+$/.test(trimmedTolerance);
      toleranceValue = Number(trimmedTolerance);
      if (
        !isPlainToleranceInteger ||
        !Number.isInteger(toleranceValue) ||
        toleranceValue < MIN_TOLERANCE ||
        toleranceValue > MAX_TOLERANCE
      ) {
        dispatch(
          setError(`Tolerance must be an integer between ${MIN_TOLERANCE} and ${MAX_TOLERANCE}.`)
        );
        return;
      }
    }

    const sourceDataUrl = originalDataUrl;
    const requestedFormat = targetFormat;

    run(async () => {
      setIsConverting(true);
      try {
        const result = await convertImage(sourceDataUrl, {
          format: requestedFormat,
          quality: qualityValue / 100,
          removeBackground: shouldRemoveBackground,
          bgColor,
          bgTolerance: toleranceValue,
        });

        // Ảnh gốc đã bị đổi/xoá trong lúc đang convert (chọn ảnh khác, hoặc
        // bấm Clear) - bỏ qua kết quả này, KHÔNG dispatch đè lên state của
        // ảnh mới đang hiển thị.
        if (originalDataUrlRef.current !== sourceDataUrl) return;

        dispatch(
          setConvertedResult({
            dataUrl: result.dataUrl,
            size: result.byteSize,
            width: result.width,
            height: result.height,
            format: result.actualFormat,
          })
        );

        if (result.actualFormat !== requestedFormat) {
          dispatch(setTargetFormat(result.actualFormat));
          dispatch(
            setError(
              `Your browser could not export as ${requestedFormat
                .replace('image/', '')
                .toUpperCase()}, so it fell back to ${result.actualFormat
                .replace('image/', '')
                .toUpperCase()} instead.`
            )
          );
        }
      } catch (err) {
        if (originalDataUrlRef.current !== sourceDataUrl) return;
        dispatch(
          setError(err instanceof Error ? err.message : 'Could not convert this image.')
        );
      } finally {
        setIsConverting(false);
      }
    });
  };

  const handleClear = () => {
    cancel();
    setIsConverting(false);
    setIsLoadingImage(false);
    dispatch(clearImageFormatConverter());
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = () => {
    if (!convertedDataUrl || !originalName || !convertedFormat) return;
    triggerDownload(convertedDataUrl, buildConvertedFileName(originalName, convertedFormat));
  };

  const sizeDeltaPercent =
    originalSize && convertedSize
      ? Math.round(((convertedSize - originalSize) / originalSize) * 100)
      : null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
        Image Format Converter
      </h1>

      <div className="space-y-4 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
        {/* Khu vực chọn ảnh cần convert */}
        <div className="flex flex-col space-y-2">
          <label className={labelClass}>
            Image to convert (max {MAX_SOURCE_IMAGE_SIZE / (1024 * 1024)}MB):
          </label>
          <div
            role="button"
            tabIndex={0}
            aria-label={originalName ? `Change ${originalName}` : 'Select an image to convert'}
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

        {/* Tuỳ chọn convert */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-2">
            <label className={labelClass}>Convert to:</label>
            <div className="flex flex-wrap rounded-lg border border-gray-200 p-1 dark:border-gray-700 w-fit">
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => dispatch(setTargetFormat(opt.id))}
                  title={opt.hint}
                  className={`min-w-20 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    targetFormat === opt.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {FORMAT_OPTIONS.find((opt) => opt.id === targetFormat)?.hint}
            </p>
          </div>

          <div className="flex flex-col space-y-2">
            <label className={labelClass}>
              Quality: {quality}%
              {targetFormat === 'image/png' && (
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
              disabled={targetFormat === 'image/png'}
              onChange={(e) => dispatch(setQuality(e.target.value))}
              className="mt-2.5 w-full accent-blue-600 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Tuỳ chọn xoá nền theo màu */}
        <div className="flex flex-col space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={removeBackground}
              disabled={!supportsTransparency}
              onChange={(e) => dispatch(setRemoveBackground(e.target.checked))}
              className="h-4 w-4 accent-blue-600 disabled:opacity-50"
            />
            Make background transparent
          </label>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {supportsTransparency
              ? 'Removes pixels close to the chosen color (best for flat, single-color backgrounds - not AI subject detection).'
              : 'JPEG has no transparency support - switch to PNG or WebP to use this.'}
          </p>

          {removeBackground && supportsTransparency && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="flex flex-col space-y-2">
                <label className={labelClass}>Background color:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => dispatch(setBgColor(e.target.value))}
                    className="h-9 w-12 cursor-pointer rounded border border-gray-300 dark:border-gray-700"
                  />
                  <span className="font-mono text-sm text-gray-600 dark:text-gray-300">
                    {bgColor.toUpperCase()}
                  </span>
                  <button
                    type="button"
                    onClick={handlePickCornerColor}
                    disabled={!originalDataUrl || isBusy || isLoadingImage || isPickingColor}
                    className="text-xs px-2.5 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPickingColor ? 'Sampling...' : 'Pick from corner'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <label className={labelClass}>Tolerance: {bgTolerance}%</label>
                <input
                  type="range"
                  min={MIN_TOLERANCE}
                  max={MAX_TOLERANCE}
                  step={1}
                  value={bgTolerance}
                  onChange={(e) => dispatch(setBgTolerance(e.target.value))}
                  className="mt-2.5 w-full accent-blue-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Thanh công cụ */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleConvert}
            disabled={isBusy || isLoadingImage || !originalDataUrl}
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
              <div className="space-y-3">
                {sizeDeltaPercent !== null && (
                  <div
                    className={`text-sm font-medium rounded-lg px-3 py-2 ${
                      sizeDeltaPercent <= 0
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}
                  >
                    {sizeDeltaPercent <= 0
                      ? `Smaller by ${Math.abs(sizeDeltaPercent)}% (${formatFileSize(
                          originalSize ?? 0
                        )} → ${formatFileSize(convertedSize ?? 0)})`
                      : `Larger by ${sizeDeltaPercent}% (${formatFileSize(
                          originalSize ?? 0
                        )} → ${formatFileSize(
                          convertedSize ?? 0
                        )}) - expected when converting to a lossless format like PNG.`}
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
                    <p className={labelClass}>
                      Converted ({(convertedFormat ?? targetFormat).replace('image/', '').toUpperCase()})
                    </p>
                    <div
                      className="inline-block max-w-full rounded-lg border border-gray-300 p-2"
                      style={transparencyGridStyle}
                    >
                      <img
                        src={convertedDataUrl}
                        alt="Converted"
                        className="max-h-64 max-w-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(convertedSize ?? 0)} · {convertedWidth} ×{' '}
                      {convertedHeight}px
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-16 text-center">
                Upload an image and click Convert to see the result here...
              </p>
            )}
          </div>
        </div>
      </div>
      <ToolGuide
        title="How to use the Image Format Converter"
        intro="Convert an image between JPEG, WebP and PNG, and optionally turn a flat background transparent. Your image is processed inside your browser and is never uploaded to a server."
        steps={[
          'Add your image: drag and drop it onto the box, or click the box to browse. One image at a time, up to 20 MB.',
          'Under Convert to, choose JPEG, WebP or PNG. Hover over an option to see a short note about its strengths.',
          'Set the Quality with the slider for JPEG and WebP. PNG is lossless, so quality is ignored.',
          'To remove a background, tick Make background transparent. This needs PNG or WebP, because JPEG cannot be transparent.',
          'Choose the Background color to remove, or click Pick from corner to sample the color from the image. Use the Tolerance slider to decide how close a color must be to be removed.',
          'Click Convert. Under Result you can compare the Original and the converted image, and then click Download to save it. Click Clear to start over.',
        ]}
        tips={[
          'Use PNG when you need sharp edges and transparency, WebP for the smallest files on websites, and JPEG for photos that must work everywhere.',
          'Background removal works best on flat, single-color backgrounds such as a white or green screen. It matches colors and does not detect objects.',
          'If part of your subject disappears, lower the Tolerance. If bits of the background remain, raise it a little.',
        ]}
        vi={{
          title: 'Công cụ chuyển đổi định dạng ảnh',
          summary: 'Chuyển đổi ảnh giữa JPG, PNG và WebP (ví dụ PNG sang JPG), kèm tùy chọn làm nền ảnh trong suốt theo màu nền. Công cụ không nhận diện chủ thể bằng AI nên phù hợp nhất với nền đơn sắc. Ảnh được xử lý trên trình duyệt, tối đa 20 MB.',
          steps: [
            'Kéo thả hoặc bấm chọn ảnh, rồi chọn định dạng ở mục Convert to.',
            'Muốn xóa nền, bật Make background transparent (cần PNG hoặc WebP) và chọn màu nền cần xóa.',
            'Bấm Convert, kiểm tra kết quả rồi bấm Download.',
          ],
        }}
      />
    </div>
  );
};

export default ImageFormatConverter;
