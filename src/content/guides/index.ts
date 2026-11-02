import type { Guide } from './types';
import type { GuideExtra } from './extraTypes';
import { dataFormatGuides } from './dataFormats';
import { webSecurityGuides } from './webSecurity';
import { webBasicsGuides } from './webBasics';
import { mediaGuides } from './media';
import { extrasA } from './extrasA';
import { extrasB } from './extrasB';
import { newGuidesA } from './newGuidesA';
import { newGuidesB } from './newGuidesB';

export type { Guide, GuideSection } from './types';
export { GUIDES_PUBLISHED, GUIDES_UPDATED } from './types';
export type { GuideFaq, GuideSource } from './types';

const extras: Record<string, GuideExtra> = { ...extrasA, ...extrasB };

// Gộp phần bổ sung (mục thêm, FAQ, nguồn tham khảo) vào bài gốc theo slug.
const withExtras = (guide: Guide): Guide => {
  const extra = extras[guide.slug];
  if (!extra) return guide;
  return {
    ...guide,
    sections: [...guide.sections, ...(extra.sections ?? [])],
    faq: extra.faq,
    sources: extra.sources,
  };
};

// Thứ tự hiển thị ở trang /guides.
export const guides: Guide[] = [
  ...dataFormatGuides,
  ...webSecurityGuides,
  ...webBasicsGuides,
  ...mediaGuides,
].map(withExtras).concat(newGuidesA, newGuidesB);

export const getGuide = (slug: string): Guide | undefined =>
  guides.find((g) => g.slug === slug);

// Các bài viết gắn với 1 công cụ (khớp theo đường dẫn công cụ), dùng để gợi ý
// "Read more" ở cuối khung hướng dẫn của trang công cụ đó.
export const getGuidesForTool = (toolPath: string): Guide[] =>
  guides.filter((g) => g.tool.path === toolPath);
