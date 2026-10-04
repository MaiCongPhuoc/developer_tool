// File này chứa TOÀN BỘ phần xử lý nặng của Document Converter (docx, xlsx, pdf,
// pptx...). Nó KHÔNG được import tĩnh ở bất kỳ đâu - chỉ được nạp động
// (import()) từ documentConverter.ts đúng lúc người dùng bấm chuyển đổi. Nhờ
// vậy hơn 2MB thư viện không nằm trong bundle JS chính, trang tải nhanh hơn
// và các nút bấm có tác dụng sớm hơn trên điện thoại.
//
// Đổi tên Document -> DocxDocument vì "Document" (lớp tài liệu Word của thư
// viện docx) trùng tên với DOM Document toàn cục (dùng ở parseXmlString bên
// dưới) - không đổi tên sẽ khiến TypeScript hiểu nhầm mọi chỗ dùng "Document"
// trong file này là kiểu Word document, kể cả khi đang nói tới XML Document.
import { Document as DocxDocument, HeadingLevel, ImageRun, PageBreak, Packer, Paragraph, Table, TableCell, TableRow } from 'docx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFPageProxy } from 'pdfjs-dist';
// Vite bundles file này thành 1 asset riêng và trả về URL thật của nó (hậu tố
// `?url`) - pdf.js BẮT BUỘC phải có URL tới file worker để chạy việc giải mã
// PDF trên 1 thread riêng (Web Worker), không đụng tới main thread đang vẽ UI.
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import pptxgen from 'pptxgenjs';
import * as XLSX from 'xlsx';

import { MAX_PDF_PAGES_FOR_PPTX, MIME_BY_FORMAT } from '@/util/documentConverter';
import { computeScaledDimensions, loadImageElement } from '@/util/imageCompressor';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

// ---- Đọc ảnh nhúng trong .xlsx (OOXML/ECMA-376 - chuẩn mở, không cần trả
// phí để tự đọc) - SheetJS bản miễn phí (Community Edition) KHÔNG hỗ trợ đọc
// ảnh nhúng trong Excel (đọc/ghi ảnh là tính năng SheetJS Pro, xem README của
// chính thư viện xlsx). File .xlsx thực chất là 1 file .zip chứa nhiều phần
// XML - tự giải nén bằng jszip rồi lần theo chuỗi quan hệ
// workbook.xml -> sheetN.xml -> drawingN.xml -> ảnh để lấy đúng byte ảnh +
// dòng neo. Tra theo NAMESPACE (không theo tiền tố "xdr:"/"a:"/"r:") vì tiền
// tố chỉ là quy ước, không phải chuẩn bắt buộc. ----

const OOXML_NS = {
  relationships: 'http://schemas.openxmlformats.org/package/2006/relationships',
  drawingSpreadsheet: 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing',
  drawingMain: 'http://schemas.openxmlformats.org/drawingml/2006/main',
  officeRelationships: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  spreadsheetMain: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
};

const parseXmlString = (text: string): Document => new DOMParser().parseFromString(text, 'application/xml');

// Ghép 1 đường dẫn TƯƠNG ĐỐI kiểu OOXML (vd "../media/image1.png") với thư
// mục gốc của phần đang đọc nó, ra đường dẫn TUYỆT ĐỐI trong file zip.
const resolveOoxmlPath = (baseDir: string, relativePath: string): string => {
  const parts = baseDir.split('/').filter(Boolean);
  for (const segment of relativePath.split('/')) {
    if (segment === '..') parts.pop();
    else if (segment !== '.') parts.push(segment);
  }
  return parts.join('/');
};

const splitPath = (path: string): { dir: string; fileName: string } => {
  const slashIndex = path.lastIndexOf('/');
  return { dir: path.slice(0, slashIndex), fileName: path.slice(slashIndex + 1) };
};

const findWorksheetPath = async (zip: JSZip, sheetName: string): Promise<string | null> => {
  const workbookFile = zip.file('xl/workbook.xml');
  const workbookRelsFile = zip.file('xl/_rels/workbook.xml.rels');
  if (!workbookFile || !workbookRelsFile) return null;

  const workbookXml = parseXmlString(await workbookFile.async('string'));
  const sheetEl = Array.from(
    workbookXml.getElementsByTagNameNS(OOXML_NS.spreadsheetMain, 'sheet')
  ).find((el) => el.getAttribute('name') === sheetName);
  const rId = sheetEl?.getAttributeNS(OOXML_NS.officeRelationships, 'id');
  if (!rId) return null;

  const relsXml = parseXmlString(await workbookRelsFile.async('string'));
  const rel = Array.from(relsXml.getElementsByTagNameNS(OOXML_NS.relationships, 'Relationship')).find(
    (el) => el.getAttribute('Id') === rId
  );
  const target = rel?.getAttribute('Target');
  return target ? resolveOoxmlPath('xl', target) : null;
};

const findDrawingPathForWorksheet = async (zip: JSZip, worksheetPath: string): Promise<string | null> => {
  const { dir, fileName } = splitPath(worksheetPath);
  const relsFile = zip.file(`${dir}/_rels/${fileName}.rels`);
  if (!relsFile) return null;

  const relsXml = parseXmlString(await relsFile.async('string'));
  const rel = Array.from(relsXml.getElementsByTagNameNS(OOXML_NS.relationships, 'Relationship')).find((el) =>
    (el.getAttribute('Type') ?? '').endsWith('/drawing')
  );
  const target = rel?.getAttribute('Target');
  return target ? resolveOoxmlPath(dir, target) : null;
};

const parseDrawingAnchors = (drawingXml: Document): { row: number; relId: string }[] => {
  const anchors: { row: number; relId: string }[] = [];
  for (const tagName of ['oneCellAnchor', 'twoCellAnchor', 'absoluteAnchor']) {
    for (const anchorEl of Array.from(drawingXml.getElementsByTagNameNS(OOXML_NS.drawingSpreadsheet, tagName))) {
      const fromEl = anchorEl.getElementsByTagNameNS(OOXML_NS.drawingSpreadsheet, 'from')[0];
      const rowEl = fromEl?.getElementsByTagNameNS(OOXML_NS.drawingSpreadsheet, 'row')[0];
      const row = rowEl?.textContent ? Number(rowEl.textContent) : 0;
      const relId = anchorEl
        .getElementsByTagNameNS(OOXML_NS.drawingMain, 'blip')[0]
        ?.getAttributeNS(OOXML_NS.officeRelationships, 'embed');
      if (relId) anchors.push({ row, relId });
    }
  }
  return anchors;
};

const findImagePathForRelId = async (
  zip: JSZip,
  drawingPath: string,
  relId: string
): Promise<string | null> => {
  const { dir, fileName } = splitPath(drawingPath);
  const relsFile = zip.file(`${dir}/_rels/${fileName}.rels`);
  if (!relsFile) return null;

  const relsXml = parseXmlString(await relsFile.async('string'));
  const rel = Array.from(relsXml.getElementsByTagNameNS(OOXML_NS.relationships, 'Relationship')).find(
    (el) => el.getAttribute('Id') === relId
  );
  const target = rel?.getAttribute('Target');
  return target ? resolveOoxmlPath(dir, target) : null;
};

