import type { GuideFaq, GuideSection, GuideSource } from './types';

// Phần bổ sung cho 1 bài viết gốc: thêm mục, câu hỏi thường gặp, nguồn tham
// khảo. Gộp vào bài (theo slug) trong guides/index.ts.
export interface GuideExtra {
  sections?: GuideSection[];
  faq?: GuideFaq[];
  sources?: GuideSource[];
}
