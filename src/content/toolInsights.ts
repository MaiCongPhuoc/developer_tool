// Phần nội dung chuyên sâu của từng trang công cụ (ngoài "How to use" và FAQ).
// Khóa là đường dẫn trang (khớp routeMeta.ts). ToolGuide.tsx tự đọc theo
// pathname nên không phải sửa từng trang công cụ. Dữ liệu thuần, không import
// React. Nội dung phải đúng với cách công cụ thật sự hoạt động và không nhồi
// từ khóa - viết cho người đọc.

export interface ToolInsight {
  // 1-2 đoạn nền tảng: khái niệm đằng sau công cụ.
  background: string[];
  // Khi nào nên dùng.
  useCases: string[];
  // Một ví dụ cụ thể (đầu vào -> kết quả điển hình).
  example?: { title: string; input: string; output: string };
  // Lỗi hay gặp / lưu ý.
  mistakes: string[];
  // Slug các bài trong /guides nên đọc thêm.
  relatedGuides: string[];
}

export const toolInsights: Record<string, ToolInsight> = {
  '/': {
    background: [
      `JSON (JavaScript Object Notation) is a text format for structured data. It is defined by RFC 8259 and is language independent: although it grew out of JavaScript object syntax, nearly every programming language can read and write it. A JSON value is an object (curly braces with key and value pairs), an array (square brackets), a string, a number, true, false or null.`,
      `A formatter changes only the whitespace: it never changes the data. A minified response such as {"a":1,"b":[2,3]} and its indented version contain exactly the same information, but the second one is something a person can read and review.`,
    ],
    useCases: [
      `Reading an API response that arrives on a single line.`,
      `Finding the missing comma or quote that makes a parser fail.`,
      `Checking a configuration file before you commit or deploy it.`,
      `Editing one value in a large document through a tree view instead of searching in text.`,
    ],
    example: {
      title: `Minified input and formatted output (2-space indentation)`,
      input: `{"user":{"id":1,"tags":["a","b"]},"active":true}`,
      output: `{
  "user": {
    "id": 1,
    "tags": [
      "a",
      "b"
    ]
  },
  "active": true
}`,
    },
    mistakes: [
      `Trailing commas, single quotes and comments are not valid JSON, even though many programming languages accept them.`,
      `Very large integers (above 9007199254740991) may be rounded by programs that use ordinary JavaScript numbers. If exact digits matter, keep such IDs as strings.`,
      `Do not treat a valid document as a correct one. Syntax checking confirms the structure is well formed, not that the values make sense for your application.`,
    ],
    relatedGuides: ['fix-common-json-errors', 'json-vs-xml'],
  },
  '/xml': {
    background: [
      `XML (Extensible Markup Language) describes data with nested tags. A document is well formed when it has a single root element, every opening tag has a matching closing tag, tags are nested correctly, attribute values are quoted and the names match exactly (XML is case sensitive).`,
      `Five characters have a special meaning in text and must be escaped: & as &amp;, < as &lt;, > as &gt;, a double quote as &quot; and an apostrophe as &apos;. Forgetting to escape an ampersand is one of the most common reasons a document fails to parse.`,
    ],
    useCases: [
      `Inspecting an XML feed, SOAP message or configuration file that arrives as one long line.`,
      `Checking that a document is well formed before you send it to another system.`,
      `Editing an attribute or value in a tree view without searching through raw text.`,
    ],
    example: {
      title: `Compact input and indented output`,
      input: `<note><to>Lan</to><body>Meet at 9</body></note>`,
      output: `<note>
  <to>Lan</to>
  <body>Meet at 9</body>
</note>`,
    },
    mistakes: [
      `More than one root element. A document needs exactly one.`,
      `Unclosed or mismatched tags, including differences in letter case (<Name> is not closed by </name>).`,
      `An unescaped & or < inside text, such as in a URL with several query parameters.`,
      `Well formed does not mean valid. Checking a document against a schema (XSD) is a separate step.`,
    ],
    relatedGuides: ['json-vs-xml'],
  },
  '/sql': {
    background: [
      `SQL formatting changes layout and keyword case only. It never changes what a query returns or how fast it runs, but a readable layout makes mistakes much easier to spot during review.`,
      `Dialects differ in small ways, such as how identifiers are quoted (backticks in MySQL, double quotes in PostgreSQL, square brackets in SQL Server). A formatter should keep those quoting styles and your string literals unchanged.`,
    ],
    useCases: [
      `Cleaning up a query copied from a log or an ORM where it appears on one line.`,
      `Making a long report query reviewable in a pull request.`,
      `Teaching or learning SQL, where structure is clearer on separate lines.`,
    ],
    example: {
      title: `Typical result`,
      input: `select id,name from users where active=1 order by name`,
      output: `SELECT id, name
FROM users
WHERE active = 1
ORDER BY name`,
    },
    mistakes: [
      `Expecting formatting to optimise the query. It does not. Use the database's query plan for performance.`,
      `Formatting statements that contain vendor-specific syntax may produce slightly different layouts. Read the result before you commit it.`,
      `Being inconsistent with teammates. Agree on a style and use the same formatter for everyone.`,
    ],
    relatedGuides: ['readable-sql-formatting'],
  },
  '/encryption': {
    background: [
      `A JSON Web Token has three Base64URL-encoded parts: a header, a payload of claims and a signature. The first two are readable by anyone, so a JWT is signed, not hidden. The signature proves that the header and payload were not changed after they were issued by someone who knows the key.`,
      `The signing algorithms HS256, HS384 and HS512 use HMAC with SHA-256, SHA-384 and SHA-512 and one shared secret. The time claims exp, nbf and iat are Unix timestamps in seconds.`,
    ],
    useCases: [
      `Debugging a login problem by reading the claims in a token.`,
      `Checking whether a token has expired and when.`,
      `Creating a test token with chosen claims for an API you are building.`,
    ],
    example: {
      title: `Claims in a decoded payload`,
      input: `eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMiLCJleHAiOjE3MDAwMDM2MDB9.<signature>`,
      output: `Header:  { "alg": "HS256" }
Payload: { "sub": "123", "exp": 1700003600 }
exp 1700003600 = 2023-11-14 23:13:20 UTC`,
    },
    mistakes: [
      `Assuming a decoded token is a valid one. Only signature verification with the correct key proves it.`,
      `Putting sensitive data in the payload. Anyone holding the token can read it.`,
      `Using a short or guessable secret for HS256. Use at least 32 random bytes.`,
      `Forgetting that exp is in seconds. A value in milliseconds looks like a date far in the future.`,
    ],
    relatedGuides: ['jwt-explained', 'unix-timestamp-explained'],
  },
  '/dummy-text': {
    background: [
      `Lorem ipsum is placeholder text derived from a passage of Cicero's De finibus bonorum et malorum, written in 45 BC and scrambled so that it does not distract from the layout. Designers use it because it has a natural mix of word and sentence lengths without carrying any meaning.`,
      `The point of dummy text is to test how a design behaves with real amounts of text. Text of an exact character count is useful for checking limits such as a title field, an SMS, a meta description or a database column.`,
    ],
    useCases: [
      `Filling a mockup so that a layout looks realistic.`,
      `Testing the maximum length of an input, a card title or a database field.`,
      `Creating long text to check scrolling, truncation and performance.`,
    ],
    example: {
      title: `Typical start of generated text`,
      input: `Length: 123 characters`,
      output: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
    },
    mistakes: [
      `Shipping placeholder text to production by accident. Search for it before release.`,
      `Testing only with Latin letters. Names and text with accents (for example Vietnamese), long words or right-to-left scripts can break layouts that look fine with lorem ipsum.`,
      `Using text that is much shorter than the real content, which hides overflow problems.`,
    ],
    relatedGuides: [],
  },
  '/text-compare': {
    background: [
      `A diff finds the shortest set of additions and deletions that turn one text into another. Most tools do this by finding the longest sequence of lines that both texts share and reporting everything else as a change.`,
      `Showing differences inside a line (word level) is easier to read for prose, while the line view is more usual for code.`,
    ],
    useCases: [
      `Seeing what changed between two drafts of a document or contract.`,
      `Checking that a copy and paste or a conversion did not alter the text.`,
      `Comparing two versions of a configuration, an SQL script or a log excerpt.`,
    ],
    example: {
      title: `A one-line change`,
      input: `Left:   The meeting starts at 9:00.
Right:  The meeting starts at 9:30.`,
      output: `The meeting starts at 9:00.   (removed)
The meeting starts at 9:30.   (added)
Changed part: 0 -> 30`,
    },
    mistakes: [
      `Whole-file differences caused by different line endings (CRLF versus LF) or trailing spaces. Normalise both texts first.`,
      `Comparing structured data with a different order of keys. Sort or format JSON before you compare it.`,
      `Reading only the added lines. A changed line appears as one removal and one addition, so read them together.`,
    ],
    relatedGuides: ['how-text-diff-works'],
  },
  '/file-compare': {
    background: [
      `Comparing files works like comparing text: the contents are read as text and aligned line by line. It is useful for any plain text format, including source code, JSON, CSV, XML, logs and configuration files.`,
      `Because files are read in your browser, you can compare private documents without uploading them anywhere.`,
    ],
    useCases: [
      `Comparing a deployed configuration file with the one in your repository.`,
      `Checking two exports (for example CSV files) for rows that were added or changed.`,
      `Reviewing the difference between two versions of a script.`,
    ],
    mistakes: [
      `Comparing binary files such as images or PDFs. They are not meaningful as text. Use a tool made for that file type.`,
      `Differences in file encoding (for example UTF-8 versus an older encoding) can make accented characters look changed.`,
      `Very large files can be slow in a browser. Compare only the relevant section when possible.`,
    ],
    relatedGuides: ['how-text-diff-works'],
  },
  '/uuid': {
    background: [
      `A UUID is a 128-bit identifier written as 32 hexadecimal digits in the pattern 8-4-4-4-12. Version 4 UUIDs are random apart from six bits that mark the version and variant, which leaves 122 random bits.`,
      `Because of those random bits, you can create UUIDs on many machines at the same time with no central coordination and still be practically certain that they will not collide.`,
    ],
    useCases: [
      `Creating test data and sample records.`,
      `Generating identifiers for database rows, files or requests.`,
      `Producing GUIDs in the format a Microsoft tool expects (uppercase, in braces).`,
    ],
    example: {
      title: `A version 4 UUID in the common lowercase format`,
      input: `Quantity: 1`,
      output: `3f2504e0-4f89-41d3-9a0c-0305e82c3301
(the "4" at the start of the third group marks version 4)`,
    },
    mistakes: [
      `Using a UUID as a password or secret. It is an identifier, not a secret.`,
      `Storing a UUID primary key as a 36-character string when your database has a compact UUID or 16-byte binary type.`,
      `Assuming that random UUIDs sort by creation time. They do not. Version 7 does.`,
    ],
    relatedGuides: ['uuid-versions-explained'],
  },
  '/password-generator': {
    background: [
      `Password strength is measured in bits of entropy. For a password built from randomly chosen characters, entropy is length multiplied by log2 of the number of possible characters. A random 16-character password using upper and lowercase letters, digits and symbols has about 105 bits of entropy, while 8 lowercase letters have only about 38.`,
      `The generator uses the browser's cryptographically secure random source, so each character is chosen independently and without a predictable pattern.`,
    ],
    useCases: [
      `Creating a unique password for each new online account.`,
      `Generating a Wi-Fi key, an API secret or a database password.`,
      `Making a long random string where a site allows only some character types.`,
    ],
    example: {
      title: `Settings and typical result`,
      input: `Length 16, upper and lowercase, digits, symbols`,
      output: `k#8Vq!2mZr@5xTd9   (about 105 bits of entropy)`,
    },
    mistakes: [
      `Reusing a generated password on several sites. Use a unique one for each.`,
      `Shortening a password because it is hard to remember. Store it in a password manager instead.`,
      `Choosing a length that is too short. Prefer 16 characters or more whenever the site allows.`,
      `Forgetting a second factor. Turn on two-factor authentication for important accounts.`,
    ],
    relatedGuides: ['strong-password-guide'],
  },
  '/qr-code': {
    background: [
      `A QR code stores text as a grid of dark and light squares called modules. Built-in error correction means that part of the code can be damaged or covered and it will still scan. Higher error correction levels survive more damage but need a denser code.`,
      `The more characters you encode, the denser the code, and dense codes need a larger print size or a better camera to scan.`,
    ],
    useCases: [
      `Linking printed material, posters or packaging to a web page.`,
      `Sharing a Wi-Fi login, a phone number or an email address.`,
      `Adding a link to a business card or a menu.`,
    ],
    example: {
      title: `Encoding a Wi-Fi network`,
      input: `WIFI:T:WPA;S:HomeNetwork;P:my-secret-key;;`,
      output: `A QR code that lets a phone join the network "HomeNetwork" after one scan.`,
    },
    mistakes: [
      `Printing the code too small or with no empty margin around it.`,
      `Using low contrast, for example light gray on white, or inverting the colors.`,
      `Encoding a very long link. Shorten it first.`,
      `Not testing the code on more than one phone before printing many copies.`,
    ],
    relatedGuides: ['qr-code-best-practices'],
  },
  '/time-converter': {
    background: [
      `A Unix timestamp is the number of seconds since 00:00:00 UTC on 1 January 1970. It identifies one exact moment independent of the time zone, so it is a common way for systems to exchange times.`,
      `Some systems count seconds (10 digits today) and others milliseconds (13 digits). Converting a value with the wrong unit gives a date in 1970 or one very far in the future.`,
    ],
    useCases: [
      `Reading a timestamp from a log, a database or a JWT claim as a human date.`,
      `Finding out what time an event happened in another time zone.`,
      `Getting the current timestamp for a test or a script.`,
    ],
    example: {
      title: `A timestamp in seconds`,
      input: `1700000000`,
      output: `2023-11-14T22:13:20Z (UTC)
2023-11-15 05:13:20 in Vietnam (UTC+7)`,
    },
    mistakes: [
      `Mixing up seconds and milliseconds, a difference of a factor of 1,000.`,
      `Parsing a date text without a time zone, which different systems read in different ways.`,
      `Using a fixed offset instead of a named time zone in places that observe daylight saving time.`,
    ],
    relatedGuides: ['unix-timestamp-explained'],
  },
  '/regex-tester': {
    background: [
      `A regular expression describes a pattern of text. The tester runs your pattern with the JavaScript regex engine, highlights every match and shows what each capturing group matched, so you can adjust it until it behaves as intended.`,
      `Flags change how a pattern is applied: g finds every match, i ignores case, m makes ^ and $ work per line, s lets the dot match line breaks and u enables full Unicode matching.`,
    ],
    useCases: [
      `Building a pattern to validate or extract text such as dates, codes or identifiers.`,
      `Debugging why a pattern matches too much or too little.`,
      `Learning regex by seeing each match highlighted live.`,
    ],
    example: {
      title: `Extracting parts of a date`,
      input: `Pattern: (\\d{4})-(\\d{2})-(\\d{2})
Text:    Released on 2026-11-01.`,
      output: `Match:   2026-11-01
Group 1: 2026   Group 2: 11   Group 3: 01`,
    },
    mistakes: [
      `Forgetting the g flag and getting only the first match.`,
      `Using . to mean a dot. A dot matches any character, so escape it as \\. for a literal dot.`,
      `Greedy quantifiers that match too much, such as .* between two tags. Use the lazy form .*? instead.`,
      `Nested quantifiers such as (a+)+ that can cause catastrophic slowdowns on some input.`,
    ],
    relatedGuides: ['regex-cheat-sheet'],
  },
  '/unit-converter': {
    background: [
      `Units look simple but hide a few traps. Computer storage uses two systems: decimal prefixes (1 KB = 1,000 bytes, 1 GB = 1,000,000,000 bytes) and binary prefixes (1 KiB = 1,024 bytes, 1 GiB = 1,073,741,824 bytes). Many operating systems show binary sizes with decimal labels, which is why a "500 GB" drive shows less space.`,
      `Web developers often convert between pixels and rem. With the default root size of 16 px, 1 rem equals 16 px. Number bases are also common: the binary number 1010 equals 10 in decimal and A in hexadecimal.`,
    ],
    useCases: [
      `Converting font sizes (px to rem) and colors (HEX to RGB) while styling a page.`,
      `Translating between binary, decimal and hexadecimal numbers.`,
      `Quick length, weight, storage and temperature conversions, and checking the rough value of a currency.`,
    ],
    example: {
      title: `Quick conversions`,
      input: `24 px at a 16 px base,  100 °C,  binary 1010`,
      output: `24 px = 1.5 rem,  100 °C = 212 °F,  1010 (binary) = 10 (decimal)`,
    },
    mistakes: [
      `Treating displayed currency rates as exact. Live rates change constantly and are only indicative. Banks and payment services use their own rates and fees.`,
      `Using the wrong base font size for px to rem. Check what your root font size really is.`,
      `Confusing KB with KiB, or bits with bytes (a byte is 8 bits, and network speeds are quoted in bits).`,
    ],
    relatedGuides: ['css-units-px-rem-em', 'color-formats-hex-rgb-hsl'],
  },
  '/color-picker': {
    background: [
      `Colors on screen are mixed from red, green and blue light. HEX, RGB and HSL are three ways to write the same color. HEX and RGB hold the same three channel values, and HSL describes the color as hue, saturation and lightness, which is easier to adjust by hand.`,
      `An eyedropper reads the color of one pixel from an image. Because of lighting and compression, nearby pixels differ slightly, so check a flat area of the image.`,
    ],
    useCases: [
      `Getting the exact color of a logo or a design from a screenshot.`,
      `Converting a color between HEX, RGB and HSL for a style sheet.`,
      `Choosing a lighter or darker variation of a brand color.`,
    ],
    example: {
      title: `The same color in three formats`,
      input: `#FF5733`,
      output: `rgb(255 87 51)
hsl(11 100% 60%)`,
    },
    mistakes: [
      `Sampling a pixel on a gradient or an edge, which gives a color between two others.`,
      `Ignoring contrast. Check text and background pairs against the WCAG ratio of 4.5:1 for normal text.`,
      `Expecting a color to look identical on every screen or in print.`,
    ],
    relatedGuides: ['color-formats-hex-rgb-hsl'],
  },
  '/markdown-previewer': {
    background: [
      `Markdown is plain text with light formatting symbols. A renderer converts it to HTML: headings, emphasis, lists, links, code blocks and tables. The previewer shows the rendered result as you type so you can see how it will look before you publish.`,
      `This previewer supports GitHub-style extensions: tables, task lists, strikethrough, syntax-highlighted code blocks and Mermaid diagrams.`,
    ],
    useCases: [
      `Drafting a README, documentation page or blog post.`,
      `Checking a table or a task list before pasting it into an issue or a pull request.`,
      `Sketching a flowchart or sequence diagram with Mermaid.`,
    ],
    example: {
      title: `Markdown and what it shows`,
      input: `## Shopping list
- [x] Milk
- [ ] Bread
**Total:** 2 items`,
      output: `A level-two heading, a checked and an unchecked box, and a bold "Total".`,
    },
    mistakes: [
      `Missing a blank line before a list, table or code block, so it does not render.`,
      `Forgetting the header separator row (|---|---|) in a table.`,
      `Assuming every platform renders Markdown the same way. Preview in the tool where you will publish.`,
    ],
    relatedGuides: ['markdown-cheat-sheet'],
  },
  '/html-converter': {
    background: [
      `The HTML previewer shows the result of HTML, CSS and JavaScript as you write them. The preview runs in a sandboxed frame, an isolated area that cannot reach the rest of the page around it, so you can experiment safely.`,
      `It is a quick way to test a snippet without creating a file or a project. Server-side code, such as PHP or database queries, cannot run in a browser preview.`,
    ],
    useCases: [
      `Trying a CSS layout idea, such as a flexbox or grid arrangement.`,
      `Testing a small JavaScript function against a simple page.`,
      `Checking how an HTML snippet or an email template looks.`,
    ],
    example: {
      title: `A small snippet`,
      input: `<button onclick="this.textContent='Clicked!'">Click me</button>`,
      output: `A button that changes its label to "Clicked!" when pressed.`,
    },
    mistakes: [
      `Relying on files that exist only on your computer, such as relative image paths. They will not load in the preview.`,
      `Forgetting the document type declaration and the viewport settings when you test a full page.`,
      `Copying code that uses external services without checking what it loads.`,
    ],
    relatedGuides: [],
  },
  '/image-compressor': {
    background: [
      `Compression reduces file size by storing an image more efficiently. Lossy compression (JPG and lossy WebP) removes detail the eye is unlikely to see and can shrink a photo greatly, while lossless compression keeps every pixel but saves less.`,
      `The two settings that matter most are the pixel dimensions and the quality level. Reducing the dimensions to the size the image is displayed at often saves more than any quality setting.`,
    ],
    useCases: [
      `Making photos small enough for a website, an email or an upload form that has a size limit.`,
      `Reducing the weight of images to improve page loading speed.`,
      `Compressing private images without uploading them anywhere.`,
    ],
    example: {
      title: `A typical result`,
      input: `Phone photo: 4000 × 3000 px, about 4 MB`,
      output: `Resized to 1600 px wide, quality 80: often a few hundred KB with no visible difference at normal size.`,
    },
    mistakes: [
      `Saving screenshots or logos with text as lossy JPG, which leaves fuzzy edges.`,
      `Compressing an already compressed file again and again.`,
      `Enlarging a small image, which makes it blurry and not any smaller.`,
    ],
    relatedGuides: ['compress-images-for-web'],
  },
  '/image-format-converter': {
    background: [
      `JPG, PNG and WebP are built for different needs. JPG is lossy and has no transparency. PNG is lossless and supports transparency. WebP supports lossy and lossless modes and transparency and often produces smaller files.`,
      `Converting between formats does not restore detail that a lossy format has already removed. A JPG saved as PNG becomes larger without becoming sharper.`,
    ],
    useCases: [
      `Converting a PNG or WebP to JPG for a system that does not accept the original format.`,
      `Converting a JPG or PNG to WebP to reduce the size of web images.`,
      `Making a flat background transparent, for example the white background of a logo.`,
    ],
    mistakes: [
      `Converting a transparent PNG to JPG. JPG cannot be transparent, so the transparent area is filled with a solid color.`,
      `Expecting background removal to work on photographs. Making a color transparent works best when the background is one flat color. Gradients, shadows and similar tones will leave an edge.`,
      `Converting repeatedly between lossy formats, which lowers quality each time.`,
    ],
    relatedGuides: ['compress-images-for-web'],
  },
  '/document-converter': {
    background: [
      `Word, Excel, PowerPoint and PDF are designed for different jobs. A PDF stores a fixed page layout, while a Word document describes flowing text that is arranged when it is opened. Converting from PDF to an editable format therefore means rebuilding the structure, which is approximate by nature.`,
      `Because conversion happens in your browser, your files are not uploaded to a server, which is helpful for private documents.`,
    ],
    useCases: [
      `Turning a Word or Excel file into a PDF for sharing.`,
      `Extracting the text of a PDF into an editable document.`,
      `Moving data from a spreadsheet to another office format.`,
    ],
    example: {
      title: `Typical expectations`,
      input: `Word (.docx) to PDF`,
      output: `A PDF that keeps the page layout. The reverse direction (PDF to Word) keeps the text but may change complex layouts.`,
    },
    mistakes: [
      `Expecting identical layout when converting PDF to an editable format. Complex tables, columns and unusual fonts may change.`,
      `Converting a scanned PDF. It is a picture of text, not real text, and needs optical character recognition (OCR) that a simple converter does not provide.`,
      `Using password-protected files, which usually cannot be read until the protection is removed.`,
      `Very large files can use a lot of memory in a browser. Split them when you can.`,
    ],
    relatedGuides: [],
  },
};