// Chỉ hỗ trợ ảnh raster phổ biến - bỏ qua định dạng vector (emf/wmf, Excel
// hay dùng khi dán ảnh từ clipboard) vì trình duyệt/docx không hiển thị trực
// tiếp được, không đáng để tự viết thêm 1 bộ chuyển đổi vector->raster riêng.
export const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  bmp: 'image/bmp',
};

const DOCX_IMAGE_TYPE_BY_EXTENSION: Record<string, 'png' | 'jpg' | 'gif' | 'bmp'> = {
  png: 'png',
  jpg: 'jpg',
  jpeg: 'jpg',
  gif: 'gif',
  bmp: 'bmp',
};

export type XlsxEmbeddedImage = {
  dataUrl: string;
  bytes: Uint8Array;
  docxType: 'png' | 'jpg' | 'gif' | 'bmp';
  // Dòng neo ảnh trong sheet GỐC (0-based, tính từ ô A1) - dùng để tìm dòng
  // nội dung gần nhất mà chèn ảnh vào ngay sau (xem interleaveRowsWithImages).
  anchorRow: number;
};

// Tách riêng phần THÂN từ readXlsxEmbeddedImages để dùng chung 1 JSZip đã mở
// sẵn khi đọc NHIỀU sheet (parseXlsxSource) - tránh giải nén lại cùng 1 file
// nhiều lần. try/catch bọc riêng từng sheet, không phải toàn bộ file: 1 sheet
// có cấu trúc drawing khác thường (hiếm gặp) không nên làm mất ảnh của các
// sheet khác vẫn đọc bình thường.
const readXlsxEmbeddedImagesFromZip = async (zip: JSZip, sheetName: string): Promise<XlsxEmbeddedImage[]> => {
  try {
    const worksheetPath = await findWorksheetPath(zip, sheetName);
    if (!worksheetPath) return [];
    const drawingPath = await findDrawingPathForWorksheet(zip, worksheetPath);
    if (!drawingPath) return [];
    const drawingFile = zip.file(drawingPath);
    if (!drawingFile) return [];

    const anchors = parseDrawingAnchors(parseXmlString(await drawingFile.async('string')));

    const images: XlsxEmbeddedImage[] = [];
    for (const anchor of anchors) {
      const imagePath = await findImagePathForRelId(zip, drawingPath, anchor.relId);
      const imageFile = imagePath ? zip.file(imagePath) : null;
      if (!imagePath || !imageFile) continue;

      const extension = imagePath.slice(imagePath.lastIndexOf('.') + 1).toLowerCase();
      const docxType = DOCX_IMAGE_TYPE_BY_EXTENSION[extension];
      const mime = IMAGE_MIME_BY_EXTENSION[extension];
      if (!docxType || !mime) continue;

      const [bytes, base64] = await Promise.all([imageFile.async('uint8array'), imageFile.async('base64')]);
      images.push({ dataUrl: `data:${mime};base64,${base64}`, bytes, docxType, anchorRow: anchor.row });
    }
    return images;
  } catch {
    return [];
  }
};

export const readXlsxEmbeddedImages = async (
  arrayBuffer: ArrayBuffer,
  sheetName: string
): Promise<XlsxEmbeddedImage[]> => {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);
    return await readXlsxEmbeddedImagesFromZip(zip, sheetName);
  } catch {
    // File .xlsx không giải nén được (hiếm, file hỏng) - không nên làm hỏng
    // toàn bộ việc đọc file, coi như "không có ảnh".
    return [];
  }
};

// ---- Ghi ảnh vào 1 file .xlsx mới (chiều ngược lại của readXlsxEmbeddedImages
// ở trên) - cũng là tính năng SheetJS Pro trả phí nếu dùng thư viện làm sẵn,
// nên tự viết bằng cách "vá" thêm các phần XML còn thiếu vào 1 file .xlsx ĐÃ
// HỢP LỆ do chính XLSX.write() (miễn phí) sinh ra, thay vì tự viết cả bộ ghi
// Excel từ đầu. Rủi ro: Excel kiểm tra khá chặt THỨ TỰ phần tử XML trong mỗi
// sheet - phần <drawing> phải nằm sau các phần tử chuẩn khác (pageMargins...)
// nhưng trước 1 số phần tử hiếm gặp hơn (tableParts, extLst...); vì máy không
// có Excel/LibreOffice để tự mở kiểm tra trực tiếp, nên NGƯỜI DÙNG NÊN TỰ MỞ
// THỬ file kết quả bằng Excel thật trước khi tin tưởng dùng. ----

const EXTENSION_BY_IMAGE_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
};

const dataUrlToMimeAndBase64 = (dataUrl: string): { mime: string; base64: string } => {
  const match = /^data:([^;]+);base64,([\s\S]*)$/.exec(dataUrl);
  if (!match) throw new Error('Unsupported image data URL.');
  return { mime: match[1], base64: match[2] };
};

// 914400 EMU = 1 inch; ở màn hình chuẩn 96dpi thì 1 pixel = 914400/96 = 9525 EMU.
const EMU_PER_PIXEL = 9525;

export type InjectableXlsxImage = {
  dataUrl: string;
  // Dòng muốn neo ảnh vào trong SHEET MỚI (0-based) - khác anchorRow của
  // XlsxEmbeddedImage (đó là dòng trong sheet NGUỒN đã có sẵn).
  row: number;
};

