import { Link, useParams } from 'react-router';
import { GUIDES_PUBLISHED, getGuide, guides } from '@/content/guides';
import NotFound from './NotFound';

const paragraphClass =
  'text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base';
const listClass =
  'space-y-2 pl-5 text-sm leading-relaxed text-gray-600 marker:text-gray-400 dark:text-gray-300 sm:text-base';

// id cho thẻ h2 để mục lục "In this guide" nhảy tới đúng phần.
const toId = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

// 1 bài viết hướng dẫn. Slug không có trong dữ liệu -> hiện trang 404 (PageSeo
// tự đặt noindex vì đường dẫn không nằm trong routeMeta).
const GuideArticle = () => {
  const { slug = '' } = useParams();
  const guide = getGuide(slug);

  if (!guide) return <NotFound />;

  const others = guides.filter((g) => g.slug !== guide.slug).slice(0, 4);

  return (
    <article className="space-y-4">
      <nav className="text-xs text-gray-500 dark:text-gray-400">
        <Link to="/guides" className="hover:underline">
          Guides
        </Link>{' '}
        / <span>{guide.title}</span>
      </nav>

      <h1 className="text-xl font-bold text-gray-800 dark:text-white sm:text-2xl">
        {guide.title}
      </h1>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {guide.readingMinutes} min read · Published{' '}
        {formatDate(GUIDES_PUBLISHED)}
      </p>

      <div className="space-y-6 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
        <p className={paragraphClass}>{guide.intro}</p>

        <div className="space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-900/60">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            In this guide
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
            {guide.sections.map((section) => (
              <li key={section.heading}>
                <a
                  href={`#${toId(section.heading)}`}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </div>

        {guide.sections.map((section) => (
          <section key={section.heading} className="space-y-3">
            <h2
              id={toId(section.heading)}
              className="scroll-mt-24 text-lg font-semibold text-gray-800 dark:text-white"
            >
              {section.heading}
            </h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className={paragraphClass}>
                {paragraph}
              </p>
            ))}
            {section.list && (
              <ul className={`list-disc ${listClass}`}>
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {section.orderedList && (
              <ol className={`list-decimal ${listClass}`}>
                {section.orderedList.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            )}
            {section.code && (
              <div className="space-y-1">
                {section.code.label && (
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {section.code.label}
                  </p>
                )}
                <pre className="overflow-x-auto rounded-lg bg-gray-100 p-3 text-xs leading-relaxed text-gray-800 dark:bg-gray-900 dark:text-gray-200 sm:text-sm">
                  <code>{section.code.text}</code>
                </pre>
              </div>
            )}
          </section>
        ))}

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40">
          <p className="text-sm text-gray-700 dark:text-gray-200">
            Try it yourself:{' '}
            <Link
              to={guide.tool.path}
              className="font-semibold text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
            >
              {guide.tool.label}
            </Link>{' '}
            runs in your browser, free and with no sign-up.
          </p>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-gray-800 dark:text-white">
          More guides
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600 marker:text-gray-400 dark:text-gray-300">
          {others.map((other) => (
            <li key={other.slug}>
              <Link
                to={`/guides/${other.slug}`}
                className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
              >
                {other.title}
              </Link>
            </li>
          ))}
          <li>
            <Link
              to="/guides"
              className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
            >
              See all guides
            </Link>
          </li>
        </ul>
      </section>
    </article>
  );
};

export default GuideArticle;
