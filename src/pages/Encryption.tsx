import { useEffect } from 'react';
import LoadingIndicator from '@/components/LoadingIndicator';
import { useDelayedAction } from '@/hook/useDelayedAction';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearJwt,
  decodeJwt,
  encodeJwt,
  setAlgorithm,
  setCopiedField,
  setError,
  setHeaderInput,
  setMode,
  setPayloadInput,
  setSecret,
  setTokenInput,
} from '@/store/slices/jwtSlice';
import type { JwtAlgorithm, JwtMode } from '@/util/interface/Type';

const algorithms: JwtAlgorithm[] = ['HS256', 'HS384', 'HS512'];

const textareaClass =
  'w-full h-40 p-3 font-mono text-sm border rounded-lg bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:placeholder:text-gray-500 resize-none';

const inputClass =
  'w-full p-2.5 text-sm border rounded-lg bg-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:placeholder:text-gray-500';

const labelClass = 'text-sm font-medium text-gray-700 dark:text-gray-300';

// 3 màu chuẩn của jwt.io: header hồng, payload tím, signature xanh - giúp
// người xem nhận ra ngay ranh giới giữa 3 phần chỉ bằng màu, không cần đếm dấu chấm.
const tokenSegmentClass = [
  'text-rose-500 dark:text-rose-400',
  'text-purple-600 dark:text-purple-400',
  'text-sky-600 dark:text-sky-400',
];

const ColoredToken = ({ token }: { token: string }) => {
  const parts = token.split('.');
  return (
    <p className="break-all font-mono text-sm">
      {parts.map((part, index) => (
        <span key={index}>
          <span className={tokenSegmentClass[index] ?? ''}>{part}</span>
          {index < parts.length - 1 && (
            <span className="text-gray-400 dark:text-gray-500">.</span>
          )}
        </span>
      ))}
    </p>
  );
};

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

