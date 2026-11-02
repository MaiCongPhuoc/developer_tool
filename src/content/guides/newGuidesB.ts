import type { Guide } from './types';

export const newGuidesB: Guide[] = [
  {
    slug: 'http-status-codes-guide',
    title: 'HTTP Status Codes: A Practical Guide for Developers and SEO',
    description:
      'The HTTP status codes you will meet most (200, 301, 304, 400, 401, 403, 404, 429, 500, 503), what each one means, how to use them in an API and how they affect search engines.',
    readingMinutes: 7,
    tool: { path: '/', label: 'JSON Formatter & Validator' },
    intro: `Every HTTP response starts with a three-digit status code that tells the client what happened. Choosing the right code makes APIs predictable, helps you debug problems in seconds and, for websites, tells search engines how to treat a page. This guide covers the codes you will meet most often and how to use them well.`,
    sections: [
      {
        heading: 'The five classes',
        list: [
          '1xx informational: the request was received and processing continues (rare in everyday work).',
          '2xx success: the request worked.',
          '3xx redirection: the client should look somewhere else.',
          '4xx client error: the request is wrong or not allowed. The client should change something before retrying.',
          '5xx server error: the request was fine but the server failed. A retry later may succeed.',
        ],
      },
      {
        heading: 'Success codes (2xx)',
        list: [
          '200 OK: the standard success response, with a body.',
          '201 Created: a new resource was created. Return its address in the Location header.',
          '202 Accepted: the request was accepted but is processed later (for example a background job).',
          '204 No Content: success with no body, common for DELETE and some updates.',
        ],
      },
      {
        heading: 'Redirects (3xx)',
        list: [
          '301 Moved Permanently: the resource has a new permanent address. Search engines transfer ranking signals to the new URL.',
          '302 Found and 307 Temporary Redirect: a temporary move. Use these when the original address will be used again.',
          '308 Permanent Redirect: like 301, but it guarantees that the HTTP method (such as POST) is preserved.',
          '304 Not Modified: the cached copy is still valid, so the server sends no body. It saves bandwidth when used with ETag or Last-Modified.',
        ],
      },
      {
        heading: 'Client errors (4xx)',
        list: [
          '400 Bad Request: malformed syntax or invalid data. Explain what is wrong in the response body.',
          '401 Unauthorized: despite the name, it means "not authenticated": credentials are missing or invalid.',
          '403 Forbidden: the client is authenticated, but is not allowed to do this.',
          '404 Not Found: no such resource. Also used to avoid revealing that a protected resource exists.',
          '405 Method Not Allowed: the resource exists but not for this HTTP method (for example POST to a read-only endpoint). Send an Allow header.',
          '409 Conflict: the request conflicts with the current state, such as a duplicate or an edit conflict.',
          '410 Gone: the resource used to exist and was removed on purpose.',
          '422 Unprocessable Content: the syntax is valid but the content fails validation rules.',
          '429 Too Many Requests: rate limit reached. Add a Retry-After header.',
        ],
      },
      {
        heading: 'Server errors (5xx)',
        list: [
          '500 Internal Server Error: an unexpected failure on the server. Log details privately and return a generic message.',
          '502 Bad Gateway: a gateway or proxy received an invalid response from the server behind it.',
          '503 Service Unavailable: the server is overloaded or down for maintenance. Add Retry-After if you know when it will be back.',
          '504 Gateway Timeout: a gateway did not get a response from the server behind it in time.',
        ],
      },
      {
        heading: 'Designing an API with status codes',
        orderedList: [
          'Use the code that matches the outcome. Do not return 200 with an error message inside the body, because clients and monitoring tools rely on the status.',
          'Return a consistent JSON error body with a stable machine-readable code and a human-readable message.',
          'Distinguish 401 (who are you?) from 403 (you may not do that).',
          'Use 404 for a missing resource and 400 or 422 for bad input, so clients can tell them apart.',
          'Document which codes each endpoint can return.',
        ],
        code: {
          label: 'Example error body',
          text: `HTTP/1.1 422 Unprocessable Content
Content-Type: application/json

{
  "error": "validation_failed",
  "message": "email must be a valid address",
  "field": "email"
}`,
        },
      },
      {
        heading: 'Why it matters for search engines',
        list: [
          'Use 301 or 308 when a page moves permanently, so ranking signals follow it. A long chain of redirects wastes crawl time.',
          'A page that no longer exists should return 404 or 410. Returning 200 with a "not found" message creates a soft 404, which confuses crawlers.',
          'For planned downtime, return 503 with Retry-After, so search engines know the outage is temporary and do not drop your pages.',
          'Frequent 5xx errors can make crawlers visit less often.',
        ],
      },
      {
        heading: 'Debugging tips',
        paragraphs: [
          'The browser developer tools (Network tab) show the status of each request. From a terminal, curl -I https://example.com prints only the headers, including the status line. When a response has a JSON body, paste it into a formatter to read the error structure at a glance.',
        ],
      },
    ],
    faq: [
      {
        question: 'What is the difference between 401 and 403?',
        answer:
          '401 means the client is not authenticated: log in or send valid credentials. 403 means the server knows who you are, but you do not have permission.',
      },
      {
        question: 'Should I use 301 or 308?',
        answer:
          'Both are permanent. 308 guarantees that the original method and body are reused, while 301 historically allows clients to change a POST into a GET. For ordinary page moves, 301 is fine.',
      },
      {
        question: 'What is the difference between 404 and 410?',
        answer:
          '404 says the resource was not found, without saying why. 410 says it is gone permanently on purpose. Both lead search engines to drop the page, 410 sometimes a little faster.',
      },
      {
        question: 'Does a 5xx error hurt SEO?',
        answer:
          'A short outage does not usually harm a site, especially with a 503 and Retry-After. Persistent errors can cause crawlers to visit less often and pages to drop out of the index.',
      },
    ],
    sources: [
      { label: 'RFC 9110: HTTP Semantics (status codes)', url: 'https://www.rfc-editor.org/rfc/rfc9110' },
      { label: 'MDN: HTTP response status codes', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status' },
      { label: 'Google Search Central: HTTP status codes and network errors', url: 'https://developers.google.com/crawling/docs/troubleshooting/http-status-codes' },
    ],
  },
  {
    slug: 'csv-format-pitfalls',
    title: 'CSV Files: Common Pitfalls and How to Avoid Them',
    description:
      'The real-world problems with CSV files: quoting, delimiters, encodings and accented text, lost leading zeros, spreadsheet auto-conversion, formula injection and how to compare exports reliably.',
    readingMinutes: 6,
    tool: { path: '/file-compare', label: 'File Compare' },
    intro: `CSV (comma-separated values) is the simplest way to move table data between programs, and the format most spreadsheets can open. Its simplicity is also the source of many bugs, because "CSV" is a loose convention rather than one strict format. This guide covers the problems that appear most often, and how to avoid them.`,
    sections: [
      {
        heading: 'The basic rules',
        paragraphs: [
          'The informal standard, RFC 4180, says: each record is on its own line, fields are separated by commas, and the first line may be a header. A field that contains a comma, a line break or a double quote must be wrapped in double quotes, and a double quote inside such a field is written twice.',
        ],
        code: {
          label: 'Example',
          text: `id,name,note
1,"Nguyễn, Văn A","He said ""hello"""
2,Lan,plain text`,
        },
      },
      {
        heading: 'Do not split on commas',
        paragraphs: [
          'The most common mistake in code is line.split(","). It breaks on quoted fields that contain commas or line breaks. Use a proper CSV parser (every major language has one), which handles quoting, escaped quotes and multi-line fields.',
        ],
      },
      {
        heading: 'The delimiter is not always a comma',
        paragraphs: [
          'In many countries the comma is the decimal separator (for example 3,14), so spreadsheet programs there export "CSV" files separated by semicolons. Tab-separated files (TSV) are also common. If a file opens as a single column, the delimiter probably differs from what your program expects. Detect it, or ask the sender to state it.',
        ],
      },
      {
        heading: 'Character encoding and accented text',
        paragraphs: [
          'A CSV file carries no information about its encoding. UTF-8 is the right choice today, but some spreadsheet programs assume an older encoding unless the file starts with a byte order mark (BOM). The result is garbled text for names with accents, for example Vietnamese letters appearing as strange symbols. Save and read as UTF-8, add a BOM if the target spreadsheet requires it, and test with real accented text, not just plain English.',
        ],
      },
      {
        heading: 'Spreadsheets "helpfully" change your data',
        list: [
          'Leading zeros disappear: the phone number 0912345678 becomes 912345678, and the postal code 01234 becomes 1234.',
          'Long numbers become scientific notation (1.23457E+15), which destroys identifiers such as barcodes and account numbers.',
          'Text that looks like a date is converted. Entries such as "1-2" or gene names like SEPT1 turn into dates.',
          'To avoid this, import the file with the column format set to "text", or store such fields as text and quote them explicitly in your own tools.',
        ],
      },
      {
        heading: 'CSV injection (formula injection)',
        paragraphs: [
          'When a spreadsheet opens a cell that begins with =, +, - or @, it may treat the text as a formula. An attacker who can get such text into data that you export, such as a name typed into a form, can make the spreadsheet run formulas that leak data or open links on whoever opens the file. When you generate CSV from user input, prefix risky values with a single quote or a space, or otherwise neutralise them, and treat downloaded files with care.',
        ],
      },
      {
        heading: 'Inconsistent rows and hidden problems',
        list: [
          'Rows with a different number of fields than the header, often caused by unquoted commas.',
          'Trailing empty columns and blank lines at the end of the file.',
          'Mixed line endings (Windows CRLF and Unix LF) in the same file.',
          'Different spelling of empty values, such as "", NULL, N/A or a space.',
        ],
      },
      {
        heading: 'Comparing two CSV exports',
        paragraphs: [
          'To find what changed between two exports, make the comparison fair first. Use the same encoding, delimiter and line endings. Sort the rows by a stable key (such as an ID) in both files, because exports often return rows in a different order. Then compare them with a diff tool and read the changed rows. For large files, compare only the columns that matter.',
        ],
      },
      {
        heading: 'When CSV is the wrong choice',
        paragraphs: [
          'CSV has no types, no nested data and no metadata. If your data has hierarchy, long text with many line breaks or fields where exact types matter, JSON or a database may be a better format. CSV remains an excellent choice for flat tables that people will open in a spreadsheet.',
        ],
      },
    ],
    faq: [
      {
        question: 'Why does Excel show strange characters for my Vietnamese text?',
        answer:
          'The program is reading the file in a different encoding. Save the file as UTF-8, with a BOM if necessary, or import it using the data import option and choose UTF-8.',
      },
      {
        question: 'What is the difference between CSV and TSV?',
        answer:
          'TSV uses tab characters as separators instead of commas. Tabs appear less often inside text, which reduces quoting problems, but the file still has no standard handling of embedded tabs and line breaks.',
      },
      {
        question: 'Can a CSV file have several sheets?',
        answer:
          'No. A CSV file holds one table. Formats such as XLSX can hold several sheets.',
      },
      {
        question: 'How do I keep a leading zero?',
        answer:
          'Treat the column as text when importing into a spreadsheet, and keep the value as a string in your own code. A leading zero is part of the text, not of a number.',
      },
    ],
    sources: [
      { label: 'RFC 4180: Common Format and MIME Type for CSV Files', url: 'https://www.rfc-editor.org/rfc/rfc4180' },
      { label: 'W3C: CSV on the Web, a Primer', url: 'https://www.w3.org/TR/tabular-data-primer/' },
      { label: 'OWASP: CSV Injection', url: 'https://community.owasp.org/attacks/CSV_Injection' },
      { label: 'Python documentation: csv module', url: 'https://docs.python.org/3/library/csv.html' },
    ],
  },
  {
    slug: 'utf-8-and-unicode-explained',
    title: 'UTF-8 and Unicode Explained: Why Accented Text Breaks',
    description:
      'The difference between Unicode and UTF-8, why Vietnamese letters can be stored in two ways, how garbled text happens and the practical rules for storing and comparing multilingual text.',
    readingMinutes: 7,
    tool: { path: '/dummy-text', label: 'Dummy Text Generator' },
    intro: `If you have ever seen "Ã¡" where an "á" should be, or found that two identical-looking Vietnamese words are not equal in code, you have met the details of Unicode and UTF-8. Handling text correctly means understanding a few ideas that are easy to mix up: characters, code points and bytes. This guide explains them with examples, so you can store, compare and search multilingual text without surprises.`,
    sections: [
      {
        heading: 'Unicode and UTF-8 are different things',
        paragraphs: [
          'Unicode is a catalogue that gives every character a number, called a code point, written like U+0041 for "A" or U+1EBF for "ế". It says nothing about bytes. An encoding is the rule for storing those numbers as bytes. UTF-8, UTF-16 and UTF-32 are three encodings of the same Unicode characters. UTF-8 is the dominant encoding on the web: it uses one to four bytes per character, and the first 128 characters (plain ASCII) use a single byte, which keeps it compatible with older text.',
        ],
      },
      {
        heading: 'Why Vietnamese text takes more bytes',
        paragraphs: [
          'Letters without accents, like "a", take one byte in UTF-8. Letters such as "ế" are outside ASCII and take three bytes (E1 BA BF). A line of Vietnamese text is therefore longer in bytes than the same number of English letters. This matters when a limit is counted in bytes: some database column definitions, network protocols and file formats count bytes, not characters.',
        ],
      },
      {
        heading: 'One letter, two representations',
        paragraphs: [
          'Many accented letters can be written in two valid ways. "ế" can be a single code point (U+1EBF, called the precomposed form), or three code points in a row: "e" plus a combining circumflex (U+0302) plus a combining acute accent (U+0301). The two look identical on screen but are different sequences, so a plain string comparison says they are not equal, and a search for one will not find the other. Text from different keyboards, operating systems and copy and paste sources can use either form.',
        ],
        code: {
          label: 'JavaScript',
          text: `const a = "\\u1EBF";                 // "ế" as one code point
const b = "e\\u0302\\u0301";           // "ế" as e + two combining marks
a === b;                              // false
a.normalize("NFC") === b.normalize("NFC");   // true`,
        },
      },
      {
        heading: 'Normalise before comparing and searching',
        paragraphs: [
          'Unicode defines normalisation forms. NFC composes characters into their shortest form, and NFD decomposes them. Pick one (NFC is the usual choice for storage and display) and normalise text when it enters your system and before you compare, deduplicate or index it. To search without regard to accents, a separate step removes the combining marks after decomposing to NFD.',
        ],
      },
      {
        heading: 'What "length" means',
        paragraphs: [
          'The same string can have several lengths. In JavaScript, "😀".length is 2, because strings are counted in UTF-16 units and this emoji needs two. The decomposed "ế" above has length 3, the composed one has length 1, but both are one visible character, called a grapheme cluster. When you enforce limits such as "at most 50 characters", decide what you count: bytes, code points or what the user sees, and use a library that handles grapheme clusters if it matters.',
        ],
      },
      {
        heading: 'How garbled text (mojibake) happens',
        paragraphs: [
          'Garbled text happens when bytes written in one encoding are read as another. The word "á" is stored in UTF-8 as the two bytes C3 A1. If a program reads those bytes as Latin-1, it shows "Ã¡". Fix it at the source: make every step agree on UTF-8. That means the file or database, the connection, the HTTP header (Content-Type with charset=utf-8) and the HTML declaration (<meta charset="utf-8">).',
        ],
      },
      {
        heading: 'Databases: use utf8mb4',
        paragraphs: [
          'In MySQL, the character set called "utf8" is a limited three-byte variant that cannot store characters outside the basic plane, such as emoji. Use utf8mb4, which is real UTF-8. In PostgreSQL, a UTF8 database encoding handles all of Unicode. Also remember that a VARCHAR(n) limit counts characters in most databases, but the storage and index size limits are in bytes.',
        ],
      },
      {
        heading: 'Messages and other limits',
        paragraphs: [
          'Old text-message standards use a restricted alphabet and allow 160 characters per message. A single character outside it, which includes most Vietnamese letters with accents, switches the message to a Unicode encoding with a limit of 70 characters per message. A text that looks short can therefore be split into several messages, and cost more.',
        ],
      },
      {
        heading: 'Practical rules',
        orderedList: [
          'Use UTF-8 everywhere: files, databases, APIs, HTML and HTTP headers.',
          'Normalise to NFC when text enters your system.',
          'Test with real text in the languages your users use, including accents, long words and emoji, not only English or lorem ipsum.',
          'Know whether a limit counts bytes or characters.',
          'Avoid cutting a string in the middle of a character. Use functions that respect code points or grapheme clusters.',
        ],
      },
    ],
    faq: [
      {
        question: 'What is a BOM?',
        answer:
          'A byte order mark is a special character (U+FEFF) at the start of a file. In UTF-8 it appears as the bytes EF BB BF and is not needed to determine byte order, but some programs, especially spreadsheets, use it to detect that a file is UTF-8.',
      },
      {
        question: 'Should I use UTF-8 or UTF-16?',
        answer:
          'For files, network data and storage, UTF-8 is the usual choice. UTF-16 is used inside some platforms, such as JavaScript strings and Windows APIs. What matters is declaring the encoding correctly where text crosses a boundary.',
      },
      {
        question: 'Why do two identical-looking strings compare as different?',
        answer:
          'They probably use different Unicode forms, for example a precomposed letter versus a base letter with combining marks. Normalise both to the same form before comparing.',
      },
      {
        question: 'How do I fix text that is already garbled?',
        answer:
          'Find which encoding was used to read it, and re-read the original bytes as UTF-8. Text that was saved after being misread may be damaged and cannot always be repaired, so keep a copy of the source.',
      },
    ],
    sources: [
      { label: 'Unicode Consortium: UTF-8, UTF-16, UTF-32 and BOM FAQ', url: 'https://www.unicode.org/faq/utf_bom.html' },
      { label: 'RFC 3629: UTF-8, a transformation format of ISO 10646', url: 'https://www.rfc-editor.org/rfc/rfc3629' },
      { label: 'Unicode Standard Annex #15: Unicode Normalization Forms', url: 'https://unicode.org/reports/tr15/' },
      { label: 'MDN: String.prototype.normalize()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize' },
      { label: 'MySQL documentation: The utf8mb4 character set', url: 'https://dev.mysql.com/doc/refman/8.0/en/charset-unicode-utf8mb4.html' },
      { label: 'W3C: Character encodings, essential concepts', url: 'https://www.w3.org/International/articles/definitions-characters/' },
    ],
  },
];
