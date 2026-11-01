import type { Guide } from './types';

export const dataFormatGuides: Guide[] = [
  {
    slug: 'json-vs-xml',
    title: 'JSON vs XML: Differences and When to Use Each',
    description:
      'A practical comparison of JSON and XML: syntax, data types, size, validation and tooling, with clear advice on which format to pick for APIs, config files and documents.',
    readingMinutes: 6,
    tool: { path: '/', label: 'JSON Formatter & Validator' },
    intro: `JSON and XML both describe structured data as text, and both are everywhere: JSON in web APIs and configuration files, XML in documents, feeds, office files and older enterprise systems. They are not interchangeable in every situation, and picking the wrong one tends to cost you time later. This guide compares them on the points that actually matter in day-to-day work.`,
    sections: [
      {
        heading: 'The same data in both formats',
        paragraphs: [
          'Here is one small record written in each format. Notice how XML repeats every name in an opening and a closing tag, while JSON relies on braces, brackets and quotes.',
        ],
        code: {
          label: 'JSON',
          text: `{
  "book": {
    "title": "Clean Code",
    "authors": ["Robert C. Martin"],
    "year": 2008,
    "inStock": true
  }
}`,
        },
      },
      {
        heading: 'The XML version',
        code: {
          label: 'XML',
          text: `<book inStock="true">
  <title>Clean Code</title>
  <authors>
    <author>Robert C. Martin</author>
  </authors>
  <year>2008</year>
</book>`,
        },
        paragraphs: [
          'The XML record is longer because of the closing tags, and it has a choice JSON does not: a value can be an attribute (inStock="true") or an element. That flexibility is useful for documents but also means two people can model the same data in two different shapes.',
        ],
      },
      {
        heading: 'Where JSON is the better choice',
        list: [
          'Web and mobile APIs. JSON maps directly to objects, arrays, strings, numbers, booleans and null, which is exactly what most programming languages already have. In JavaScript, JSON.parse() turns text into a usable object in one call.',
          'Smaller, easier to read payloads. With no closing tags, the same data usually takes fewer bytes and fewer lines.',
          'Simple configuration. Package manifests, editor settings and many build tools use JSON because it is easy to read and to generate.',
        ],
      },
      {
        heading: 'Where XML is the better choice',
        list: [
          'Documents with mixed content. XML can hold text with inline markup, such as a paragraph with bold words and links. That is hard to express cleanly in JSON, which is why formats like XHTML, SVG, RSS and Office files are XML based.',
          'Namespaces, schemas and transformations. XML has mature standards for validating structure (XSD), transforming documents (XSLT) and querying them (XPath). If your industry already standardised on these, XML is the practical answer.',
          'Comments and processing instructions. XML allows comments directly in the file. Standard JSON does not allow comments at all.',
          'Existing integrations. SOAP services, many banking, government and healthcare exchanges and a lot of legacy systems expect XML.',
        ],
      },
      {
        heading: 'Data types and arrays',
        paragraphs: [
          'JSON has real types: a number is a number, true is a boolean and an array is an array. In XML everything is text unless a schema says otherwise, so 2008 and "2008" look identical until your code or schema interprets them. XML also has no built-in array. A list is just a repeated element, which can make a list with exactly one item look like a single value when it is converted to another format.',
        ],
      },
      {
        heading: 'Validation and tooling',
        paragraphs: [
          'Both formats must be well formed before anything else works. JSON is well formed when its braces, quotes and commas are correct. XML is well formed when every tag is closed and properly nested and there is a single root element. Beyond that, XML has schema languages built into its ecosystem, while JSON validation usually uses JSON Schema, which is a separate specification. A formatter that reports the exact position of a syntax error saves a lot of guessing in either format.',
        ],
      },
      {
        heading: 'Converting between them',
        paragraphs: [
          'Converting is less mechanical than it looks. XML attributes and elements both have to become JSON keys, repeated elements must become arrays, and XML text is untyped. Plan for these decisions before you build a pipeline that converts in both directions, and test with records that have one item, many items and no items.',
        ],
      },
      {
        heading: 'A quick way to choose',
        orderedList: [
          'Building or consuming a web API with a modern client? Choose JSON.',
          'Storing a document with formatted text, or required to follow an existing XML standard? Choose XML.',
          'Writing a small configuration file people will edit by hand? JSON works, but if you want comments, consider a format designed for configuration.',
          'Unsure? Choose JSON for data and XML for documents.',
        ],
      },
    ],
  },
  {
    slug: 'fix-common-json-errors',
    title: 'How to Fix the Most Common JSON Syntax Errors',
    description:
      'A checklist of the JSON mistakes that cause "Unexpected token" and parse errors: trailing commas, single quotes, comments, NaN, leading zeros, big numbers and invisible characters.',
    readingMinutes: 6,
    tool: { path: '/', label: 'JSON Formatter & Validator' },
    intro: `Almost every JSON error message looks the same: "Unexpected token" or "Unexpected end of JSON input", sometimes with a position number that means little at first glance. The good news is that real-world JSON breaks in a small number of repeatable ways. Learn these and you can usually fix a broken file in under a minute.`,
    sections: [
      {
        heading: 'How to read the error',
        paragraphs: [
          'The parser stops at the first character it cannot accept, so the reported position is where parsing failed, not always where the mistake was made. A missing quote or comma often only shows up a few characters later. Paste the text into a formatter that highlights the failing line, fix the first error, and check again, because later errors can disappear once the first one is fixed.',
        ],
      },
      {
        heading: '1. Trailing commas',
        paragraphs: [
          'JSON does not allow a comma after the last item of an object or array. This is the single most common mistake, because many programming languages and some configuration formats do allow it.',
        ],
        code: {
          label: 'Invalid → valid',
          text: `{ "name": "Lan", "age": 30, }      // invalid: comma after 30
{ "name": "Lan", "age": 30 }       // valid`,
        },
      },
      {
        heading: '2. Single quotes and unquoted keys',
        paragraphs: [
          'Strings and keys must use double quotes. JavaScript object literals accept single quotes and bare keys, so code copied from a script often fails when pasted as JSON.',
        ],
        code: {
          label: 'Invalid → valid',
          text: `{ name: 'Lan' }                    // invalid
{ "name": "Lan" }                  // valid`,
        },
      },
      {
        heading: '3. Comments',
        paragraphs: [
          'Standard JSON has no comments. Remove // and /* */ comments before parsing. If you need notes in a configuration file, either use a field such as "_comment" that your application ignores, or choose a configuration format that supports comments.',
        ],
      },
      {
        heading: '4. undefined, NaN and Infinity',
        paragraphs: [
          'These are JavaScript values, not JSON values. JSON only has null, true, false, numbers, strings, arrays and objects. When a script serialises an object, undefined fields are dropped and NaN or Infinity become null, so check the source of the data if values are missing or unexpectedly null.',
        ],
      },
      {
        heading: '5. Numbers: leading zeros, hex and very large values',
        list: [
          'Leading zeros such as 007 are not valid numbers. Write 7, or use a string if the leading zero matters, for example a postal code or phone number.',
          'Hexadecimal (0xFF), a leading plus sign (+5) and a trailing decimal point (5.) are not valid JSON numbers.',
          'Integers above 9007199254740991 (2^53 − 1) cannot be stored exactly by JavaScript numbers. IDs from some databases and APIs exceed this limit and get silently rounded. If exact digits matter, transmit such IDs as strings.',
        ],
      },
      {
        heading: '6. Unescaped characters inside strings',
        paragraphs: [
          'A string cannot contain a raw line break or tab. Write them as \\n and \\t. A literal backslash must be written \\\\, and a double quote inside a string must be \\". File paths on Windows are a classic trap, because C:\\Users must be written C:\\\\Users.',
        ],
      },
      {
        heading: '7. Invisible and look-alike characters',
        paragraphs: [
          'Text copied from documents, chat apps and web pages may contain curly "smart quotes", non-breaking spaces or a byte order mark at the start of the file. They look correct but are not valid JSON characters. If a document looks perfect and still fails, retype the quotes or run the text through a tool that normalises it.',
        ],
      },
      {
        heading: '8. Truncated or unbalanced data',
        paragraphs: [
          '"Unexpected end of JSON input" usually means the text was cut off, for example by a failed download, a size limit in a log viewer or an incomplete copy. Count the opening and closing braces and brackets, or open the data in a tree view where unbalanced structure is easy to spot.',
        ],
      },
      {
        heading: 'Preventing errors at the source',
        list: [
          'Never build JSON by joining strings. Use the serialiser of your language, such as JSON.stringify, which escapes everything correctly.',
          'Validate input as early as possible and return the position of the error to the user.',
          'Keep a formatter handy to pretty print responses while debugging, so structure problems become visible.',
        ],
      },
    ],
  },
  {
    slug: 'readable-sql-formatting',
    title: 'How to Format SQL So Your Team Can Read It',
    description:
      'Practical SQL formatting conventions: keyword case, one clause per line, indentation, joins, aliases, subqueries and CASE expressions, with a before and after example.',
    readingMinutes: 6,
    tool: { path: '/sql', label: 'SQL Formatter' },
    intro: `SQL that works is not always SQL that can be maintained. A long query squeezed into one line is difficult to review, debug and change safely. Consistent formatting does not make a query faster, but it makes mistakes visible, and that is worth a lot. These are the conventions most teams settle on, and why.`,
    sections: [
      {
        heading: 'Before and after',
        paragraphs: ['The two queries below are identical for the database. Only the layout is different.'],
        code: {
          label: 'Unformatted',
          text: `select u.id,u.name,count(o.id) as orders from users u left join orders o on o.user_id=u.id where u.active=1 and o.created_at>='2026-01-01' group by u.id,u.name having count(o.id)>2 order by orders desc`,
        },
      },
      {
        heading: 'Formatted',
        code: {
          label: 'Formatted',
          text: `SELECT
    u.id,
    u.name,
    COUNT(o.id) AS orders
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.active = 1
    AND o.created_at >= '2026-01-01'
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 2
ORDER BY orders DESC`,
        },
        paragraphs: [
          'You can now see at a glance which tables are used, how they are joined, which filters apply and how the result is grouped and sorted.',
        ],
      },
      {
        heading: 'Uppercase keywords, lowercase names',
        paragraphs: [
          'Writing keywords such as SELECT, FROM, JOIN and WHERE in capitals and table and column names in lowercase lets the eye separate the structure of the query from the data it touches. Pick one rule and apply it everywhere; a formatter can do this automatically.',
        ],
      },
      {
        heading: 'One clause per line, one column per line',
        paragraphs: [
          'Start each major clause (SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY) on its own line, and list selected columns one per line. Version control then shows a clean one-line difference when someone adds a column, instead of marking an entire long line as changed.',
        ],
      },
      {
        heading: 'Indent conditions and subqueries',
        paragraphs: [
          'Indent continuation lines such as additional AND and OR conditions, and indent subqueries one level deeper than the line that contains them. Put parentheses so the opening and closing ones line up, which makes a missing bracket easy to find. For queries that nest more than one level, consider common table expressions (WITH name AS (...)). Naming each step usually reads better than a deeply nested subquery.',
        ],
      },
      {
        heading: 'Be explicit with joins and aliases',
        list: [
          'Use explicit JOIN ... ON syntax rather than listing tables separated by commas and putting join conditions in WHERE.',
          'Give tables short, meaningful aliases and use them for every column, so it is clear which table each column comes from.',
          'Avoid SELECT * in production queries. Listing the columns you need makes the query self-documenting and protects it from schema changes.',
        ],
      },
      {
        heading: 'A subtle bug that formatting can reveal',
        paragraphs: [
          'In the example above, the query uses a LEFT JOIN but then filters the right-hand table in the WHERE clause (o.created_at >= ...). Rows with no matching order have a NULL date, so they are removed and the LEFT JOIN behaves like an INNER JOIN. If you want to keep users without orders, move that condition into the ON clause. Clear layout makes this kind of mistake much easier to notice during review.',
        ],
      },
      {
        heading: 'Formatting CASE expressions',
        code: {
          label: 'CASE layout',
          text: `CASE
    WHEN score >= 90 THEN 'A'
    WHEN score >= 80 THEN 'B'
    ELSE 'C'
END AS grade`,
        },
        paragraphs: ['Putting each WHEN on its own line, with END aligned to CASE, makes the logic read like a table.'],
      },
      {
        heading: 'Agree on a style and automate it',
        paragraphs: [
          'The exact choices matter less than applying them consistently. Decide on keyword case, indentation width and comma placement, write it down, and run a formatter before committing. Formatting only changes whitespace and keyword case, so it does not alter what a query returns or how fast it runs.',
        ],
      },
    ],
  },
  {
    slug: 'how-text-diff-works',
    title: 'How a Text Diff Works (and How to Read One)',
    description:
      'Learn how diff tools find the differences between two texts, why results sometimes look odd, and practical tips for comparing code, configuration and JSON files accurately.',
    readingMinutes: 5,
    tool: { path: '/text-compare', label: 'Text Compare' },
    intro: `A diff is the list of changes needed to turn one text into another. You see it in code review, in version control and in every document comparison tool. Understanding how it is produced explains why a diff sometimes shows more changes than you expected, and helps you set up a comparison so that it is easy to trust.`,
    sections: [
      {
        heading: 'The idea: find what stayed the same',
        paragraphs: [
          'A diff tool does not search for differences directly. It looks for the longest sequence of lines (or words) that appears in both texts in the same order, called the longest common subsequence. Everything outside that shared sequence is reported as added or removed. Fewer changes in the report means a better match.',
        ],
      },
      {
        heading: 'Where the common algorithm comes from',
        paragraphs: [
          'Many tools, including Git by default, use a variation of an algorithm published by Eugene Myers in 1986. It finds a shortest set of insertions and deletions and is fast when the two texts are similar, which is the usual case when comparing two versions of the same file.',
        ],
      },
      {
        heading: 'Line, word and character level',
        list: [
          'Line level shows which whole lines were added, removed or changed. It is the most common view for source code and configuration.',
          'Word level highlights exactly which words changed inside a line. This is much easier to read for prose and for long lines with one small edit.',
          'Character level is useful for short strings such as identifiers and hashes, where a single character matters.',
        ],
      },
      {
        heading: 'Why a diff can look strange',
        paragraphs: [
          'There is often more than one shortest set of changes. When a block of similar lines is repeated, such as several closing braces, the tool may match the wrong copy and show a confusing result even though it is technically minimal. Moved text is another limit: most diff algorithms see a moved paragraph as one deletion plus one addition, not as a move.',
        ],
      },
      {
        heading: 'Noise from whitespace and line endings',
        paragraphs: [
          'Files edited on different systems may use different line endings (Windows uses CRLF, Linux and macOS use LF), and editors may add trailing spaces or change indentation. These make every line look different even when the visible text is the same. If you see an entire file marked as changed, check line endings and whitespace first.',
        ],
      },
      {
        heading: 'Comparing structured data',
        paragraphs: [
          'JSON and XML can carry the same information in different layouts, for example with keys in a different order. Before comparing two JSON files, format both the same way (same indentation) and, if the order of keys is not meaningful, sort the keys. Then a real change stands out instead of being buried in layout differences.',
        ],
      },
      {
        heading: 'Tips for a reliable comparison',
        orderedList: [
          'Normalise first: same line endings, same indentation, same encoding.',
          'Decide whether whitespace and letter case matter, and ignore them if they do not.',
          'Use the word-level view for prose and the line view for code.',
          'Read removed and added lines together, because a changed line appears as one removal and one addition.',
          'For very large files, compare sections or filter out generated lines such as timestamps.',
        ],
      },
    ],
  },
];
