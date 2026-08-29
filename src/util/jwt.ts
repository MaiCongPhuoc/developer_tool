export type JwtAlgorithm = 'HS256' | 'HS384' | 'HS512';

const algorithmToHash: Record<JwtAlgorithm, string> = {
  HS256: 'SHA-256',
  HS384: 'SHA-384',
  HS512: 'SHA-512',
};

const toBase64Url = (base64: string): string =>
  base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromBase64Url = (base64Url: string): string => {
  const padded = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  return padded + '='.repeat(padLength);
};

// Base64URL (RFC 4648 §5) hỗ trợ UTF-8 - dùng cho header/payload JSON, có thể
// chứa ký tự ngoài ASCII (vd tên tiếng Việt trong payload).
export const base64UrlEncode = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return toBase64Url(btoa(binary));
};

export const base64UrlDecode = (encoded: string): string => {
  const binary = atob(fromBase64Url(encoded));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const importHmacKey = (secret: string, algorithm: JwtAlgorithm) =>
  crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: algorithmToHash[algorithm] },
    false,
    ['sign', 'verify']
  );

// Ký "header.payload" bằng HMAC (Web Crypto API) -> chữ ký dạng Base64URL
export const signHmac = async (
  signingInput: string,
  secret: string,
  algorithm: JwtAlgorithm
): Promise<string> => {
  const key = await importHmacKey(secret, algorithm);
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signingInput)
  );
  let binary = '';
  new Uint8Array(signatureBuffer).forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return toBase64Url(btoa(binary));
};

// So khớp chữ ký đính kèm token với chữ ký tính lại từ "header.payload" + secret
export const verifyHmac = async (
  signingInput: string,
  signatureBase64Url: string,
  secret: string,
  algorithm: JwtAlgorithm
): Promise<boolean> => {
  const key = await importHmacKey(secret, algorithm);
  const binary = atob(fromBase64Url(signatureBase64Url));
  const signatureBytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    new TextEncoder().encode(signingInput)
  );
};

export type DecodedJwtParts = {
  header: string;
  payload: string;
  signature: string;
};

// Tách JWT thành 3 phần rồi decode header/payload về JSON string thô (chưa
// parse, chưa verify chữ ký)
export const splitAndDecodeJwt = (token: string): DecodedJwtParts => {
  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    throw new Error(
      'A JWT must have 3 parts separated by dots (header.payload.signature).'
    );
  }

  const [headerPart, payloadPart, signaturePart] = parts;
  return {
    header: base64UrlDecode(headerPart),
    payload: base64UrlDecode(payloadPart),
    signature: signaturePart,
  };
};

export type JwtSignatureStatus = 'valid' | 'invalid' | 'unverified';

export type JwtDecodeResult = {
  header: string;
  payload: string;
  signature: string;
  signatureStatus: JwtSignatureStatus;
  expiresAt: string | null;
  isExpired: boolean | null;
};

const supportedAlgorithms: JwtAlgorithm[] = ['HS256', 'HS384', 'HS512'];

// Dùng chung cho cả trang Encryption (mode decode) lẫn trang Decryption:
// tách + decode JWT, verify chữ ký bằng HMAC nếu có secret (thuật toán lấy
// từ claim "alg" ghi sẵn trong header của token), và tính sẵn hạn dùng
// (claim "exp") ngay tại đây để nơi gọi chỉ cần hiển thị.
export const decodeAndVerifyJwt = async (
  tokenInput: string,
  secret: string
): Promise<JwtDecodeResult> => {
  const { header, payload, signature } = splitAndDecodeJwt(tokenInput);
  const parsedHeader = JSON.parse(header) as { alg?: string };
  const parsedPayload = JSON.parse(payload) as { exp?: number };

  let signatureStatus: JwtSignatureStatus = 'unverified';
  if (secret) {
    const alg = parsedHeader.alg;
    if (supportedAlgorithms.includes(alg as JwtAlgorithm)) {
      const [headerPart, payloadPart] = tokenInput.trim().split('.');
      const isValid = await verifyHmac(
        `${headerPart}.${payloadPart}`,
        signature,
        secret,
        alg as JwtAlgorithm
      );
      signatureStatus = isValid ? 'valid' : 'invalid';
    } else {
      signatureStatus = 'invalid';
    }
  }

  let expiresAt: string | null = null;
  let isExpired: boolean | null = null;
  if (typeof parsedPayload.exp === 'number') {
    const expDate = new Date(parsedPayload.exp * 1000);
    expiresAt = expDate.toISOString();
    isExpired = expDate.getTime() < Date.now();
  }

  return {
    header: JSON.stringify(parsedHeader, null, 2),
    payload: JSON.stringify(parsedPayload, null, 2),
    signature,
    signatureStatus,
    expiresAt,
    isExpired,
  };
};
