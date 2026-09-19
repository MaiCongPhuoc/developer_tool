const sectionHeadingClass =
  'text-base font-semibold text-gray-800 dark:text-white';
const paragraphClass = 'text-sm leading-relaxed text-gray-600 dark:text-gray-300';
const linkClass = 'text-blue-600 underline hover:text-blue-700 dark:text-blue-400';

// Trang tĩnh, không có state - không cần Redux/reset-on-mount như các trang
// công cụ khác. Nội dung phản ánh đúng thực tế của app: mọi tool đều xử lý
// hoàn toàn trong trình duyệt, không upload file lên server nào, và tự thân
// site không dùng cookie/localStorage (chỉ Google AdSense mới dùng cookie
// của bên thứ ba, đã công bố rõ bên dưới).
const PrivacyPolicy = () => (
  <div className="space-y-4">
    <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
      Privacy Policy
    </h1>

    <div className="space-y-6 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
      <p className={paragraphClass}>
        Last updated: 2026. This page explains what happens to your data when
        you use Developer Tool.
      </p>

      <section className="space-y-2">
        <h2 className={sectionHeadingClass}>Your files and data stay on your device</h2>
        <p className={paragraphClass}>
          Every tool on this site (JSON/XML/SQL formatting, encryption, the
          Document Converter, Image Compressor, Image Format Converter, and
          all others) runs entirely in your browser using JavaScript. Files
          you upload or text you paste are processed locally on your device
          and are never sent to, or stored on, any server we operate.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionHeadingClass}>Cookies and local storage</h2>
        <p className={paragraphClass}>
          Developer Tool itself does not use cookies or browser local storage
          to track you or store your data. Preferences like dark mode are
          kept only in memory for your current visit.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionHeadingClass}>Advertising (Google AdSense)</h2>
        <p className={paragraphClass}>
          This site may display ads served by Google AdSense. Google and its
          advertising partners may use cookies and similar technologies to
          serve ads based on your prior visits to this or other websites. You
          can learn more about how Google uses information from sites that
          use its services, and adjust your ad personalization settings, at{' '}
          <a
            className={linkClass}
            href="https://policies.google.com/technologies/partner-sites"
            target="_blank"
            rel="noreferrer"
          >
            policies.google.com/technologies/partner-sites
          </a>{' '}
          and{' '}
          <a
            className={linkClass}
            href="https://adssettings.google.com"
            target="_blank"
            rel="noreferrer"
          >
            adssettings.google.com
          </a>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionHeadingClass}>Contact</h2>
        <p className={paragraphClass}>
          Questions about this policy or the site can be sent using the
          feedback button in the bottom-right corner of the page, or by email
          at{' '}
          <a className={linkClass} href="mailto:maiphuoc244@gmail.com">
            maiphuoc244@gmail.com
          </a>
          .
        </p>
      </section>
    </div>
  </div>
);

export default PrivacyPolicy;