export const injectImagesIntoXlsx = async (
  baseArrayBuffer: ArrayBuffer,
  sheetName: string,
  images: InjectableXlsxImage[]
): Promise<Blob> => {
  const mediaEntries = images
    .map((image, index) => {
      const { mime, base64 } = dataUrlToMimeAndBase64(image.dataUrl);
      const extension = EXTENSION_BY_IMAGE_MIME[mime];
      return extension ? { index, row: image.row, extension, base64 } : null;
    })
    .filter((entry): entry is { index: number; row: number; extension: string; base64: string } => entry !== null);

  if (mediaEntries.length === 0) {
    return new Blob([baseArrayBuffer], { type: MIME_BY_FORMAT.xlsx });
  }

  const zip = await JSZip.loadAsync(baseArrayBuffer);
  const worksheetPath = await findWorksheetPath(zip, sheetName);
  if (!worksheetPath) {
    // Không tìm được đúng sheet để neo ảnh - trả về file gốc (vẫn dùng được,
    // chỉ thiếu ảnh) thay vì làm hỏng cả file.
    return new Blob([baseArrayBuffer], { type: MIME_BY_FORMAT.xlsx });
  }

  mediaEntries.forEach((entry) => {
    zip.file(`xl/media/image${entry.index + 1}.${entry.extension}`, entry.base64, { base64: true });
  });

  const anchorsXml = mediaEntries
    .map((entry, i) => {
      const relId = `rId${i + 1}`;
      const sizeEmu = MAX_EMBEDDED_IMAGE_DIMENSION_PX * EMU_PER_PIXEL;
      return `<xdr:oneCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${entry.row}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:ext cx="${sizeEmu}" cy="${sizeEmu}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="${
        i + 2
      }" name="Picture ${i + 1}"/><xdr:cNvPicPr/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${sizeEmu}" cy="${sizeEmu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor>`;
    })
    .join('');
  zip.file(
    'xl/drawings/drawing1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="${OOXML_NS.drawingSpreadsheet}" xmlns:a="${OOXML_NS.drawingMain}" xmlns:r="${OOXML_NS.officeRelationships}">${anchorsXml}</xdr:wsDr>`
  );

  zip.file(
    'xl/drawings/_rels/drawing1.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${OOXML_NS.relationships}">${mediaEntries
      .map(
        (entry, i) =>
          `<Relationship Id="rId${i + 1}" Type="${OOXML_NS.officeRelationships}/image" Target="../media/image${
            entry.index + 1
          }.${entry.extension}"/>`
      )
      .join('')}</Relationships>`
  );

  const { dir: worksheetDir, fileName: worksheetFileName } = splitPath(worksheetPath);
  const drawingRelId = 'rIdInjectedDrawing1';
  zip.file(
    `${worksheetDir}/_rels/${worksheetFileName}.rels`,
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${OOXML_NS.relationships}"><Relationship Id="${drawingRelId}" Type="${OOXML_NS.officeRelationships}/drawing" Target="../drawings/drawing1.xml"/></Relationships>`
  );

  // <drawing> phải là 1 trong những phần tử CUỐI CÙNG bên trong <worksheet>
  // theo đúng thứ tự schema OOXML (sau sheetData/pageMargins...) - vì
  // XLSX.write() không tự sinh ra các phần tử hiếm gặp đứng SAU <drawing>
  // (tableParts, extLst...), chèn ngay trước </worksheet> là đúng vị trí.
  const worksheetFile = zip.file(worksheetPath);
  if (worksheetFile) {
    const worksheetXml = await worksheetFile.async('string');
    zip.file(worksheetPath, worksheetXml.replace('</worksheet>', `<drawing r:id="${drawingRelId}"/></worksheet>`));
  }

  const contentTypesFile = zip.file('[Content_Types].xml');
  if (contentTypesFile) {
    const contentTypesXml = await contentTypesFile.async('string');
    const missingExtensions = Array.from(new Set(mediaEntries.map((entry) => entry.extension))).filter(
      (extension) => !contentTypesXml.includes(`Extension="${extension}"`)
    );
    const extraParts =
      missingExtensions
        .map((extension) => `<Default Extension="${extension}" ContentType="image/${extension === 'jpg' ? 'jpeg' : extension}"/>`)
        .join('') +
      '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>';
    zip.file('[Content_Types].xml', contentTypesXml.replace('</Types>', `${extraParts}</Types>`));
  }

  const outputArrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });
  return new Blob([outputArrayBuffer], { type: MIME_BY_FORMAT.xlsx });
};

// ---- Đọc (parse) file nguồn ----

export type DocxSourceData = {
  kind: 'docx';
  html: string;
};

// 1 sheet Excel đã đọc xong - workbook Excel thật có thể có NHIỀU sheet (mỗi
// sheet là 1 "tab" riêng ở cuối màn hình Excel), trước đây app chỉ đọc đúng
// SheetNames[0] (sheet đầu tiên) nên các sheet còn lại bị bỏ qua hoàn toàn dù
// người dùng vẫn thấy đủ trong Excel gốc (bug đã gặp và sửa 2026-09-14).
export type XlsxSheetData = {
  name: string;
  // Đã là chữ ĐÃ ĐỊNH DẠNG (`.w` của từng ô, xem sheetToFormattedAoa) - luôn
  // là string, không phải giá trị thô (.v) của ô.
  aoa: string[][];
  // originalRowIndexes[i] = chỉ số dòng THẬT trong sheet gốc của aoa[i] (sau
  // khi đã lọc dòng trống) - dùng để chèn lại ảnh đính kèm đúng chỗ.
  originalRowIndexes: number[];
  images: XlsxEmbeddedImage[];
  // HTML xem trước CỦA RIÊNG sheet này (đã xen ảnh đúng vị trí, xem
  // buildXlsxSheetBodyHtml) - dùng làm nội dung 1 tab trong khung xem trước
  // (mỗi sheet Excel = 1 tab riêng, giống hệt cách Excel thật chia tab ở
  // cuối màn hình, thay vì gộp chung mọi sheet vào 1 khối cuộn dài - xem
  // DocumentConverter.tsx).
  html: string;
};

export type XlsxSourceData = {
  kind: 'xlsx';
  sheets: XlsxSheetData[];
};

export type PdfSourceData = {
  kind: 'pdf';
  pageCount: number;
  textByPage: string[];
  thumbnailDataUrl: string;
  // Chỉ render ảnh TỪNG TRANG khi thật sự cần (target = PowerPoint) thay vì
  // ngay lúc đọc file - PDF nhiều trang mà người dùng chỉ muốn xuất ra Word/
  // Excel (chỉ cần chữ) sẽ không phải tốn thời gian vẽ canvas vô ích.
  getPageImage: (pageNumber: number) => Promise<string>;
  destroy: () => void;
};

export type ParsedSource = DocxSourceData | XlsxSourceData | PdfSourceData;

export const parseDocxSource = async (arrayBuffer: ArrayBuffer): Promise<DocxSourceData> => {
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  // Giới hạn kích thước ảnh nhúng NGAY LÚC ĐỌC file (giống hệt cách
  // parseXlsxSource làm với sheet.html) - dùng chung 1 bản HTML đã "gọn
  // gàng" cho cả preview lẫn buildDocxPdfBlob, thay vì mỗi nơi tự xử lý
  // riêng. Mammoth không giữ lại kích thước hiển thị GỐC trong Word (chỉ
  // nhúng nguyên byte ảnh, có thể vài nghìn pixel với ảnh chụp điện thoại) -
  // xem constrainEmbeddedImagesInHtml.
  const html = await constrainEmbeddedImagesInHtml(htmlResult.value);
  return { kind: 'docx', html };
};

