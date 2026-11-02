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

// Nguồn tham khảo (tài liệu gốc: RFC, W3C, NIST, MDN...) - hiện ở cuối bài.
export interface GuideSource {
  label: string;
  url: string;
}

export interface GuideFaq {
  question: string;
  answer: string;
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
  faq?: GuideFaq[];
  sources?: GuideSource[];
}

// Ngày đăng đầu tiên của mục Guides và ngày cập nhật gần nhất (dùng cho
// JSON-LD Article và dòng "Published / Updated" ở đầu bài).
export const GUIDES_PUBLISHED = '2026-11-01';
export const GUIDES_UPDATED = '2026-11-02';
