import { Link } from 'react-router';

// Không tự đặt <title>/<meta> riêng ở đây - PageSeo (mounted 1 lần trong
// AppLayout) đã tự nhận diện route không nằm trong routeMeta và tự render
// title mặc định + noindex cho đúng trang này (xem src/seo/PageSeo.tsx).
const NotFound = () => (
  <div className="flex flex-col items-center gap-4 py-16 text-center">
    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
      404 — Page not found
    </h1>
    <p className="text-gray-500 dark:text-gray-400">
      The tool you&apos;re looking for doesn&apos;t exist or may have moved.
    </p>
    <Link to="/" className="text-blue-600 underline hover:text-blue-700">
      Back to JSON Formatter
    </Link>
  </div>
);

export default NotFound;