// sheet_to_json({header:1}) trả về giá trị THÔ của ô (.v) - vd 1 ô ngày tháng
// ra số serial "46278", 1 ô "100000.00%" ra số thô "1000" - đúng dữ liệu bên
// dưới nhưng KHÔNG phải chữ mà Excel thực sự hiển thị. Mỗi ô sau khi
// XLSX.read() đã được SheetJS tự tính sẵn `.w` (giá trị ĐÃ ĐỊNH DẠNG theo
// đúng number format của ô, vd "13/09/2026", "100000.00%", "1200 1/4") -
// dùng `.w` khi có thay vì `.v` để bảng AOA khớp đúng những gì người dùng
// nhìn thấy trong Excel (bug đã gặp và sửa 2026-09-13, xem sheet_to_html bên
// dưới KHÔNG bị lỗi này vì nó vốn đã tự dùng `.w`).
const sheetToFormattedAoa = (
  sheet: XLSX.WorkSheet
): { aoa: string[][]; originalRowIndexes: number[] } => {
  const ref = sheet['!ref'];
  if (!ref) return { aoa: [], originalRowIndexes: [] };
  const range = XLSX.utils.decode_range(ref);
  const aoa: string[][] = [];
  const originalRowIndexes: number[] = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: string[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      row.push(cell?.w ?? (cell?.v !== undefined ? String(cell.v) : ''));
    }
    // Bỏ các dòng HOÀN TOÀN trống (mọi ô đều rỗng) - vd dòng nằm dưới 1 ảnh
    // chèn vào Excel (ảnh không tính là nội dung ô nên các dòng đó vẫn
    // "trống" theo dữ liệu ô) - giữ lại sẽ ra hàng loạt dòng trống vô nghĩa ở
    // PDF/Word/PowerPoint. originalRowIndexes ghi lại đúng dòng gốc còn giữ
    // lại, dùng để chèn ảnh đính kèm về đúng vị trí gần nhất (xem
    // interleaveRowsWithImages).
    if (row.some((cell) => cell !== '')) {
      aoa.push(row);
      originalRowIndexes.push(r);
    }
  }
  return { aoa, originalRowIndexes };
};

// Chỉ mở JSZip 1 LẦN cho toàn bộ file rồi dùng chung cho mọi sheet (thay vì
// gọi readXlsxEmbeddedImages - vốn tự giải nén lại từ đầu - cho từng sheet) -
// tránh giải nén lặp lại cùng 1 file nhiều lần khi workbook có nhiều sheet.
// Giải nén lỗi (file .xlsx hợp lệ với SheetJS nhưng không phải file zip đọc
// được, cực hiếm) không nên chặn việc đọc dữ liệu ô - coi như không sheet nào
// có ảnh thay vì báo lỗi toàn bộ.
export const parseXlsxSource = async (arrayBuffer: ArrayBuffer): Promise<XlsxSourceData> => {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  if (workbook.SheetNames.length === 0) {
    throw new Error('This spreadsheet has no sheets to read.');
  }

  let zip: JSZip | null = null;
  try {
    zip = await JSZip.loadAsync(arrayBuffer);
  } catch {
    zip = null;
  }

  const sheets: XlsxSheetData[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const { aoa, originalRowIndexes } = sheetToFormattedAoa(sheet);
    const images = zip ? await readXlsxEmbeddedImagesFromZip(zip, sheetName) : [];
    // Dựng preview từ CHÍNH logic dùng để convert (buildXlsxSheetBodyHtml,
    // xen ảnh đúng vị trí qua interleaveRowsWithImages) thay vì
    // XLSX.utils.sheet_to_html() - sheet_to_html KHÔNG biết gì về ảnh nhúng
    // (SheetJS free vốn không đọc được ảnh), nên trước đây preview luôn thiếu
    // ảnh dù bản convert thật sự đã có (bug đã gặp và sửa 2026-09-14). Không
    // gộp tiêu đề tên sheet vào HTML này nữa - mỗi sheet giờ là 1 TAB riêng ở
    // trang (xem DocumentConverter.tsx), bản thân cái tab đã hiện tên sheet
    // rồi nên không cần lặp lại tiêu đề bên trong nội dung.
    const html = await buildXlsxSheetBodyHtml({ aoa, originalRowIndexes, images });
    sheets.push({ name: sheetName, aoa, originalRowIndexes, images, html });
  }

  return { kind: 'xlsx', sheets };
};

const PDF_THUMBNAIL_SCALE = 1;
const PDF_PAGE_IMAGE_SCALE = 1.5;
// Chênh lệch toạ độ Y (đơn vị pdf point) đủ lớn để coi là "xuống dòng mới" -
// pdf.js chỉ trả về từng mảnh chữ kèm toạ độ, không có khái niệm "dòng" như
// text thường; gom các mảnh có cùng toạ độ Y (lệch trong ngưỡng này) thành 1
// dòng là cách xấp xỉ phổ biến, đủ tốt để chữ trích ra không dính liền thành
// 1 khối duy nhất.
const LINE_BREAK_Y_THRESHOLD = 2;

const renderPdfPageToDataUrl = async (page: PDFPageProxy, scale: number): Promise<string> => {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvas, viewport }).promise;
  return canvas.toDataURL('image/png');
};

export const parsePdfSource = async (arrayBuffer: ArrayBuffer): Promise<PdfSourceData> => {
  // Giữ lại loadingTask (không chỉ pdf đã resolve) vì destroy() để giải
  // phóng Web Worker của pdf.js nằm ở loadingTask, không phải ở PDFDocumentProxy.
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  const textByPage: string[] = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();

    const lines: string[] = [];
    let currentLine: string[] = [];
    let lastY: number | null = null;
    for (const item of content.items) {
      if (!('str' in item)) continue;
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > LINE_BREAK_Y_THRESHOLD && currentLine.length > 0) {
        lines.push(currentLine.join(' '));
        currentLine = [];
      }
      if (item.str) currentLine.push(item.str);
      lastY = y;
    }
    if (currentLine.length > 0) lines.push(currentLine.join(' '));
    textByPage.push(lines.join('\n'));
  }

  const firstPage = await pdf.getPage(1);
  const thumbnailDataUrl = await renderPdfPageToDataUrl(firstPage, PDF_THUMBNAIL_SCALE);

  return {
    kind: 'pdf',
    pageCount,
    textByPage,
    thumbnailDataUrl,
    getPageImage: async (pageNumber: number) => {
      const page = await pdf.getPage(pageNumber);
      return renderPdfPageToDataUrl(page, PDF_PAGE_IMAGE_SCALE);
    },
    destroy: () => {
      void loadingTask.destroy();
    },
  };
};

// ---- Tạo file đích ----

const toCellText = (value: unknown): string => (value === undefined || value === null ? '' : String(value));

const padAoa = (aoa: unknown[][]): string[][] => {
  if (aoa.length === 0) return [['(empty)']];
  const maxCols = Math.max(1, ...aoa.map((row) => row.length));
  return aoa.map((row) => Array.from({ length: maxCols }, (_, i) => toCellText(row[i])));
};

type RowGroupBlock = { type: 'rows'; rows: string[][] } | { type: 'image'; image: XlsxEmbeddedImage };

