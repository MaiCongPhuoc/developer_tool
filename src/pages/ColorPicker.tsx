import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  applyHexInput,
  clearColorPicker,
  clearEyedropper,
  clearPalette,
  setColor,
  setCopiedField,
  setError,
  setHexInput,
  setTab,
  setUploadedImage,
} from '@/store/slices/colorPickerSlice';
import { getAllColorFormats, rgbToHex } from '@/util/color';
import type { ColorPickerTab } from '@/util/interface/Type';
import { readFileAsDataUrl, validateImageFile } from '@/util/imagePixel';

const inputClass =
  'w-full p-2.5 text-sm border rounded-lg bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:placeholder:text-gray-500 font-mono';

const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

const TAB_OPTIONS: { id: ColorPickerTab; label: string }[] = [
  { id: 'palette', label: 'Palette' },
  { id: 'eyedropper', label: 'Eyedropper' },
];

// Bộ màu mẫu lấy từ chính bảng màu Tailwind (mức 500) - vừa quen mắt, vừa
// đồng bộ với phong cách thiết kế sẵn có của app.
const PRESET_COLORS = [
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#EAB308',
  '#84CC16',
  '#22C55E',
  '#10B981',
  '#14B8A6',
  '#06B6D4',
  '#0EA5E9',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#A855F7',
  '#D946EF',
  '#EC4899',
  '#F43F5E',
  '#78716C',
  '#6B7280',
  '#1F2937',
  '#000000',
  '#FFFFFF',
];

// Kích thước kính lúp: 1 lưới 9x9 pixel quanh con trỏ, mỗi pixel phóng to
// thành 1 ô vuông 8x8 - ra canvas kính lúp 72x72, đủ để thấy rõ từng pixel
// riêng lẻ mà vẫn gọn trong tooltip.
const LOUPE_GRID_SIZE = 9;
const LOUPE_CELL_SIZE = 8;
const LOUPE_CANVAS_SIZE = LOUPE_GRID_SIZE * LOUPE_CELL_SIZE;

