import type { GuideExtra } from './extraTypes';

// Phần mở rộng (thêm mục, FAQ, nguồn tham khảo) cho các bài viết gốc. Gộp vào
// bài tương ứng (theo slug) trong guides/index.ts.
export const extrasA: Record<string, GuideExtra> = {
  'json-vs-xml': {
    sections: [
      {
        heading: 'A realistic example: an order with several items',
        paragraphs: [
          'Real data usually contains lists. The two snippets below describe the same order with two line items. In JSON the list is an array. In XML it is a repeated element, and the quantity is stored here as an attribute.',
        ],
        code: {
          label: 'JSON',
          text: `{
  "orderId": "A-1001",
  "items": [
    { "sku": "KB-01", "qty": 2 },
    { "sku": "MS-07", "qty": 1 }
  ]
}`,
        },
      },
      {
        heading: 'The same order in XML, and a classic pitfall',
        code: {
          label: 'XML',
          text: `<order id="A-1001">
  <item sku="KB-01" qty="2"/>
  <item sku="MS-07" qty="1"/>
</order>`,
        },
        paragraphs: [
          'A common bug appears when this XML is converted to JSON automatically. With two items you get an array, but an order with exactly one item has a single <item> element, and many converters then produce an object instead of an array with one element. Code that expects an array fails only for one-item orders. If you convert between the formats, define the list fields explicitly and test the one-item and empty cases.',
        ],
      },
      {
        heading: 'Size and speed in practice',
        paragraphs: [
          'XML text is usually longer than the equivalent JSON, but once a server compresses responses with gzip or Brotli, which web servers normally do, the gap shrinks a lot because repeated tag names compress very well. Parse speed depends more on the library than on the format. For very large files, a streaming parser (SAX-style for XML, or newline-delimited JSON where each line is one record) lets you process data without loading everything into memory.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is JSON replacing XML?',
        answer:
          'For web APIs, largely yes. For documents and many established standards (SVG images, RSS and Atom feeds, Office Open XML files, many industry exchange formats), XML remains the standard and is not going away.',
      },
      {
        question: 'Can a JSON file contain comments?',
        answer:
          'Not in standard JSON. Some tools accept supersets such as JSONC or JSON5 that allow comments, but a strict parser will reject them, so do not rely on comments in data that other systems will read.',
      },
      {
        question: 'Which format is more secure?',
        answer:
          'Neither is secure or insecure by itself. XML parsers have one well-known risk: external entity (XXE) attacks if the parser is configured to resolve external entities, so disable DTDs and external entities when parsing untrusted XML. With JSON, the usual problems come from how the data is used afterwards, for example building queries or HTML from it without escaping.',
      },
      {
        question: 'Does the order of keys matter in JSON?',
        answer:
          'In JSON, an object is an unordered set of name and value pairs, so you should not depend on key order. Arrays, on the other hand, are ordered. In XML, the order of child elements is significant.',
      },
    ],
    sources: [
      { label: 'RFC 8259: The JavaScript Object Notation (JSON) Data Interchange Format', url: 'https://www.rfc-editor.org/rfc/rfc8259' },
      { label: 'W3C: Extensible Markup Language (XML) 1.0', url: 'https://www.w3.org/TR/xml/' },
      { label: 'MDN: JSON', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON' },
      { label: 'OWASP: XML External Entity (XXE) Processing', url: 'https://community.owasp.org/vulnerabilities/XML_External_Entity_(XXE)_Processing' },
    ],
  },

  'fix-common-json-errors': {
    sections: [
      {
        heading: 'What common error messages mean',
        paragraphs: [
          'The wording of a parse error differs between browsers, Node.js and other languages, and changes between versions, but the families of message are stable:',
        ],
        list: [
          '"Unexpected token" (browsers, Node.js): the parser found a character that is not allowed at that point, often a trailing comma, a single quote or a stray character such as a comment.',
          '"Unexpected end of JSON input": the text stopped too early, so a bracket or quote is missing or the data was truncated.',
          '"Expecting property name enclosed in double quotes" (Python): an object key is unquoted or uses single quotes, or there is a trailing comma before the closing brace.',
          '"Expecting \',\' delimiter" (Python): two values are next to each other without a comma, or a closing quote or bracket is missing earlier in the text.',
        ],
      },
      {
        heading: 'A debugging routine that works',
        orderedList: [
          'Paste the text into a JSON formatter so it points to the first line that fails.',
          'Fix only that first error, then check again. One mistake often causes several messages.',
          'If the formatter accepts the text, but your program still fails, compare what your program actually receives (the raw response body) with what you pasted. Encoding or proxy changes are common causes.',
          'If the text came from a log or terminal, check for truncation and for added prefixes such as timestamps.',
          'Once it parses, validate the structure (the keys and types you expect), because valid JSON can still be the wrong shape.',
        ],
      },
    ],
    faq: [
      {
        question: 'Why does my code accept this "JSON" but a validator rejects it?',
        answer:
          'Many programming languages accept a looser object-literal syntax that allows single quotes, unquoted keys, comments and trailing commas. A real JSON parser follows the stricter specification, so text that works as code can still be invalid JSON.',
      },
      {
        question: 'What happens with duplicate keys?',
        answer:
          'The specification says names within an object should be unique, and the behaviour for duplicates is not defined. Most parsers keep the last value, but you should not rely on it. Avoid duplicates.',
      },
      {
        question: 'Is JSON5 or JSONC the same as JSON?',
        answer:
          'No. They are supersets that add comments, trailing commas and more relaxed quoting. They are convenient for hand-edited configuration but must be converted to strict JSON before being sent to a system that expects JSON.',
      },
      {
        question: 'Is there a size limit?',
        answer:
          'The format itself has none. Practical limits come from memory, from the tool or library you use and from the servers and proxies the data passes through.',
      },
    ],
    sources: [
      { label: 'RFC 8259: The JSON Data Interchange Format', url: 'https://www.rfc-editor.org/rfc/rfc8259' },
      { label: 'JSON.org: Introducing JSON', url: 'https://www.json.org/json-en.html' },
      { label: 'MDN: JSON.parse()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse' },
      { label: 'MDN: Number.MAX_SAFE_INTEGER', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER' },
    ],
  },

  'readable-sql-formatting': {
    sections: [
      {
        heading: 'Leading or trailing commas?',
        paragraphs: [
          'Teams argue about where commas belong in a column list. Trailing commas (at the end of each line) look natural and match everyday writing. Leading commas (at the start of each line) make it easy to comment out or add the last column without touching the line above it, and they make a missing comma obvious. Either is fine. What matters is choosing one, writing it down and letting a formatter apply it.',
        ],
      },
      {
        heading: 'Use common table expressions for multi-step logic',
        paragraphs: [
          'When a query needs several steps, a common table expression (CTE) lets you name each one and read the query from top to bottom, instead of from the innermost subquery outwards:',
        ],
        code: {
          label: 'CTE example',
          text: `WITH recent_orders AS (
    SELECT user_id, COUNT(*) AS orders
    FROM orders
    WHERE created_at >= '2026-01-01'
    GROUP BY user_id
)
SELECT u.name, r.orders
FROM users u
JOIN recent_orders r ON r.user_id = u.id
WHERE r.orders > 2
ORDER BY r.orders DESC`,
        },
      },
      {
        heading: 'Naming and small habits that help',
        list: [
          'Use clear, consistent names: singular or plural for tables, but not both.',
          'Alias aggregated columns (COUNT(*) AS orders) so that results are self-explanatory.',
          'Put each condition of a long WHERE clause on its own line and group OR conditions in parentheses to show your intent.',
          'Add a short comment above a non-obvious condition explaining why it is there. Comments are for the reason, not the syntax.',
        ],
      },
    ],
    faq: [
      {
        question: 'Does formatting change performance?',
        answer:
          'No. Whitespace and keyword case are ignored by the database when it plans and runs the query. Performance depends on the query logic, indexes and data, not on layout.',
      },
      {
        question: 'Do SQL keywords have to be uppercase?',
        answer:
          'No, keywords are case-insensitive. Uppercase is a readability convention. Be careful with identifiers: depending on the database and on whether they are quoted, table and column names can be case-sensitive.',
      },
      {
        question: 'Tabs or spaces for indentation?',
        answer:
          'Either works. Many teams use four spaces, because tabs display at different widths in different tools. Consistency matters more than the choice.',
      },
      {
        question: 'Should I format queries by hand or automatically?',
        answer:
          'Automatically. A formatter or a pre-commit hook keeps style consistent without arguments and makes diffs smaller, because only real changes show up.',
      },
    ],
    sources: [
      { label: 'SQL Style Guide (Simon Holywell)', url: 'https://www.sqlstyle.guide/' },
      { label: 'PostgreSQL documentation: SELECT', url: 'https://www.postgresql.org/docs/current/sql-select.html' },
      { label: 'PostgreSQL documentation: WITH queries (CTEs)', url: 'https://www.postgresql.org/docs/current/queries-with.html' },
    ],
  },

  'how-text-diff-works': {
    sections: [
      {
        heading: 'A tiny worked example',
        paragraphs: [
          'Take two short sentences and compare them word by word:',
        ],
        code: {
          label: 'Before and after',
          text: `Before: the quick brown fox
After:  the quick red fox jumps

Longest common sequence: "the quick" ... "fox"
Diff:  the quick [- brown -] [+ red +] fox [+ jumps +]`,
        },
      },
      {
        heading: 'How the result is built',
        paragraphs: [
          'The shared words (the, quick, fox) form the common sequence. Everything between them that is not shared becomes a change: "brown" was removed, "red" was added in its place, and "jumps" was added at the end. A line-based diff works the same way but treats each whole line as one unit, which is why a one-word edit in a long line marks the entire line as changed unless the tool also highlights the words inside it.',
        ],
      },
      {
        heading: 'Choosing the right view',
        list: [
          'Code review: line view, with word highlighting inside changed lines.',
          'Prose and documents: word view, since sentences are long and edits are small.',
          'Data files: format and sort first, then use the line view.',
          'Identifiers and hashes: character view, because a single character matters.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is a diff tool the same as git diff?',
        answer:
          'They share the same idea. Git can use several algorithms, including the default Myers algorithm and the patience and histogram variants, which can produce more readable results for code that has many similar lines.',
      },
      {
        question: 'Why does a moved paragraph show as deleted and added?',
        answer:
          'Most diff algorithms compare text in order. A paragraph moved to a different place appears once as a removal and once as an addition, because the algorithm does not try to detect moves.',
      },
      {
        question: 'How do I ignore whitespace differences?',
        answer:
          'Many tools have an option to ignore whitespace changes. If yours does not, normalise both texts first: convert line endings, remove trailing spaces and use the same indentation.',
      },
      {
        question: 'Can I compare binary files?',
        answer:
          'A text diff is not meaningful for binary formats such as images, PDFs or compiled files. Use a tool designed for that format, or compare checksums to check whether two files are identical.',
      },
    ],
    sources: [
      { label: 'E. W. Myers, "An O(ND) Difference Algorithm and Its Variations" (Algorithmica, 1986)', url: 'https://link.springer.com/article/10.1007/BF01840446' },
      { label: 'Git documentation: git-diff and the --diff-algorithm option', url: 'https://git-scm.com/docs/git-diff' },
      { label: 'GNU Diffutils manual', url: 'https://www.gnu.org/software/diffutils/manual/diffutils.html' },
    ],
  },

  'jwt-explained': {
    sections: [
      {
        heading: 'A typical login flow with access and refresh tokens',
        orderedList: [
          'The user signs in with a username and password (or another method).',
          'The server checks the credentials and returns a short-lived access token (a JWT, valid for minutes) and a longer-lived refresh token.',
          'The client sends the access token with each API request, usually in the Authorization header.',
          'When the access token expires, the client sends the refresh token to get a new access token without asking the user to sign in again.',
          'On sign-out, or if a token is suspected to be stolen, the server revokes the refresh token so no new access tokens can be issued.',
        ],
      },
      {
        heading: 'Checklist for verifying a token on the server',
        orderedList: [
          'Split the token into three parts and reject anything that does not have exactly three.',
          'Check that the algorithm in the header is one you allow, and verify the signature with the matching key. Never accept "none".',
          'Check exp (not expired) and nbf (already valid), allowing a small clock tolerance of a few seconds.',
          'Check iss (expected issuer) and aud (meant for this service).',
          'Only then read the claims such as sub and any roles, and still check permissions on the server for the action requested.',
        ],
      },
    ],
    faq: [
      {
        question: 'JWT or a session cookie: which should I use?',
        answer:
          'A server-side session with an opaque ID is simple and easy to revoke, which suits a classic website. JWTs fit stateless APIs and services that need to pass signed identity information without a shared session store. Many systems use both.',
      },
      {
        question: 'Can I revoke a JWT before it expires?',
        answer:
          'Not by itself, since the signature stays valid until exp. You can keep the lifetime short, maintain a deny list of token IDs (jti), or rely on revoking the refresh token so that no new access tokens are issued.',
      },
      {
        question: 'HS256 or RS256?',
        answer:
          'HS256 uses one shared secret, so every service that verifies tokens can also create them. RS256 uses a private key to sign and a public key to verify, which lets many services verify tokens without being able to forge them.',
      },
      {
        question: 'Where should a browser store a JWT?',
        answer:
          'Any storage that page scripts can read is exposed if the site has a cross-site scripting bug. An HttpOnly, Secure cookie with appropriate SameSite settings is usually safer, though it needs protection against cross-site request forgery.',
      },
      {
        question: 'What is the "kid" header?',
        answer:
          'It is a key ID. When a service rotates signing keys, kid tells the verifier which key was used so it can pick the right one.',
      },
    ],
    sources: [
      { label: 'RFC 7519: JSON Web Token (JWT)', url: 'https://www.rfc-editor.org/rfc/rfc7519' },
      { label: 'RFC 7515: JSON Web Signature (JWS)', url: 'https://www.rfc-editor.org/rfc/rfc7515' },
      { label: 'RFC 7518: JSON Web Algorithms (JWA)', url: 'https://www.rfc-editor.org/rfc/rfc7518' },
      { label: 'RFC 8725: JSON Web Token Best Current Practices', url: 'https://www.rfc-editor.org/rfc/rfc8725' },
    ],
  },

  'uuid-versions-explained': {
    sections: [
      {
        heading: 'Generating UUIDs in common languages',
        code: {
          label: 'Version 4 examples',
          text: `// JavaScript (browser and Node.js)
crypto.randomUUID();

# Python
import uuid; str(uuid.uuid4())

// Java
java.util.UUID.randomUUID().toString();

-- PostgreSQL 13 and later
SELECT gen_random_uuid();`,
        },
        paragraphs: [
          'All of these use the operating system or runtime secure random source. Avoid building a UUID by hand from Math.random() or similar functions, which are not designed to be unpredictable.',
        ],
      },
      {
        heading: 'Validating a UUID string',
        paragraphs: [
          'When a value arrives from a user or another system, check its shape before using it. This pattern accepts the standard 8-4-4-4-12 layout for versions 1 to 8 and the standard variant, in either letter case. It rejects the special nil (all zeros) and max (all ones) values, which you would need to allow as separate cases:',
        ],
        code: {
          label: 'Regex (use the i flag)',
          text: `^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`,
        },
      },
    ],
    faq: [
      {
        question: 'Are UUIDs case sensitive?',
        answer:
          'No. The hexadecimal digits mean the same in upper and lower case, and the specification recommends producing lowercase. Compare UUIDs case-insensitively, or normalise them to lowercase before storing.',
      },
      {
        question: 'Can I make a UUID shorter?',
        answer:
          'Yes. The 36-character text form is just a way of writing 16 bytes. Encoding those 16 bytes in Base64URL gives 22 characters. Keep the standard form in your database and use the short form only where it is shown to people.',
      },
      {
        question: 'Is it safe to put a UUID in a URL?',
        answer:
          'It is fine to use as an identifier. But a hard-to-guess ID is not access control: always check on the server that the user is allowed to see the record, because anyone who learns the ID can try to use it.',
      },
      {
        question: 'What are the nil and max UUIDs?',
        answer:
          'The nil UUID is 00000000-0000-0000-0000-000000000000 and the max UUID is ffffffff-ffff-ffff-ffff-ffffffffffff. They are reserved special values, sometimes used as placeholders, and should not be generated as normal identifiers.',
      },
    ],
    sources: [
      { label: 'RFC 9562: Universally Unique IDentifiers (UUIDs)', url: 'https://www.rfc-editor.org/rfc/rfc9562' },
      { label: 'MDN: Crypto.randomUUID()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID' },
      { label: 'PostgreSQL documentation: UUID type', url: 'https://www.postgresql.org/docs/current/datatype-uuid.html' },
    ],
  },

  'strong-password-guide': {
    sections: [
      {
        heading: 'How attackers actually guess passwords',
        paragraphs: [
          'There are two situations. In an online attack, the attacker tries guesses against the real login page, which can be slowed down by rate limits and lockouts. In an offline attack, the attacker has stolen a database of password hashes and can try guesses on their own hardware, as fast as it can run, with no limits. Websites defend against this by storing passwords with deliberately slow hashing functions such as bcrypt, scrypt or Argon2, but you cannot see whether a site does so. A long random password protects you in both cases.',
          'A third method, credential stuffing, tries email and password pairs leaked from one site on many others. It needs no guessing at all, which is why a unique password per site is so important.',
        ],
      },
      {
        heading: 'Checking whether a password has leaked',
        paragraphs: [
          'Services such as Have I Been Pwned offer a "Pwned Passwords" check. It uses a technique called k-anonymity: your device computes a hash of the password and sends only the first five characters of it, and the service replies with all known leaked hashes that start with those characters. The comparison is done on your device, so the password itself is never sent. Many password managers and websites use this to warn you when a password is known to be exposed. A password that appears in these lists should not be used, however complex it looks.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is it safe to use an online password generator?',
        answer:
          'Only if it creates the password on your device using a secure random source and does not send it anywhere. The Password Generator on this site runs in your browser using crypto.getRandomValues() and avoids statistical bias when choosing characters. Whatever tool you use, never type a real password into a generator that works by sending a request to a server.',
      },
      {
        question: 'Do I need special characters?',
        answer:
          'Only if the site requires them. Each extra character of length adds more strength than a symbol does. When a site does require a symbol, a generator can include one without making the password predictable.',
      },
      {
        question: 'How often should I change my password?',
        answer:
          'Not on a fixed schedule. Change a password when you have a reason: a breach notice, a suspicious login, or a password that was shared or reused. Forced regular changes often lead people to pick weaker, predictable passwords.',
      },
      {
        question: 'Is writing passwords down acceptable?',
        answer:
          'A password manager is better for most people. A written note kept somewhere physically secure at home is a lesser risk than reusing one memorable password everywhere, but it does not help when you are away from home.',
      },
    ],
    sources: [
      { label: 'NIST SP 800-63B: Digital Identity Guidelines, Authentication', url: 'https://pages.nist.gov/800-63-3/sp800-63b.html' },
      { label: 'OWASP: Password Storage Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html' },
      { label: 'EFF: Dice-generated passphrases', url: 'https://www.eff.org/dice' },
      { label: 'Have I Been Pwned: Pwned Passwords', url: 'https://haveibeenpwned.com/Passwords' },
    ],
  },
};
