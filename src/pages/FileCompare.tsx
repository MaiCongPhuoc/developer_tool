import { useEffect, useRef, useState } from 'react';
import FileCompareView from '@/components/FileCompareView';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useDelayedAction } from '@/hook/useDelayedAction';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearFileCompare,
  compareFiles,
  setFileCompareError,
  setLeftFile,
  setRightFile,
} from '@/store/slices/fileCompareSlice';
import {
  formatFileSize,
  isLikelyBinaryContent,
  readFileAsText,
  TEXT_FILE_ACCEPT,
  validateCompareFile,
} from '@/util/file';

const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

type FileSide = 'left' | 'right';

const dropZoneBaseClass =
  'flex h-48 sm:h-64 lg:h-80 xl:h-96 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition';

const FileCompare = () => {
  const dispatch = useAppDispatch();
  const { leftFile, rightFile, stats, error } = useAppSelector(
    (state) => state.fileCompare
  );
  const { loading, run, cancel } = useDelayedAction();

  // Trạng thái "đang đọc file" chỉ phục vụ hiển thị UI (spinner trong khung
  // thả file), không cần lưu vào Redux - giống cách `loading` của Compare
  // cũng chỉ sống trong useDelayedAction chứ không nằm trong slice.
  const [readingSide, setReadingSide] = useState<FileSide | null>(null);
  const [dragSide, setDragSide] = useState<FileSide | null>(null);

  const leftInputRef = useRef<HTMLInputElement>(null);
  const rightInputRef = useRef<HTMLInputElement>(null);

  // State sống trong Redux nên tồn tại xuyên suốt cả app, không tự mất khi
  // chuyển route như useState thường làm -> phải chủ động xoá mỗi khi vào
  // lại trang này để không còn thấy kết quả của lần trước.
  useEffect(() => {
    dispatch(clearFileCompare());
  }, [dispatch]);

  // Kiểm tra + đọc nội dung 1 file được chọn (qua input hoặc kéo-thả), rồi
  // lưu vào Redux. Dùng chung cho cả 2 bên trái/phải qua tham số `side`.
  const handleFile = async (side: FileSide, file: File) => {
    const validationError = validateCompareFile(file);
    if (validationError) {
      dispatch(setFileCompareError(validationError));
      return;
    }

    setReadingSide(side);
    try {
      const content = await readFileAsText(file);
      if (isLikelyBinaryContent(content)) {
        dispatch(
          setFileCompareError(
            `"${file.name}" looks like a binary file and cannot be compared as text.`
          )
        );
        return;
      }
      const payload = { name: file.name, size: file.size, content };
      dispatch(side === 'left' ? setLeftFile(payload) : setRightFile(payload));
    } catch (err) {
      dispatch(
        setFileCompareError(
          err instanceof Error ? err.message : `Could not read "${file.name}".`
        )
      );
    } finally {
      setReadingSide(null);
    }
  };

  const handleInputChange = (
    side: FileSide,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    // Reset ngay value của input để lần sau chọn lại ĐÚNG file cũ (cùng
    // đường dẫn) vẫn bắn sự kiện onChange - trình duyệt chỉ bắn onChange khi
    // value thực sự đổi.
    e.target.value = '';
    if (file) handleFile(side, file);
  };

  const handleDrop = (side: FileSide, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragSide(null);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    if (files.length > 1) {
      dispatch(setFileCompareError('Please drop only one file at a time.'));
      return;
    }
    handleFile(side, files[0]);
  };

  const handleRemove = (side: FileSide) => {
    dispatch(side === 'left' ? setLeftFile(null) : setRightFile(null));
    const inputRef = side === 'left' ? leftInputRef : rightInputRef;
    if (inputRef.current) inputRef.current.value = '';
  };

  // So sánh 2 file hiện có - trễ RESULT_DELAY_MS để hiện khung chờ trước khi
  // trả kết quả, xem lý do ở useDelayedAction.
  const handleCompare = () => {
    run(() => dispatch(compareFiles()));
  };

  // Xóa nội dung
  const handleClear = () => {
    cancel();
    dispatch(clearFileCompare());
    if (leftInputRef.current) leftInputRef.current.value = '';
    if (rightInputRef.current) rightInputRef.current.value = '';
  };

  const isIdentical =
    !loading && stats
      ? stats.inserted === 0 && stats.deleted === 0 && stats.modified === 0
      : false;

  const renderDropZone = (side: FileSide) => {
    const file = side === 'left' ? leftFile : rightFile;
    const inputRef = side === 'left' ? leftInputRef : rightInputRef;
    const isReading = readingSide === side;
    const isDragOver = dragSide === side;

    // Cả khối là 1 vùng bấm được (không chỉ riêng nút/chữ "click to browse")
    // để chọn file - bấm vào bất kỳ đâu trong khung đều mở hộp thoại chọn
    // file, giống hành vi quen thuộc của các dropzone kéo-thả. Nút Change/
    // Remove bên trong tự stopPropagation để không bị kích hoạt kèm.
    const openPicker = () => {
      if (!isReading) inputRef.current?.click();
    };

    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={file ? `Change ${file.name}` : 'Select a file to compare'}
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
          setDragSide(side);
        }}
        onDragLeave={() => setDragSide((prev) => (prev === side ? null : prev))}
        onDrop={(e) => handleDrop(side, e)}
      >
        <input
          ref={inputRef}
          type="file"
          accept={TEXT_FILE_ACCEPT}
          className="hidden"
          onChange={(e) => handleInputChange(side, e)}
        />

        {isReading ? (
          <LoadingIndicator label="Reading file..." />
        ) : file ? (
          <div className="flex w-full flex-col items-center gap-2">
            <p
              className="w-full truncate text-center text-sm font-medium text-gray-800 dark:text-gray-100"
              title={file.name}
            >
              {file.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatFileSize(file.size)}
            </p>
            <div className="flex gap-2">
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
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(side);
                }}
                className="text-xs px-2.5 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition dark:bg-red-900/40 dark:text-red-300"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
            <span className="text-sm">Drag & drop a file here</span>
            <span className="text-xs">or click anywhere to browse</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
        File Compare
      </h1>

      <div className="space-y-4 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
        {/* Thanh công cụ */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCompare}
            disabled={loading || !leftFile || !rightFile || !!readingSide}
            className="flex-1 sm:flex-none min-w-30 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Processing...' : 'Compare'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 sm:flex-none min-w-30 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition"
          >
            Clear
          </button>
        </div>

        {/* Khu vực chọn 2 file cần so sánh - chỉ nhận file text (source
            code, config, markup, log...), xem danh sách đầy đủ ở
            TEXT_FILE_EXTENSIONS trong util/file.ts. Ảnh/tài liệu văn
            phòng/file nén/file nhị phân khác không so sánh được ở đây. */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="flex flex-col space-y-2">
            <label
              className={labelClass}
              title="Text-based files only: .txt, .csv, .json, .xml, .yaml, .md, .log, source code, config files, ... Images, PDF/Office documents, archives (zip, rar...) and other binary files are not supported."
            >
              Original file (text-based files only):
            </label>
            {renderDropZone('left')}
          </div>
          <div className="flex flex-col space-y-2">
            <label
              className={labelClass}
              title="Text-based files only: .txt, .csv, .json, .xml, .yaml, .md, .log, source code, config files, ... Images, PDF/Office documents, archives (zip, rar...) and other binary files are not supported."
            >
              Changed file (text-based files only):
            </label>
            {renderDropZone('right')}
          </div>
        </div>

        {/* Thông báo lỗi nếu có */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Kết quả so sánh */}
        <div className="flex flex-col space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className={labelClass}>Comparison result:</label>
            {!loading && stats && !isIdentical && (
              <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-300">
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm bg-yellow-300 dark:bg-yellow-700" />
                  {stats.modified} modified
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm bg-green-300 dark:bg-green-700" />
                  {stats.inserted} added
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-sm bg-red-300 dark:bg-red-700" />
                  {stats.deleted} deleted
                </span>
              </div>
            )}
          </div>
          {isIdentical && (
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm dark:bg-green-900/30 dark:border-green-800 dark:text-green-300">
              The two files are identical.
            </div>
          )}
          <div
            className={`w-full overflow-auto border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 ${
              loading || stats ? 'h-72 sm:h-96 xl:h-128' : ''
            }`}
          >
            <FileCompareView
              loading={loading}
              leftLabel={leftFile?.name ?? 'Original file'}
              rightLabel={rightFile?.name ?? 'Changed file'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileCompare;