const ColorPicker = () => {
  const dispatch = useAppDispatch();
  const { tab, hex, hexInput, copiedField, error, uploadedImage } =
    useAppSelector((state) => state.colorPicker);

  const [isLoadingImage, setIsLoadingImage] = useState(false);
  // Thông tin tooltip bám theo con trỏ khi rê chuột trên ảnh - đổi liên tục
  // theo từng pixel, đưa vào Redux sẽ dispatch hàng trăm action/giây không
  // cần thiết, nên chỉ sống trong component. clientX/clientY để định vị
  // tooltip trên màn hình; sourceX/sourceY (toạ độ pixel THẬT trên canvas
  // gốc) để vẽ kính lúp phóng to đúng vùng ảnh quanh điểm đang trỏ.
  const [hoverInfo, setHoverInfo] = useState<{
    clientX: number;
    clientY: number;
    sourceX: number;
    sourceY: number;
    hex: string;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  // State sống trong Redux nên tồn tại xuyên suốt cả app, không tự mất khi
  // chuyển route như useState thường làm -> phải chủ động xoá mỗi khi vào
  // lại trang này để không còn thấy kết quả của lần trước.
  useEffect(() => {
    dispatch(clearColorPicker());
  }, [dispatch]);

  // Vẽ lại ảnh lên canvas mỗi khi uploadedImage đổi - đặt kích thước canvas
  // ĐÚNG BẰNG pixel gốc của ảnh (không phải kích thước hiển thị trên trang)
  // để getImageData sau này đọc đúng pixel, còn kích thước hiển thị được co
  // lại bằng CSS (max-w-full) - xem getPixelHexAtEvent bù lại tỉ lệ này.
  useEffect(() => {
    if (!uploadedImage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      // willReadFrequently: true - context này còn được đọc lại liên tục
      // bằng getImageData mỗi khi rê chuột (xem getPixelHexAtEvent), không
      // chỉ vẽ 1 lần. Phải bật ngay từ lần lấy context ĐẦU TIÊN vì trình
      // duyệt chỉ áp dụng option này lúc khởi tạo context, các lần
      // getContext('2d') sau trên cùng canvas đều bỏ qua option truyền vào.
      canvas
        .getContext('2d', { willReadFrequently: true })
        ?.drawImage(img, 0, 0);
    };
    img.src = uploadedImage;
  }, [uploadedImage]);

  // Vẽ kính lúp phóng to vùng pixel quanh con trỏ mỗi khi hoverInfo đổi -
  // dùng drawImage với imageSmoothingEnabled=false để phóng to KIỂU RĂNG CƯA
  // (nearest-neighbor), thấy rõ từng pixel vuông thay vì bị làm mờ/nội suy
  // như phóng to ảnh thông thường - đúng kiểu kính lúp của ống hút màu thật.
  useEffect(() => {
    const loupeCanvas = loupeCanvasRef.current;
    const sourceCanvas = canvasRef.current;
    if (!loupeCanvas || !sourceCanvas || !hoverInfo) return;

    const ctx = loupeCanvas.getContext('2d');
    if (!ctx) return;

    const half = Math.floor(LOUPE_GRID_SIZE / 2);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, LOUPE_CANVAS_SIZE, LOUPE_CANVAS_SIZE);
    ctx.drawImage(
      sourceCanvas,
      hoverInfo.sourceX - half,
      hoverInfo.sourceY - half,
      LOUPE_GRID_SIZE,
      LOUPE_GRID_SIZE,
      0,
      0,
      LOUPE_CANVAS_SIZE,
      LOUPE_CANVAS_SIZE
    );

    // Lưới phân cách từng pixel - giúp đếm/nhận biết ranh giới pixel rõ ràng.
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1;
    for (let i = 1; i < LOUPE_GRID_SIZE; i++) {
      const pos = i * LOUPE_CELL_SIZE + 0.5;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, LOUPE_CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(LOUPE_CANVAS_SIZE, pos);
      ctx.stroke();
    }

    // Viền đậm đánh dấu đúng ô pixel TRUNG TÂM - chính là pixel sẽ được chọn
    // nếu bấm chuột lúc này.
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      half * LOUPE_CELL_SIZE + 1,
      half * LOUPE_CELL_SIZE + 1,
      LOUPE_CELL_SIZE - 2,
      LOUPE_CELL_SIZE - 2
    );
  }, [hoverInfo]);

  const formats = getAllColorFormats(hex);

  const handleTabChange = (nextTab: ColorPickerTab) => {
    dispatch(setTab(nextTab));
  };

  // Clear ở cả 2 tab đều đưa màu về DEFAULT_HEX (#000000) như nhau (xem
  // colorPickerSlice.ts) - Eyedropper có thêm bước xoá ảnh đã tải lên. Cả 2
  // đều ở lại đúng tab hiện tại, không đổi `tab`.
  const handleClear = () => {
    dispatch(tab === 'palette' ? clearPalette() : clearEyedropper());
    // Xoá tooltip đang bám theo con trỏ (nếu có) - tránh trường hợp bấm
    // Clear trong lúc chuột vẫn đang ở trên canvas, để lại tooltip lơ lửng
    // hiển thị màu của ảnh vừa bị xoá.
    setHoverInfo(null);
  };

  const handleCopy = async (text: string, field: 'hex' | 'rgb' | 'hsl') => {
    try {
      await navigator.clipboard.writeText(text);
      dispatch(setCopiedField(field));
      setTimeout(() => dispatch(setCopiedField(null)), 2000);
    } catch {
      dispatch(setError('Could not copy to clipboard. Please copy manually.'));
    }
  };

  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    // Reset ngay value của input để lần sau chọn lại ĐÚNG file cũ vẫn bắn
    // sự kiện onChange - trình duyệt chỉ bắn onChange khi value thực sự đổi.
    e.target.value = '';
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      dispatch(setError(validationError));
      return;
    }

    setIsLoadingImage(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      dispatch(setUploadedImage(dataUrl));
    } catch (err) {
      dispatch(
        setError(
          err instanceof Error ? err.message : `Could not read "${file.name}".`
        )
      );
    } finally {
      setIsLoadingImage(false);
    }
  };

  // Quy đổi toạ độ chuột (theo kích thước HIỂN THỊ, có thể đã bị co lại bằng
  // CSS max-h-96) sang đúng toạ độ pixel THẬT trên canvas (theo kích thước
  // gốc của ảnh) - nếu bỏ qua bước quy đổi này, ảnh càng bị co nhỏ trên màn
  // hình thì điểm lấy màu sẽ càng lệch xa vị trí con trỏ thật. Trả về cả toạ
  // độ nguồn (sourceX/sourceY) để dùng vẽ kính lúp, không chỉ mã màu.
  const getPixelInfoAtEvent = (
    e: React.MouseEvent<HTMLCanvasElement>
  ): { sourceX: number; sourceY: number; hex: string } | null => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return null;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(
      ((e.clientY - rect.top) / rect.height) * canvas.height
    );
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return null;

    const { data } = ctx.getImageData(x, y, 1, 1);
    return { sourceX: x, sourceY: y, hex: rgbToHex(data[0], data[1], data[2]) };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const picked = getPixelInfoAtEvent(e);
    if (picked) dispatch(setColor(picked.hex));
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const picked = getPixelInfoAtEvent(e);
    // clientX/clientY (toạ độ theo VIEWPORT, không phải toạ độ trong canvas)
    // để định vị tooltip bằng position: fixed, không bị cắt bởi khung
    // overflow-auto quanh canvas khi ảnh lớn hơn khung hiển thị.
    setHoverInfo(
      picked
        ? {
            clientX: e.clientX,
            clientY: e.clientY,
            sourceX: picked.sourceX,
            sourceY: picked.sourceY,
            hex: picked.hex,
          }
        : null
    );
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
        Color Picker
      </h1>

      <div className="space-y-4 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
        {/* Chọn tab */}
        <div className="flex flex-wrap rounded-lg border border-gray-200 p-1 dark:border-gray-700 w-fit">
          {TAB_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleTabChange(opt.id)}
              className={`min-w-28 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                tab === opt.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {tab === 'palette' ? (
          <div key="palette-tab" className="space-y-4">
            {/* Bảng màu gốc của trình duyệt/OS */}
            <div className="flex flex-col space-y-2">
              <label className={labelClass}>Pick a color:</label>
              <input
                type="color"
                value={hex}
                onChange={(e) => dispatch(setColor(e.target.value))}
                className="h-11 w-24 cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700"
              />
            </div>

            {/* Gõ tay mã HEX */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-1 min-w-40 flex-col space-y-2">
                <label className={labelClass}>Or enter a HEX code:</label>
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => dispatch(setHexInput(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') dispatch(applyHexInput());
                  }}
                  placeholder="#3B82F6"
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={() => dispatch(applyHexInput())}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
              >
                Apply
              </button>
            </div>

            {/* Bảng màu mẫu */}
            <div className="flex flex-col space-y-2">
              <label className={labelClass}>Or choose a preset:</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => dispatch(setColor(preset))}
                    title={preset}
                    aria-label={`Pick color ${preset}`}
                    className={`h-8 w-8 rounded-md border transition hover:scale-110 ${
                      hex === preset
                        ? 'border-blue-500 ring-2 ring-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    style={{ backgroundColor: preset }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div key="eyedropper-tab" className="space-y-3">
            <input
              ref={imageFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />
            <button
              type="button"
              onClick={() => imageFileInputRef.current?.click()}
              disabled={isLoadingImage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingImage
                ? 'Loading image...'
                : uploadedImage
                  ? 'Change image'
                  : 'Upload image'}
            </button>

            {isLoadingImage ? (
              <div className="w-full p-3 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
                <LoadingIndicator />
              </div>
            ) : uploadedImage ? (
              <div className="flex flex-col space-y-2">
                <label className={labelClass}>
                  Click anywhere on the image to pick its color:
                </label>
                {/* Khung nền luôn trắng để nhìn rõ viền canvas dù ảnh có vùng
                    trong suốt (PNG) hay màu tối. max-h giới hạn chiều cao
                    hiển thị (ảnh gốc có thể rất lớn) - canvas vẫn giữ đúng độ
                    phân giải pixel gốc bên trong, chỉ CO LẠI lúc hiển thị
                    bằng CSS, nên getPixelHexAtEvent vẫn tính đúng pixel nhờ
                    đã quy đổi theo tỉ lệ hiển thị/thực tế. */}
                <div className="inline-block w-fit max-w-full overflow-auto rounded-lg border border-gray-300 bg-white p-2">
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseLeave={() => setHoverInfo(null)}
                    className="max-h-[1200px] w-auto max-w-full cursor-crosshair"
                  />
                </div>

                {/* Tooltip bám theo con trỏ, render qua createPortal thẳng
                    vào document.body - KHÔNG đặt trực tiếp trong cây JSX ở
                    đây, dù dùng position: fixed. Lý do: class Tailwind
                    space-y-2 ở div cha chọn phần tử bằng CSS thuần
                    ":not(:last-child)" - hoàn toàn không quan tâm thuộc tính
                    position - nên hễ tooltip tồn tại trong cây con này, nó
                    vẫn bị tính là "1 sibling" khiến khung ảnh phía trên
                    không còn là :last-child nữa và bị gắn thêm margin-bottom,
                    đẩy nút Clear bên dưới lệch xuống mỗi khi rê chuột.
                    createPortal đưa hẳn DOM node ra khỏi cây này nên không
                    còn ảnh hưởng gì tới layout xung quanh nữa.
                    Vị trí tự lật sang trái/lên trên khi con trỏ ở gần mép
                    phải/dưới màn hình để không tràn ra ngoài viewport. */}
                {hoverInfo &&
                  createPortal(
                    (() => {
                      const hoverFormats = getAllColorFormats(hoverInfo.hex);
                      const flipX = window.innerWidth - hoverInfo.clientX < 260;
                      const flipY =
                        window.innerHeight - hoverInfo.clientY < 100;
                      return (
                        <div
                          className="pointer-events-none fixed z-50 flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-lg dark:border-gray-600 dark:bg-gray-800"
                          style={{
                            left: hoverInfo.clientX + (flipX ? -260 : 16),
                            top: hoverInfo.clientY + (flipY ? -88 : 16),
                          }}
                        >
                          <canvas
                            ref={loupeCanvasRef}
                            width={LOUPE_CANVAS_SIZE}
                            height={LOUPE_CANVAS_SIZE}
                            className="shrink-0 rounded-full border-2 border-gray-300 dark:border-gray-500"
                            style={{ imageRendering: 'pixelated' }}
                          />
                          <div className="flex flex-col font-mono text-xs text-gray-700 dark:text-gray-200">
                            <span>{hoverFormats.hex}</span>
                            <span>{hoverFormats.rgb}</span>
                            <span>{hoverFormats.hsl}</span>
                          </div>
                        </div>
                      );
                    })(),
                    document.body
                  )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Upload an image to start picking colors from it.
              </p>
            )}
          </div>
        )}

        {/* Thông báo lỗi nếu có */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Thanh công cụ */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 sm:flex-none min-w-30 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition"
          >
            Clear
          </button>
        </div>

        {/* Kết quả - dùng chung cho cả 2 tab, luôn hiện màu đang áp dụng */}
        <div className="flex flex-col space-y-2">
          <label className={labelClass}>Selected Color:</label>
          <div className="w-full p-3 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-4">
              {/* Khung nền luôn trắng (không theo dark mode) quanh swatch để
                  các màu tối/đen vẫn thấy rõ viền, giống cách QR code giữ
                  nền trắng cố định để luôn quét được. */}
              <div className="inline-block shrink-0 rounded-lg border border-gray-300 bg-white p-2">
                <div
                  className="h-16 w-16 rounded-md border border-gray-200"
                  style={{ backgroundColor: formats.hex }}
                />
              </div>
              <div className="flex flex-1 min-w-48 flex-col gap-1.5">
                {(
                  [
                    ['hex', 'HEX', formats.hex],
                    ['rgb', 'RGB', formats.rgb],
                    ['hsl', 'HSL', formats.hsl],
                  ] as const
                ).map(([field, label, value]) => (
                  <div key={field} className="flex items-center gap-2">
                    <span className="w-10 shrink-0 text-xs font-medium text-gray-400 dark:text-gray-500">
                      {label}
                    </span>
                    <code className="flex-1 font-mono text-sm text-gray-800 dark:text-gray-100">
                      {value}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(value, field)}
                      className="shrink-0 text-xs px-2.5 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 transition"
                    >
                      {copiedField === field ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