// Chèn ảnh nhúng vào ĐÚNG vị trí (ngay sau dòng nội dung GẦN NHẤT phía trước
// vị trí neo gốc trong Excel) xen giữa các nhóm dòng dữ liệu - dùng chung cho
// cả 3 đích (PDF/Word/PowerPoint) để không viết lặp lại logic này 3 lần. Các
// dòng trống thuần (nơi ảnh thường "nổi" đè lên trong Excel) đã bị lọc khỏi
// `rows` (xem sheetToFormattedAoa) nên không thể chèn đúng y hệt dòng gốc -
// đây là 1 vị trí XẤP XỈ hợp lý, không phải pixel-perfect như Excel gốc.
const interleaveRowsWithImages = (
  rows: string[][],
  originalRowIndexes: number[],
  images: XlsxEmbeddedImage[],
  maxRowsPerGroup: number
): RowGroupBlock[] => {
  const sortedImages = [...images].sort((a, b) => a.anchorRow - b.anchorRow);
  const blocks: RowGroupBlock[] = [];
  let buffer: string[][] = [];
  let imageIndex = 0;

  const flushBuffer = () => {
    for (let i = 0; i < buffer.length; i += maxRowsPerGroup) {
      blocks.push({ type: 'rows', rows: buffer.slice(i, i + maxRowsPerGroup) });
    }
    buffer = [];
  };

  // Ảnh neo TRƯỚC dòng nội dung đầu tiên (hoặc sheet không có dòng nội dung
  // nào cả, chỉ có ảnh).
  while (
    imageIndex < sortedImages.length &&
    (rows.length === 0 || sortedImages[imageIndex].anchorRow < originalRowIndexes[0])
  ) {
    blocks.push({ type: 'image', image: sortedImages[imageIndex] });
    imageIndex++;
  }

  rows.forEach((row, index) => {
    buffer.push(row);
    const isLastRow = index === rows.length - 1;
    while (
      imageIndex < sortedImages.length &&
      sortedImages[imageIndex].anchorRow >= originalRowIndexes[index] &&
      (isLastRow || sortedImages[imageIndex].anchorRow < originalRowIndexes[index + 1])
    ) {
      flushBuffer();
      blocks.push({ type: 'image', image: sortedImages[imageIndex] });
      imageIndex++;
    }
  });
  flushBuffer();

  // Ảnh còn dư (neo sau dòng nội dung cuối cùng).
  while (imageIndex < sortedImages.length) {
    blocks.push({ type: 'image', image: sortedImages[imageIndex] });
    imageIndex++;
  }

  return blocks;
};

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const renderAoaTableHtml = (rows: string[][]): string =>
  `<table>${rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('')}</table>`;

// Word cần biết TRƯỚC kích thước ảnh (không tự đo như thẻ <img> của trình
// duyệt) - dùng chính Image() của trình duyệt để đọc kích thước thật rồi thu
// nhỏ nếu cần (tái dùng computeScaledDimensions đã có ở util/imageCompressor.ts).
const MAX_EMBEDDED_IMAGE_DIMENSION_PX = 400;

const computeEmbeddedImageSize = async (dataUrl: string): Promise<{ width: number; height: number }> => {
  const img = await loadImageElement(dataUrl);
  return computeScaledDimensions(img.naturalWidth, img.naturalHeight, MAX_EMBEDDED_IMAGE_DIMENSION_PX);
};

// Gán rõ width/height (px) cho MỌI <img> trong 1 đoạn HTML, theo đúng kích
// thước đã tính ở computeEmbeddedImageSize - KHÔNG dựa vào CSS (vd
// "max-width:100%") để giới hạn kích thước ảnh khi render bằng html2canvas,
// vì % chỉ tính đúng khi phần tử cha có chiều rộng XÁC ĐỊNH. Với Excel->PDF,
// container "tự co theo nội dung" (display:inline-block, không có chiều rộng
// cố định - xem renderHtmlToPdfBlob/PDF_RENDER_WIDTH_PX) khiến trình duyệt
// không tính được % đó theo cách mong đợi: ảnh (có thể vài nghìn pixel với
// ảnh chụp điện thoại) tự kéo cả container rộng ra bằng đúng kích thước GỐC
// của nó, làm sai lệch tỉ lệ toàn trang khi ép vừa khổ giấy - chữ bị phóng to
// bất thường, ảnh bị cắt tràn qua nhiều trang (bug đã gặp và sửa 2026-09-14).
// width/height là THUỘC TÍNH HTML (không phải CSS) nên luôn được hiểu đúng dù
// container có chiều rộng xác định hay không.
const constrainEmbeddedImagesInHtml = async (html: string): Promise<string> => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  await Promise.all(
    Array.from(doc.querySelectorAll('img')).map(async (img) => {
      const src = img.getAttribute('src');
      if (!src?.startsWith('data:')) return;
      try {
        const { width, height } = await computeEmbeddedImageSize(src);
        img.setAttribute('width', String(width));
        img.setAttribute('height', String(height));
        img.removeAttribute('style');
      } catch {
        // Ảnh lỗi/không đọc được kích thước (hiếm gặp) - bỏ qua, giữ nguyên
        // ảnh gốc thay vì làm hỏng toàn bộ nội dung còn lại.
      }
    })
  );
  return doc.body.innerHTML;
};

// Khổ A4 ở 96dpi (210mm) - html2canvas cần 1 chiều rộng cố định để layout
// HTML nhất quán, không phụ thuộc kích thước cửa sổ trình duyệt hiện tại. Chỉ
// dùng cho Word (xem renderHtmlToPdfBlob) - Excel không có khái niệm "khổ
// trang" nên để bảng tự nhiên rộng bao nhiêu thì chụp bấy nhiêu.
const PDF_RENDER_WIDTH_PX = 794;

// html2canvas chụp NGAY sau khi gán innerHTML - với ảnh base64 (mammoth nhúng
// ảnh docx thành data URI), trình duyệt vẫn cần thêm 1 nhịp để GIẢI MÃ xong
// ảnh trước khi có gì để vẽ. Không đợi bước này, html2canvas chụp trúng lúc
// ảnh chưa kịp paint -> PDF ra khoảng trắng đúng chỗ đáng lẽ có ảnh (bug đã
// gặp và sửa 2026-09-13). img.decode() là API chuẩn của trình duyệt để biết
// chắc chắn 1 ảnh đã sẵn sàng vẽ, kể cả khi `.complete` đã true nhưng ảnh lỗi/
// không giải mã được thì bỏ qua (catch rỗng) - 1 ảnh hỏng không nên làm hỏng
// toàn bộ việc xuất PDF.
const waitForImagesToSettle = (container: HTMLElement): Promise<void[]> =>
  Promise.all(
    Array.from(container.querySelectorAll('img')).map((img) =>
      img.decode().catch(() => undefined)
    )
  );

type RenderHtmlToPdfOptions = {
  // Word muốn 1 chiều rộng cố định giống trang in A4 thật để văn bản tự
  // xuống dòng đúng cách; bỏ trống (Excel) để bảng tự nhiên rộng bao nhiêu
  // thì chụp bấy nhiêu, rồi tự chọn khổ dọc/ngang theo đúng tỉ lệ ảnh chụp
  // được thay vì đoán trước qua số cột như jspdf-autotable từng làm.
  fixedWidthPx?: number;
};

