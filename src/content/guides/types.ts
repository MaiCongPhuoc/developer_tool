// Kiểu dữ liệu cho mục "Guides" (bài viết hướng dẫn chuyên sâu). Dữ liệu thuần
// (không import React) để src/seo/routeMeta.ts đọc được lúc prerender.

export interface GuideSection {
  heading: string;
  paragraphs?: string[];
  // Danh sách gạch đầu dòng.
  list?: string[];
  // Danh sách đánh số.
  orderedList?: string[];
  // Khối mã / ví dụ gõ nguyên văn.
  code?: { label?: string; text: string };
}

export interface Guide {
  // Đường dẫn: /guides/<slug>
  slug: string;
  title: string;
  // 1-2 câu, dùng làm meta description.
  description: string;
  readingMinutes: number;
  // Công cụ liên quan trên site (hiện nút mở công cụ ở cuối bài).
  tool: { path: string; label: string };
  intro: string;
  sections: GuideSection[];
  // Tóm tắt tiếng Việt (nội dung thật, hiển thị công khai).
  vi: { title: string; summary: string[] };
}

export const GUIDES_PUBLISHED = '2026-11-01';
