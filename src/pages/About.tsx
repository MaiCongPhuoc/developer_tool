import { Link } from 'react-router';

const sectionHeadingClass =
  'text-base font-semibold text-gray-800 dark:text-white';
const paragraphClass = 'text-sm leading-relaxed text-gray-600 dark:text-gray-300';
const linkClass =
  'text-blue-600 underline hover:text-blue-700 dark:text-blue-400';

const toolGroups: { title: string; tools: { name: string; path: string }[] }[] =
  [
    {
      title: 'Formatters and validators',
      tools: [
        { name: 'JSON Formatter & Validator', path: '/' },
        { name: 'XML Formatter & Validator', path: '/xml' },
        { name: 'SQL Formatter', path: '/sql' },
        { name: 'Markdown Previewer', path: '/markdown-previewer' },
        { name: 'HTML Previewer', path: '/html-converter' },
      ],
    },
    {
      title: 'Security and identifiers',
      tools: [
        { name: 'JWT Encoder & Decoder', path: '/encryption' },
        { name: 'UUID Generator', path: '/uuid' },
        { name: 'Password Generator', path: '/password-generator' },
      ],
    },
    {
      title: 'Compare and test',
      tools: [
        { name: 'Text Compare', path: '/text-compare' },
        { name: 'File Compare', path: '/file-compare' },
        { name: 'Regex Tester', path: '/regex-tester' },
        { name: 'Dummy Text Generator', path: '/dummy-text' },
      ],
    },
    {
      title: 'Converters and media',
      tools: [
        { name: 'Unix Timestamp & Time Zone Converter', path: '/time-converter' },
        { name: 'Unit & Currency Converter', path: '/unit-converter' },
        { name: 'Color Picker', path: '/color-picker' },
        { name: 'QR Code Generator', path: '/qr-code' },
        { name: 'Image Compressor', path: '/image-compressor' },
        { name: 'Image Format Converter', path: '/image-format-converter' },
        { name: 'Document Format Converter', path: '/document-converter' },
      ],
    },
  ];

// Trang tĩnh giới thiệu site (cần cho người dùng và cho việc xét duyệt
// quảng cáo: ai làm ra site, mục đích, nội dung gì).
const About = () => (
  <div className="space-y-4">
    <h1 className="text-xl font-bold text-gray-800 dark:text-white sm:text-2xl">
      About Developer Tool
    </h1>

    <div className="space-y-6 rounded-xl border border-gray-200 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/60 sm:p-6">
      <section className="space-y-2">
        <h2 className={sectionHeadingClass}>What this site is</h2>
        <p className={paragraphClass}>
          Developer Tool is a collection of free online utilities for
          developers, designers and anyone who works with data and files:
          formatters for JSON, XML and SQL, a JWT decoder, generators for
          UUIDs, passwords and QR codes, a regex tester, converters for time,
          units, images and documents, and more. It is built and maintained by
          an independent developer based in Vietnam.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionHeadingClass}>Why it exists</h2>
        <p className={paragraphClass}>
          Small everyday jobs, such as pretty printing a response or checking
          what is inside a token, should not require installing software,
          creating an account or sending private data to a stranger&apos;s
          server. The goal is a fast, tidy set of tools that open instantly,
          work on a phone as well as a desktop and explain what they do.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionHeadingClass}>Principles</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-gray-600 marker:text-gray-400 dark:text-gray-300">
          <li>
            <strong>Your data stays with you.</strong> The tools run in your
            browser. Text you paste and files you open are processed on your
            device and are not uploaded to a server we operate. See the{' '}
            <Link to="/privacy-policy" className={linkClass}>
              Privacy Policy
            </Link>
            .
          </li>
          <li>
            <strong>Free and no sign-up.</strong> Every tool is available
            without registration.
          </li>
          <li>
            <strong>Explained, not just provided.</strong> Each tool has
            step-by-step instructions, an example, common mistakes and answers
            to frequent questions, and the{' '}
            <Link to="/guides" className={linkClass}>
              Guides
            </Link>{' '}
            section goes deeper into the concepts behind them.
          </li>
          <li>
            <strong>Honest limits.</strong> Where a tool has limits, such as
            approximate conversions or indicative currency rates, we say so on
            the page.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className={sectionHeadingClass}>The tools</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {toolGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {group.title}
              </h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600 marker:text-gray-400 dark:text-gray-300">
                {group.tools.map((tool) => (
                  <li key={tool.path}>
                    <Link to={tool.path} className={linkClass}>
                      {tool.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className={sectionHeadingClass}>How the content is written</h2>
        <p className={paragraphClass}>
          Tool pages and guides are written to be accurate and practical, and
          are checked against the relevant standards where they apply, for
          example the JSON, JWT, UUID and WCAG specifications. If you find a
          mistake or have a suggestion, please{' '}
          <Link to="/contact" className={linkClass}>
            let us know
          </Link>{' '}
          and we will correct it.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionHeadingClass}>How the site is funded</h2>
        <p className={paragraphClass}>
          Running the site costs time and hosting money. To cover this, the
          site may display advertising served by Google AdSense, placed away
          from the tools so it does not get in the way. Advertising does not
          change how the tools work or what happens to your data.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionHeadingClass}>Get in touch</h2>
        <p className={paragraphClass}>
          Questions, bug reports and ideas are welcome on the{' '}
          <Link to="/contact" className={linkClass}>
            Contact page
          </Link>
          .
        </p>
      </section>
    </div>
  </div>
);

export default About;