// "Chụp ảnh" 1 đoạn HTML bằng html2canvas - giữ được font/màu/khoảng cách
// trực quan giống bản gốc (kể cả tiếng Việt có dấu, vì đây là chữ trình duyệt
// tự vẽ bằng font hệ thống, không phải font vector giới hạn WinAnsi của
// jsPDF). Tách riêng khỏi bước cắt trang PDF (addCanvasAsPdfPages) để 1 file
// PDF nhiều "phần" (vd nhiều sheet Excel) có thể ghép nhiều canvas vào CÙNG 1
// jsPDF, mỗi phần bắt đầu 1 trang mới - xem buildXlsxPdfBlob.
const captureHtmlToCanvas = async (
  html: string,
  options: RenderHtmlToPdfOptions = {}
): Promise<HTMLCanvasElement> => {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-10000px';
  if (options.fixedWidthPx) {
    container.style.width = `${options.fixedWidthPx}px`;
  } else {
    container.style.display = 'inline-block';
  }
  container.style.padding = '24px';
  container.style.background = '#FFFFFF';
  container.style.color = '#000000';
  container.style.fontFamily = 'Arial, Helvetica, sans-serif';
  container.innerHTML = html || '<p></p>';
  document.body.appendChild(container);

  try {
    await waitForImagesToSettle(container);
    return await html2canvas(container, { scale: 2, backgroundColor: '#FFFFFF', useCORS: true });
  } finally {
    document.body.removeChild(container);
  }
};

// Cắt 1 canvas (có thể rất cao) thành nhiều trang A4 nối tiếp, vẽ vào `pdf`
// đã có sẵn - trang ĐẦU TIÊN của canvas này vẽ luôn vào trang HIỆN TẠI của
// pdf (không tự gọi addPage() trước), để nơi gọi tự quyết định có cần bắt đầu
// 1 trang mới trước khi vẽ phần này hay không (vd nhiều sheet Excel nối
// tiếp - xem buildXlsxPdfBlob).
const addCanvasAsPdfPages = (pdf: jsPDF, canvas: HTMLCanvasElement): void => {
  const pageWidthMm = pdf.internal.pageSize.getWidth();
  const pageHeightMm = pdf.internal.pageSize.getHeight();
  const imgWidthMm = pageWidthMm;
  const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;
  const imgData = canvas.toDataURL('image/png');

  let heightLeft = imgHeightMm;
  let position = 0;
  pdf.addImage(imgData, 'PNG', 0, position, imgWidthMm, imgHeightMm);
  heightLeft -= pageHeightMm;

  while (heightLeft > 0) {
    position = heightLeft - imgHeightMm;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidthMm, imgHeightMm);
    heightLeft -= pageHeightMm;
  }
};

// Dựng 1 đoạn HTML bất kỳ thành PDF hoàn chỉnh (1 "phần" duy nhất) - dùng cho
// Word->PDF. Trước đây Excel->PDF cũng dùng chung hàm này, nay Excel->PDF tự
// ghép nhiều canvas (1 mỗi sheet) vào 1 jsPDF duy nhất - xem buildXlsxPdfBlob.
const renderHtmlToPdfBlob = async (
  html: string,
  options: RenderHtmlToPdfOptions = {}
): Promise<Blob> => {
  const canvas = await captureHtmlToCanvas(html, options);
  // Khổ dọc/ngang tự chọn theo TỈ LỆ THẬT của nội dung đã chụp - 1 bảng rộng
  // nhiều cột sẽ tự ra canvas rộng hơn cao, lúc đó dùng khổ ngang cho đỡ bị
  // thu nhỏ quá mức khi ép vừa khổ dọc.
  const orientation = canvas.width > canvas.height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  addCanvasAsPdfPages(pdf, canvas);
  return pdf.output('blob');
};

// html (parsed.html) đã được constrainEmbeddedImagesInHtml xử lý sẵn từ lúc
// đọc file (xem parseDocxSource) - không cần gọi lại lần nữa ở đây.
export const buildDocxPdfBlob = (html: string): Promise<Blob> =>
  renderHtmlToPdfBlob(html, { fixedWidthPx: PDF_RENDER_WIDTH_PX });

// Số dòng văn bản gộp vào 1 slide - đủ để đọc được (chữ không quá nhỏ) mà
// không cần thêm tuỳ chọn cấu hình cho người dùng.
const MAX_LINES_PER_SLIDE = 6;

type DocxSlideBlock =
  | { type: 'text'; lines: string[] }
  | { type: 'image'; dataUrl: string };

// Tách HTML của mammoth thành 1 dãy khối chữ/ảnh THEO ĐÚNG THỨ TỰ xuất hiện
// trong tài liệu gốc, bằng DOMParser (API gốc trình duyệt, không cần thư viện
// ngoài - cùng cách tiếp cận với util/xml.ts). Trước đây buildDocxPptxBlob chỉ
// dùng mammoth.extractRawText() (thuần chữ) nên ảnh nhúng trong docx bị bỏ
// qua hoàn toàn dù mammoth ĐÃ trích được ảnh (nhúng base64 trong <img> của
// convertToHtml) - bug đã gặp và sửa 2026-09-13.
const extractDocxSlideBlocks = (html: string): DocxSlideBlock[] => {
  const body = new DOMParser().parseFromString(html, 'text/html').body;
  const blocks: DocxSlideBlock[] = [];
  let currentLines: string[] = [];

  const flushText = () => {
    if (currentLines.length > 0) {
      blocks.push({ type: 'text', lines: currentLines });
      currentLines = [];
    }
  };

  for (const child of Array.from(body.children)) {
    const img = child.tagName === 'IMG' ? (child as HTMLImageElement) : child.querySelector('img');
    if (img?.src.startsWith('data:')) {
      flushText();
      blocks.push({ type: 'image', dataUrl: img.src });
      continue;
    }
    const text = child.textContent?.trim();
    if (text) currentLines.push(text);
  }
  flushText();
  return blocks;
};