const Encryption = () => {
  const dispatch = useAppDispatch();
  const {
    mode,
    algorithm,
    headerInput,
    payloadInput,
    secret,
    encodedToken,
    tokenInput,
    decodedHeader,
    decodedPayload,
    signatureStatus,
    expiresAt,
    isExpired,
    error,
    copiedField,
  } = useAppSelector((state) => state.jwt);
  const { loading, run, cancel } = useDelayedAction();

  // State sống trong Redux nên tồn tại xuyên suốt cả app, không tự mất khi
  // chuyển route như useState thường làm -> phải chủ động xoá mỗi khi vào
  // lại trang này để không còn thấy kết quả của lần trước.
  useEffect(() => {
    dispatch(clearJwt());
  }, [dispatch]);

  const handleModeChange = (nextMode: JwtMode) => {
    cancel();
    dispatch(setMode(nextMode));
  };

  const handleClear = () => {
    cancel();
    dispatch(clearJwt());
  };

  // Encode/Decode JWT - trễ RESULT_DELAY_MS để hiện khung chờ trước khi trả
  // kết quả, xem lý do ở useDelayedAction.
  const handleEncode = () => {
    run(() => dispatch(encodeJwt()));
  };

  const handleDecode = () => {
    run(() => dispatch(decodeJwt()));
  };

  // `field` xác định ĐÚNG nút Copy nào vừa được bấm (encoded token / header /
  // payload) - nếu không, dùng chung 1 cờ "copied" cho cả 3 nút sẽ khiến bấm
  // Copy ở 1 nút làm TẤT CẢ các nút khác cũng đổi chữ thành "Copied!" theo,
  // dù chỉ có 1 nội dung thực sự được ghi vào clipboard.
  const handleCopy = async (
    text: string,
    field: 'encoded' | 'header' | 'payload'
  ) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      dispatch(setCopiedField(field));
      setTimeout(() => dispatch(setCopiedField(null)), 2000);
    } catch {
      // Clipboard API có thể bị từ chối (trang không phải HTTPS, trình
      // duyệt chặn quyền, tab mất focus...) - báo lỗi rõ ràng lên banner đỏ
      // thay vì âm thầm không làm gì, khiến người dùng tưởng đã copy thành công.
      dispatch(setError('Could not copy to clipboard. Please copy the text manually.'));
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
        JWT Encoder / Decoder
      </h1>

      <div className="space-y-4 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
        {/* Thanh công cụ: chuyển đổi Encode / Decode + Clear */}
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-1 sm:flex-none rounded-lg border border-gray-200 p-1 dark:border-gray-700">
            <button
              type="button"
              onClick={() => handleModeChange('encode')}
              className={`flex-1 sm:flex-none min-w-24 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                mode === 'encode'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Encode
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('decode')}
              className={`flex-1 sm:flex-none min-w-24 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                mode === 'decode'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Decode
            </button>
          </div>
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

        {mode === 'encode' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-2">
                <label className={labelClass}>Header (JSON):</label>
                <textarea
                  value={headerInput}
                  onChange={(e) => dispatch(setHeaderInput(e.target.value))}
                  className={textareaClass}
                  spellCheck={false}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <label className={labelClass}>Payload (JSON):</label>
                <textarea
                  value={payloadInput}
                  onChange={(e) => dispatch(setPayloadInput(e.target.value))}
                  className={textareaClass}
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col space-y-2">
                <label className={labelClass}>Algorithm:</label>
                <select
                  value={algorithm}
                  onChange={(e) =>
                    dispatch(setAlgorithm(e.target.value as JwtAlgorithm))
                  }
                  className={`${inputClass} w-32`}
                >
                  {algorithms.map((alg) => (
                    <option key={alg} value={alg}>
                      {alg}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-1 min-w-50 flex-col space-y-2">
                <label className={labelClass}>Secret:</label>
                <input
                  type="text"
                  value={secret}
                  onChange={(e) => dispatch(setSecret(e.target.value))}
                  placeholder="your-256-bit-secret"
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={handleEncode}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Processing...' : 'Generate JWT'}
              </button>
            </div>

            {loading ? (
              <div className="w-full p-3 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
                <LoadingIndicator />
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <div className="flex flex-wrap gap-2 justify-between items-center">
                  <label className={labelClass}>Encoded Token:</label>
                  {encodedToken && (
                    <button
                      type="button"
                      onClick={() => handleCopy(encodedToken, 'encoded')}
                      className="text-xs px-2.5 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 transition"
                    >
                      {copiedField === 'encoded' ? 'Copied!' : 'Copy Output'}
                    </button>
                  )}
                </div>
                <div className="w-full p-3 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
                  {encodedToken ? (
                    <ColoredToken token={encodedToken} />
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      The encoded token will appear here...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label className={labelClass}>Token:</label>
              <textarea
                value={tokenInput}
                onChange={(e) => dispatch(setTokenInput(e.target.value))}
                placeholder="Paste your JWT here... e.g. eyJhbGciOi...header.eyJzdWIi...payload.signature"
                className={`${textareaClass} h-28`}
                spellCheck={false}
              />
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-1 min-w-50 flex-col space-y-2">
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
              <button
                type="button"
                onClick={handleDecode}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Processing...' : 'Decode JWT'}
              </button>
            </div>

            {loading && (
              <div className="w-full p-3 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
                <LoadingIndicator />
              </div>
            )}

            {!loading && decodedHeader && decodedPayload && (
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
                      <label className={labelClass}>Header:</label>
                      <button
                        type="button"
                        onClick={() => handleCopy(decodedHeader, 'header')}
                        className="text-xs px-2.5 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 transition"
                      >
                        {copiedField === 'header' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <pre className="w-full h-40 overflow-auto p-3 font-mono text-sm border rounded-lg bg-white text-rose-600 dark:bg-gray-900 dark:border-gray-700 dark:text-rose-400">
                      {decodedHeader}
                    </pre>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <label className={labelClass}>Payload:</label>
                      <button
                        type="button"
                        onClick={() => handleCopy(decodedPayload, 'payload')}
                        className="text-xs px-2.5 py-1 bg-gray-200 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 transition"
                      >
                        {copiedField === 'payload' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <pre className="w-full h-40 overflow-auto p-3 font-mono text-sm border rounded-lg bg-white text-purple-600 dark:bg-gray-900 dark:border-gray-700 dark:text-purple-400">
                      {decodedPayload}
                    </pre>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Encryption;
