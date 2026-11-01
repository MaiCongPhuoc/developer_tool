import { Link } from 'react-router';
import { guides } from '@/content/guides';

// Trang danh sách bài viết hướng dẫn. Dữ liệu lấy từ content/guides.
const Guides = () => (
  <div className="space-y-4">
    <h1 className="text-xl font-bold text-gray-800 dark:text-white sm:text-2xl">
      Guides
    </h1>

    <div className="space-y-6 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
        In-depth articles that explain the ideas behind the tools: how formats
        such as JSON and XML differ, how JWTs and UUIDs work, how to write
        better regular expressions and SQL, how to compress images, build QR
        codes that scan and choose strong passwords. Each guide has a link to
        the matching tool so you can try what you have just read.
      </p>

      <ul className="grid gap-4 md:grid-cols-2">
        {guides.map((guide) => (
          <li
            key={guide.slug}
            className="flex flex-col gap-2 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
          >
            <h2 className="text-base font-semibold text-gray-800 dark:text-white">
              <Link
                to={`/guides/${guide.slug}`}
                className="hover:text-blue-600 hover:underline dark:hover:text-blue-400"
              >
                {guide.title}
              </Link>
            </h2>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {guide.description}
            </p>
            <p className="mt-auto text-xs text-gray-500 dark:text-gray-400">
              {guide.readingMinutes} min read · Tool: {guide.tool.label}
            </p>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

export default Guides;
