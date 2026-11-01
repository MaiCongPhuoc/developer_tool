import { Link } from 'react-router';

const sectionHeadingClass =
  'text-base font-semibold text-gray-800 dark:text-white';
const paragraphClass = 'text-sm leading-relaxed text-gray-600 dark:text-gray-300';
const linkClass =
  'text-blue-600 underline hover:text-blue-700 dark:text-blue-400';

// Trang liên hệ. Nút chat nổi (ContactWidget) vẫn có ở mọi trang; trang này
// cho người dùng và người xét duyệt một địa chỉ liên hệ rõ ràng.
const Contact = () => (
  <div className="space-y-4">
    <h1 className="text-xl font-bold text-gray-800 dark:text-white sm:text-2xl">
      Contact
    </h1>

    <div className="space-y-6 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
      <section className="space-y-2">
        <h2 className={sectionHeadingClass}>Send us a message</h2>
        <p className={paragraphClass}>
          We read every message about the tools, the guides and the site.
          There are two ways to reach us:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-gray-600 marker:text-gray-400 dark:text-gray-300">
          <li>
            Use the feedback button in the bottom-right corner of any page.
          </li>
          <li>
            Email{' '}
            <a className={linkClass} href="mailto:maiphuoc244@gmail.com">
              maiphuoc244@gmail.com
            </a>
            . We aim to reply within a few business days.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className={sectionHeadingClass}>Reporting a problem</h2>
        <p className={paragraphClass}>
          A good bug report helps us fix things quickly. Please include:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-gray-600 marker:text-gray-400 dark:text-gray-300">
          <li>The tool and the page address where the problem happened.</li>
          <li>What you did, what you expected and what actually happened.</li>
          <li>
            Your browser and device, for example Chrome on Windows or Safari
            on iPhone.
          </li>
          <li>
            A short example of the input if it is not private. Please do not
            send passwords, tokens or personal data.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className={sectionHeadingClass}>Corrections and suggestions</h2>
        <p className={paragraphClass}>
          If you spot a factual error in a guide, a tool that gives a wrong
          result or an idea for a new tool, tell us. Corrections are reviewed
          and published as soon as they are verified.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionHeadingClass}>Privacy</h2>
        <p className={paragraphClass}>
          Messages you send are used only to reply to you and to improve the
          site. See the{' '}
          <Link to="/privacy-policy" className={linkClass}>
            Privacy Policy
          </Link>{' '}
          for details.
        </p>
      </section>
    </div>
  </div>
);

export default Contact;
