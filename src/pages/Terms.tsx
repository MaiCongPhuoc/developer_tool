import { Link } from 'react-router';

const sectionHeadingClass =
  'text-base font-semibold text-gray-800 dark:text-white';
const paragraphClass = 'text-sm leading-relaxed text-gray-600 dark:text-gray-300';
const linkClass =
  'text-blue-600 underline hover:text-blue-700 dark:text-blue-400';

// Điều khoản sử dụng của website công cụ này (KHÔNG phải của dự án VietLocal).
const Terms = () => (
  <div className="space-y-4">
    <h1 className="text-xl font-bold text-gray-800 dark:text-white sm:text-2xl">
      Terms of Use
    </h1>

    <div className="space-y-6 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
      <p className={paragraphClass}>
        Last updated: November 2026. By using Developer Tool you agree to
        these terms. If you do not agree, please do not use the site.
      </p>

      <section className="space-y-2">
        <h2 className={sectionHeadingClass}>1. The service</h2>
        <p className={paragraphClass}>
          Developer Tool provides free online utilities and educational
          articles. The tools run in your browser. We may add, change or
          remove tools and content at any time.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionHeadingClass}>2. Your content and data</h2>
        <p className={paragraphClass}>
          Text, files and other data you enter into a tool are processed on
          your device and are not uploaded to a server we operate. You remain
          responsible for the data you process and for having the right to
          use it. See the{' '}
          <Link to="/privacy-policy" className={linkClass}>
            Privacy Policy
          </Link>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionHeadingClass}>3. Acceptable use</h2>
        <p className={paragraphClass}>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-gray-600 marker:text-gray-400 dark:text-gray-300">
          <li>use the site for any unlawful purpose;</li>
          <li>
            attempt to disrupt, overload or gain unauthorised access to the
            site or its infrastructure;
          </li>
          <li>
            use automated means to copy the site&apos;s content in bulk or to
            place excessive load on it;
          </li>
          <li>
            use the tools to process data that you are not allowed to process.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className={sectionHeadingClass}>4. No warranty</h2>
        <p className={paragraphClass}>
          The tools and articles are provided &quot;as is&quot;, without
          warranty of any kind. We work to make them accurate, but results
          can contain errors. In particular, currency rates are indicative,
          file conversions may not reproduce every detail of the original,
          and generated passwords, tokens and other values should be checked
          before you rely on them. Always keep a copy of your original data.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionHeadingClass}>5. Limitation of liability</h2>
        <p className={paragraphClass}>
          To the extent permitted by law, we are not liable for any loss or
          damage arising from your use of, or inability to use, the site or
          its tools, including loss of data or profit.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionHeadingClass}>6. Intellectual property</h2>
        <p className={paragraphClass}>
          The design, text and code of the site belong to its owner, except
          for open-source components used under their own licences. You may
          link to any page. Please do not republish our articles in full
          without permission.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionHeadingClass}>7. Advertising and links</h2>
        <p className={paragraphClass}>
          The site may show advertising served by Google AdSense and may link
          to third-party websites. We do not control those sites and are not
          responsible for their content or practices.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionHeadingClass}>8. Changes to these terms</h2>
        <p className={paragraphClass}>
          We may update these terms from time to time. The date at the top of
          the page shows when they were last changed. Continuing to use the
          site after a change means you accept the updated terms.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionHeadingClass}>9. Governing law</h2>
        <p className={paragraphClass}>
          These terms are governed by the laws of Vietnam.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionHeadingClass}>10. Contact</h2>
        <p className={paragraphClass}>
          Questions about these terms can be sent through the{' '}
          <Link to="/contact" className={linkClass}>
            Contact page
          </Link>
          .
        </p>
      </section>
    </div>
  </div>
);

export default Terms;