// Ghi ảnh nhúng trong Word vào file Excel MỚI - trước đây chỉ dùng
// mammoth.extractRawText() (thuần chữ, không ảnh); giờ tái dùng
// extractDocxSlideBlocks() để lấy đúng thứ tự chữ/ảnh, rồi "vá" ảnh vào file
// .xlsx vừa tạo bằng injectImagesIntoXlsx() (xem giải thích ở đó) - việc GHI
// ảnh vào Excel là tính năng SheetJS Pro trả phí nếu dùng thư viện, nên đây
// là tự viết để vẫn giữ 100% miễn phí (bug đã gặp và sửa 2026-09-14: trước đó
// Word -> Excel luôn mất ảnh vì chỉ trích chữ thuần).
export const buildDocxXlsxBlob = async (html: string): Promise<Blob> => {
  const blocks = extractDocxSlideBlocks(html);
  const aoaRows: string[][] = [];
  const injectableImages: InjectableXlsxImage[] = [];

  for (const block of blocks) {
    if (block.type === 'text') {
      block.lines.forEach((line) => aoaRows.push([line]));
    } else {
      // Neo ảnh vào đúng dòng SẼ ĐƯỢC TẠO tiếp theo trong sheet mới (ngay sau
      // đoạn chữ đứng trước nó, giữ đúng thứ tự xuất hiện trong tài liệu gốc).
      injectableImages.push({ dataUrl: block.dataUrl, row: aoaRows.length });
    }
  }

  const sheet = XLSX.utils.aoa_to_sheet(aoaRows.length > 0 ? aoaRows : [['(empty document)']]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1');
  const baseArrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;

  return injectImagesIntoXlsx(baseArrayBuffer, 'Sheet1', injectableImages);
};

export const buildDocxPptxBlob = async (html: string): Promise<Blob> => {
  const blocks = extractDocxSlideBlocks(html);
  const pptx = new pptxgen();

  const addTextSlide = (lines: string[]) => {
    const slide = pptx.addSlide();
    slide.addText(
      lines.map((line) => ({ text: line, options: { bullet: true, breakLine: true } })),
      { x: 0.5, y: 0.4, w: '90%', h: '90%', fontSize: 18, valign: 'top', color: '363636' }
    );
  };

  // Ảnh đặt riêng 1 slide, canh giữa và co vừa khung (sizing "contain" tự giữ
  // đúng tỉ lệ khung hình, không bị méo) - trừ ra 1 khoảng lề quanh slide.
  const addImageSlide = (dataUrl: string) => {
    const slide = pptx.addSlide();
    slide.addImage({
      data: dataUrl,
      x: 0.5,
      y: 0.5,
      w: PPTX_SLIDE_WIDTH_IN - 1,
      h: PPTX_SLIDE_HEIGHT_IN - 1,
      sizing: { type: 'contain', w: PPTX_SLIDE_WIDTH_IN - 1, h: PPTX_SLIDE_HEIGHT_IN - 1 },
    });
  };

  let hasContent = false;
  for (const block of blocks) {
    if (block.type === 'image') {
      addImageSlide(block.dataUrl);
      hasContent = true;
      continue;
    }
    for (let i = 0; i < block.lines.length; i += MAX_LINES_PER_SLIDE) {
      addTextSlide(block.lines.slice(i, i + MAX_LINES_PER_SLIDE));
      hasContent = true;
    }
  }
  if (!hasContent) addTextSlide(['(empty document)']);

  const output = await pptx.write({ outputType: 'blob' });
  return output as Blob;
};

// CSS tối thiểu cho bảng - HTML thô từ XLSX.utils.sheet_to_html() không có
// viền/khoảng cách ô nào cả, cần tự thêm để chụp ra còn đọc được như 1 bảng
// tính thật (giống PREVIEW_IFRAME_STYLE ở DocumentConverter.tsx, nhưng đây là
// bản dùng khi RENDER RA PDF nên tách riêng thay vì import ngược từ page).
const XLSX_TABLE_STYLE = `<style>
  table { border-collapse: collapse; font-family: Arial, Helvetica, sans-serif; }
  td, th { border: 1px solid #9ca3af; padding: 4px 10px; font-size: 13px; white-space: pre; }
</style>`;

// Dựng lại bảng dưới dạng HTML từ chính `aoa` (thay vì dùng thẳng
// XLSX.utils.sheet_to_html()) để có thể xen ảnh đính kèm vào ĐÚNG vị trí qua
// interleaveRowsWithImages() - đánh đổi nhỏ: bản xem trước (Preview, vẫn dùng
// sheet_to_html) có thể còn giữ vài dòng trống mà PDF thật sự xuất ra thì
// không, do dòng trống đã bị lọc khỏi aoa (xem sheetToFormattedAoa). Ảnh được
// gán rõ width/height qua constrainEmbeddedImagesInHtml (không dựa CSS %) -
// xem giải thích chi tiết ở đó.
const buildXlsxSheetBodyHtml = async (
  sheet: Pick<XlsxSheetData, 'aoa' | 'originalRowIndexes' | 'images'>
): Promise<string> => {
  const rows = sheet.aoa.length > 0 ? padAoa(sheet.aoa) : [];
  const blocks = interleaveRowsWithImages(rows, sheet.originalRowIndexes, sheet.images, Number.POSITIVE_INFINITY);
  if (blocks.length === 0) blocks.push({ type: 'rows', rows: [['(empty)']] });

  const html = blocks
    .map((block) =>
      block.type === 'image'
        ? `<div style="margin:12px 0"><img src="${block.image.dataUrl}"/></div>`
        : renderAoaTableHtml(block.rows)
    )
    .join('');
  return constrainEmbeddedImagesInHtml(html);
};

// Excel có thể có NHIỀU sheet (mỗi sheet là 1 "tab" riêng) - trước đây chỉ
// đọc/convert đúng sheet đầu tiên, các sheet còn lại bị bỏ qua hoàn toàn dù
// vẫn thấy đủ trong Excel gốc (bug đã gặp và sửa 2026-09-14). Giờ MỖI SHEET
// tự chụp thành canvas riêng rồi ghép nối tiếp vào CÙNG 1 jsPDF, mỗi sheet
// luôn bắt đầu 1 TRANG MỚI (kể cả khi sheet trước chưa lấp đầy trang) và tự
// chọn khổ dọc/ngang theo đúng tỉ lệ riêng của sheet đó - không dồn chung mọi
// sheet vào 1 khối ảnh chụp dài lê thê.
export const buildXlsxPdfBlob = async (sheets: XlsxSheetData[]): Promise<Blob> => {
  const canvases = await Promise.all(
    sheets.map((sheet) => {
      // sheet.html đã có sẵn (tính 1 lần lúc parseXlsxSource, dùng chung với
      // khung xem trước) - chỉ cần thêm tiêu đề tên sheet cho riêng bản PDF
      // (trang in cần tự có tiêu đề, khác preview đã có tab hiện tên sheet).
      const heading = `<h2 style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif">${escapeHtml(sheet.name)}</h2>`;
      return captureHtmlToCanvas(XLSX_TABLE_STYLE + heading + sheet.html);
    })
  );

  let pdf: jsPDF | null = null;
  canvases.forEach((canvas) => {
    const orientation = canvas.width > canvas.height ? 'landscape' : 'portrait';
    if (!pdf) {
      pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
    } else {
      pdf.addPage('a4', orientation);
    }
    addCanvasAsPdfPages(pdf, canvas);
  });
  // Không có sheet nào (không nên xảy ra vì parseXlsxSource đã chặn workbook
  // rỗng, nhưng vẫn phòng hờ) - trả về 1 trang trắng thay vì ném lỗi.
  if (!pdf) pdf = new jsPDF({ unit: 'mm', format: 'a4' });

  return pdf.output('blob');
};

export const buildXlsxDocxBlob = async (sheets: XlsxSheetData[]): Promise<Blob> => {
  const children: (Table | Paragraph)[] = [];

  for (const [sheetIndex, sheet] of sheets.entries()) {
    if (sheetIndex > 0) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
    children.push(new Paragraph({ text: sheet.name, heading: HeadingLevel.HEADING_2 }));

    const rows = sheet.aoa.length > 0 ? padAoa(sheet.aoa) : [];
    const blocks = interleaveRowsWithImages(rows, sheet.originalRowIndexes, sheet.images, Number.POSITIVE_INFINITY);
    if (blocks.length === 0) blocks.push({ type: 'rows', rows: [['(empty)']] });

    for (const block of blocks) {
      if (block.type === 'image') {
        const { width, height } = await computeEmbeddedImageSize(block.image.dataUrl);
        children.push(
          new Paragraph({
            children: [new ImageRun({ data: block.image.bytes, type: block.image.docxType, transformation: { width, height } })],
          })
        );
      } else {
        children.push(
          new Table({
            rows: block.rows.map(
              (row) =>
                new TableRow({
                  children: row.map((cell) => new TableCell({ children: [new Paragraph(cell)] })),
                })
            ),
          })
        );
      }
    }
  }
  const doc = new DocxDocument({ sections: [{ children }] });
  return Packer.toBlob(doc);
};

// Số dòng dữ liệu mỗi slide chứa được (chưa kể dòng tiêu đề) - bảng quá dài
// dồn vào 1 slide sẽ bị thu nhỏ tới mức không đọc được.
const MAX_ROWS_PER_SLIDE = 15;

export const buildXlsxPptxBlob = async (sheets: XlsxSheetData[]): Promise<Blob> => {
  const pptx = new pptxgen();

  for (const sheet of sheets) {
    // 1 slide tiêu đề riêng cho mỗi sheet - đơn giản hơn hẳn việc chèn tên
    // sheet chung vào slide bảng đầu tiên (phải né layout bảng/ảnh), và giúp
    // nhận ra ngay ranh giới giữa các sheet khi lướt qua cả bộ slide.
    const titleSlide = pptx.addSlide();
    titleSlide.addText(sheet.name, {
      x: 0.5,
      y: PPTX_SLIDE_HEIGHT_IN / 2 - 0.5,
      w: PPTX_SLIDE_WIDTH_IN - 1,
      h: 1,
      align: 'center',
      fontSize: 32,
      bold: true,
      color: '1F2937',
    });

    const rows = sheet.aoa.length > 0 ? padAoa(sheet.aoa) : [];
    const header = rows[0];
    const dataRows = rows.slice(1);
    // originalRowIndexes cũng bỏ bớt phần tử đầu (ứng với header) để khớp
    // index với dataRows khi đưa vào interleaveRowsWithImages.
    const dataRowIndexes = sheet.originalRowIndexes.slice(1);

    const blocks = header
      ? interleaveRowsWithImages(dataRows, dataRowIndexes, sheet.images, MAX_ROWS_PER_SLIDE)
      : sheet.images.map((image) => ({ type: 'image' as const, image }));
    // Luôn đảm bảo có ít nhất 1 khối bảng (dù rỗng) để hiện được dòng tiêu
    // đề, kể cả khi sheet không có dòng dữ liệu nào ngoài ảnh.
    if (header && !blocks.some((block) => block.type === 'rows')) {
      blocks.unshift({ type: 'rows', rows: [] });
    }
    if (blocks.length === 0) blocks.push({ type: 'rows', rows: [['(empty)']] });

    blocks.forEach((block) => {
      const slide = pptx.addSlide();
      if (block.type === 'image') {
        slide.addImage({
          data: block.image.dataUrl,
          x: 0.5,
          y: 0.5,
          w: PPTX_SLIDE_WIDTH_IN - 1,
          h: PPTX_SLIDE_HEIGHT_IN - 1,
          sizing: { type: 'contain', w: PPTX_SLIDE_WIDTH_IN - 1, h: PPTX_SLIDE_HEIGHT_IN - 1 },
        });
        return;
      }
      const chunk = header ? [header, ...block.rows] : block.rows;
      slide.addTable(
        chunk.map((row) => row.map((cell) => ({ text: cell }))),
        { x: 0.3, y: 0.3, w: '94%', fontSize: 10, border: { type: 'solid', color: 'CFCFCF', pt: 0.5 } }
      );
    });
  }

  const output = await pptx.write({ outputType: 'blob' });
  return output as Blob;
};

export const buildPdfDocxBlob = async (textByPage: string[]): Promise<Blob> => {
  const children: Paragraph[] = [];
  textByPage.forEach((pageText, index) => {
    children.push(new Paragraph({ text: `Page ${index + 1}`, heading: HeadingLevel.HEADING_3 }));
    const lines = pageText.split('\n').filter(Boolean);
    if (lines.length === 0) {
      children.push(new Paragraph('(no extractable text on this page)'));
    } else {
      lines.forEach((line) => children.push(new Paragraph(line)));
    }
  });
  const doc = new DocxDocument({ sections: [{ children }] });
  return Packer.toBlob(doc);
};

export const buildPdfXlsxBlob = (textByPage: string[]): Blob => {
  const aoa: string[][] = [['Page', 'Line', 'Text']];
  textByPage.forEach((pageText, pageIndex) => {
    const lines = pageText.split('\n').filter(Boolean);
    if (lines.length === 0) {
      aoa.push([`${pageIndex + 1}`, '', '(no extractable text)']);
    } else {
      lines.forEach((line, lineIndex) => aoa.push([`${pageIndex + 1}`, `${lineIndex + 1}`, line]));
    }
  });
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1');
  const arrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new Blob([arrayBuffer], { type: MIME_BY_FORMAT.xlsx });
};

// Kích thước layout mặc định (LAYOUT_16x9) của pptxgenjs, tính bằng inch -
// dùng để tính "contain" cho ảnh trang PDF sao cho không bị méo tỉ lệ.
const PPTX_SLIDE_WIDTH_IN = 10;
const PPTX_SLIDE_HEIGHT_IN = 5.63;

export const buildPdfPptxBlob = async (
  getPageImage: (pageNumber: number) => Promise<string>,
  pageCount: number
): Promise<Blob> => {
  const pagesToRender = Math.min(pageCount, MAX_PDF_PAGES_FOR_PPTX);
  const pptx = new pptxgen();

  for (let pageNumber = 1; pageNumber <= pagesToRender; pageNumber++) {
    const dataUrl = await getPageImage(pageNumber);
    const slide = pptx.addSlide();
    slide.addImage({
      data: dataUrl,
      x: 0,
      y: 0,
      w: PPTX_SLIDE_WIDTH_IN,
      h: PPTX_SLIDE_HEIGHT_IN,
      sizing: { type: 'contain', w: PPTX_SLIDE_WIDTH_IN, h: PPTX_SLIDE_HEIGHT_IN },
    });
  }

  const output = await pptx.write({ outputType: 'blob' });
  return output as Blob;
};
