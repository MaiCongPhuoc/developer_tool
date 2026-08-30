import { useEffect, useMemo } from 'react';
import ReadOnlyJsonTree from '@/components/ReadOnlyJsonTree';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearDecryption,
  decodeToken,
  setCopied,
  setSecret,
  setTokenInput,
} from '@/store/slices/decryptionSlice';
import { parsePreservingBigInt } from '@/util/bigIntJson';

const inputClass =
  'w-full p-2.5 text-sm border rounded-lg bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:placeholder:text-gray-500';

const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

const signatureBadgeClass: Record<string, string> = {
  valid:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  invalid: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  unverified: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

const signatureLabel: Record<string, string> = {
  valid: 'Signature valid',
  invalid: 'Signature invalid',
  unverified: 'Signature not verified (enter the secret to verify)',
};

// Cây JSON chỉ xem cho 1 khối kết quả (header hoặc payload): parse chuỗi JSON
// đã pretty-print sẵn trong Redux thành object để ReadOnlyJsonTree render.
// decodedHeader/decodedPayload luôn là JSON hợp lệ (được JSON.stringify từ
// decodeAndVerifyJwt), nên parse lại ở đây không lo lỗi cú pháp.
const useJsonValue = (jsonText: string) =>
  useMemo(() => {
    if (!jsonText) return undefined;
    try {
      return parsePreservingBigInt(jsonText);
    } catch {
      return undefined;
    }
  }, [jsonText]);

const Decryption = () => {
  const dispatch = useAppDispatch();
  const {
    tokenInput,
    secret,
    decodedHeader,
    decodedPayload,
    signatureStatus,
    expiresAt,
    isExpired,
    error,
    copied,
  } = useAppSelector((state) => state.decryption);

  const headerValue = useJsonValue(decodedHeader);
  const payloadValue = useJsonValue(decodedPayload);

  // State sống trong Redux nên tồn tại xuyên suốt cả app, không tự mất khi
  // chuyển route như useState thường làm -> phải chủ động xoá mỗi khi vào
  // lại trang này để không còn thấy kết quả của lần trước.
  useEffect(() => {
    dispatch(clearDecryption());
  }, [dispatch]);

  // Giải mã (decode + verify) token
  const handleDecode = () => {
    dispatch(decodeToken());
  };

  // Sao chép kết quả
  const handleCopy = async (text: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    dispatch(setCopied(true));
    setTimeout(() => dispatch(setCopied(false)), 2000);
  };

  // Xóa nội dung
  const handleClear = () => {
    dispatch(clearDecryption());
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
        JWT Decoder
      </h1>

      <div className="space-y-4 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
        {/* Thanh công cụ */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDecode}
            className="flex-1 sm:flex-none min-w-30 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
          >
            Decode Token
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

        {/* Input token */}
        <div className="flex flex-col space-y-2">
          <label className={labelClass}>Token:</label>
          <textarea
            value={tokenInput}
            onChange={(e) => dispatch(setTokenInput(e.target.value))}
            placeholder="Paste your JWT here... e.g. eyJhbGciOi...header.eyJzdWIi...payload.signature"
            className={`${inputClass} h-28 font-mono resize-none`}
            spellCheck={false}
          />
        </div>

        {/* Secret để verify chữ ký (không bắt buộc) - thuật toán tự đọc từ
            claim "alg" trong header của token, không bắt chọn tay */}
        <div className="flex flex-col space-y-2 max-w-md">
          <label className={labelClass}>
            Secret (optional, to verify signature):
          </label>
          <input
            type="text"
            value={secret}
            onChange={(e) => dispatch(setSecret(e.target.value))}
            placeholder="your-256-bit-secret"
            className={inputClass}
          />
        </div>

        {/* Kết quả */}
        {headerValue !== undefined && payloadValue !== undefined && (
          <>
            {signatureStatus && (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${signatureBadgeClass[signatureStatus]}`}
                >
                  {signatureLabel[signatureStatus]}
                </span>
                {expiresAt && (
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      isExpired
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                    }`}
                  >
                    {isExpired ? 'Expired at ' : 'Expires at '}
                    {new Date(expiresAt).toLocaleString()}
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <label className={labelClass}>
                    Header (Formatted Output):
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopy(decodedHeader)}
                    className="text-xs px-2.5 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 transition"
                  >
                    {copied ? 'Copied!' : 'Copy Output'}
                  </button>
                </div>
                <div className="w-full h-40 overflow-auto p-3 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
                  <ReadOnlyJsonTree value={headerValue} />
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <label className={labelClass}>
                    Payload (Formatted Output):
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopy(decodedPayload)}
                    className="text-xs px-2.5 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 transition"
                  >
                    {copied ? 'Copied!' : 'Copy Output'}
                  </button>
                </div>
                <div className="w-full h-40 overflow-auto p-3 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
                  <ReadOnlyJsonTree value={payloadValue} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Decryption;
