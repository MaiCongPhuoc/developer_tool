import type { Guide } from './types';
import { dataFormatGuides } from './dataFormats';
import { webSecurityGuides } from './webSecurity';
import { webBasicsGuides } from './webBasics';
import { mediaGuides } from './media';

export type { Guide, GuideSection } from './types';
export { GUIDES_PUBLISHED } from './types';

// Thứ tự hiển thị ở trang /guides.
export const guides: Guide[] = [
  ...dataFormatGuides,
  ...webSecurityGuides,
  ...webBasicsGuides,
  ...mediaGuides,
];

export const getGuide = (slug: string): Guide | undefined =>
  guides.find((g) => g.slug === slug);

// Các bài viết gắn với 1 công cụ (khớp theo đường dẫn công cụ), dùng để gợi ý
// "Read more" ở cuối khung hướng dẫn của trang công cụ đó.
export const getGuidesForTool = (toolPath: string): Guide[] =>
  guides.filter((g) => g.tool.path === toolPath);
