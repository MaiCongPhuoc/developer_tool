import type { Guide } from './types';

export const webBasicsGuides: Guide[] = [
  {
    slug: 'regex-cheat-sheet',
    title: 'Regular Expressions Cheat Sheet with Practical Examples',
    description:
      'A compact guide to JavaScript regular expressions: character classes, quantifiers, groups, lookaround, flags, greedy versus lazy matching and how to avoid catastrophic backtracking.',
    readingMinutes: 8,
    tool: { path: '/regex-tester', label: 'Regex Tester' },
    intro: `A regular expression (regex) describes a pattern of text so that a program can find, check or replace it. The syntax looks cryptic at first, but it is built from a small set of pieces. This cheat sheet follows the JavaScript flavour, which is what browsers and Node.js use, and shows each piece with a short example you can try in a regex tester.`,
    sections: [
      {
        heading: 'Literals and special characters',
        paragraphs: [
          'Most characters match themselves: the pattern cat matches the text "cat". A few characters have a special meaning and must be escaped with a backslash to match literally: \\ ^ $ . | ? * + ( ) [ ] { }. To match a literal dot, write \\.',
        ],
      },
      {
        heading: 'Character classes',
        list: [
          '. matches any single character except a line break (unless the s flag is set).',
          '\\d matches a digit, \\w a letter, digit or underscore, \\s whitespace. The uppercase versions (\\D, \\W, \\S) match the opposite.',
          '[abc] matches one of a, b or c. [a-z] is a range. [^abc] matches any character that is not a, b or c.',
        ],
      },
      {
        heading: 'Anchors and boundaries',
        list: [
          '^ matches the start of the text and $ the end (of each line when the m flag is set).',
          '\\b matches a word boundary, which is the position between a word character and a non-word character. \\bcat\\b matches "cat" but not "category".',
        ],
      },
      {
        heading: 'Quantifiers',
        list: [
          '* means zero or more, + one or more, ? zero or one.',
          '{3} means exactly three, {3,} three or more, {3,5} between three and five.',
          'Quantifiers are greedy by default: they take as much text as they can. Add ? to make them lazy (*? and +?), so they take as little as possible.',
        ],
        code: {
          label: 'Greedy versus lazy on "<b>one</b> and <b>two</b>"',
          text: `<.+>     matches the whole string "<b>one</b> and <b>two</b>"
<.+?>    matches only "<b>"`,
        },
      },
      {
        heading: 'Groups and alternation',
        list: [
          '(abc) is a capturing group. The text it matches can be read afterwards, for example as match[1].',
          '(?:abc) groups without capturing, which is faster and keeps numbering clean.',
          '(?<year>\\d{4}) is a named capturing group, read as match.groups.year.',
          'a|b matches a or b. Use a group to limit its reach: gr(a|e)y matches "gray" and "grey".',
          '\\1 or \\k<year> refers back to what an earlier group matched, so \\b(\\w+)\\s+\\1\\b finds repeated words.',
        ],
      },
      {
        heading: 'Lookahead and lookbehind',
        paragraphs: [
          'Lookaround checks the text around a position without including it in the match.',
        ],
        list: [
          'X(?=Y) matches X only if Y follows. X(?!Y) matches X only if Y does not follow.',
          '(?<=Y)X matches X only if Y comes before it. (?<!Y)X matches X only if Y does not come before it.',
          'Example: \\d+(?= USD) finds the number in "250 USD" and leaves " USD" out of the match.',
        ],
      },
      {
        heading: 'Flags',
        list: [
          'g finds all matches instead of stopping at the first.',
          'i ignores letter case.',
          'm makes ^ and $ work on every line.',
          's lets . match line breaks.',
          'u turns on full Unicode support, needed for characters outside the basic range and for \\p{...} property escapes.',
          'y (sticky) matches only at the exact position where the last match ended. The d flag additionally returns the start and end index of each group.',
        ],
      },
      {
        heading: 'Practical patterns',
        code: {
          label: 'Common examples',
          text: `Date 2026-11-01        (\\d{4})-(\\d{2})-(\\d{2})
Hex colour #1a2b3c     #(?:[0-9a-fA-F]{3}){1,2}\\b
Trim spaces            ^\\s+|\\s+$        (with the g flag)
Repeated word          \\b(\\w+)\\s+\\1\\b
Positive integer       ^[1-9]\\d*$`,
        },
        paragraphs: [
          'Be careful with patterns for things like email addresses and URLs. A truly correct email regex is extremely long. A simple check for "something@something.something" is fine for catching typos in a form, but the only real proof that an address works is to send a message to it.',
        ],
      },
      {
        heading: 'Avoiding catastrophic backtracking',
        paragraphs: [
          'Some patterns make the regex engine try an enormous number of ways to match, and a short input can freeze a page or a server. The classic cause is a quantifier nested inside another quantifier, such as (a+)+$ tested against a long string of a followed by an exclamation mark. To stay safe:',
        ],
        list: [
          'Avoid nested quantifiers on overlapping content.',
          'Prefer specific classes ([^"]*) over broad ones (.*) where you can.',
          'Anchor patterns when you can, and limit the length of input you run them on.',
          'Treat patterns that process untrusted input with extra caution.',
        ],
      },
      {
        heading: 'Using a regex in code',
        paragraphs: [
          'In JavaScript you can write a literal such as /\\d+/g, or build one with new RegExp("\\\\d+", "g"). In a string, every backslash must be doubled, which is a frequent source of bugs. Test the pattern on realistic samples first, including empty strings and unusual input, and keep it readable with comments and named groups when it grows.',
        ],
      },
    ],
  },
  {
    slug: 'unix-timestamp-explained',
    title: 'Unix Timestamps and Time Zones: A Developer Guide',
    description:
      'What a Unix timestamp is, how seconds and milliseconds differ, how to handle time zones and daylight saving, ISO 8601 formats and the Year 2038 problem.',
    readingMinutes: 6,
    tool: { path: '/time-converter', label: 'Unix Timestamp & Time Zone Converter' },
    intro: `Dates and times look simple until two systems disagree about them. A Unix timestamp is the standard way to avoid that: a single number that means the same moment everywhere on Earth. This guide explains what it counts, the bugs that most often appear when you use it, and how to handle time zones correctly.`,
    sections: [
      {
        heading: 'What a Unix timestamp is',
        paragraphs: [
          'A Unix timestamp (also called epoch time or POSIX time) is the number of seconds that have passed since 00:00:00 UTC on 1 January 1970, known as the epoch. For example, 1700000000 is 22:13:20 UTC on 14 November 2023. In Vietnam (UTC+7) that same moment is 05:13:20 on 15 November 2023. The number is identical for everyone; only the way it is displayed depends on the time zone.',
        ],
      },
      {
        heading: 'Seconds, milliseconds and more',
        paragraphs: [
          'Different systems count in different units. Classic Unix tools, many databases and JWT claims use seconds, which currently gives a 10-digit number. JavaScript (Date.now()), Java and many APIs use milliseconds, giving 13 digits. Some systems use microseconds (16 digits) or nanoseconds (19 digits). When a converted date shows 1970, or a year tens of thousands in the future, the usual cause is a mix-up of seconds and milliseconds, a factor of 1,000.',
        ],
        list: [
          '10 digits: seconds (for example 1700000000).',
          '13 digits: milliseconds (for example 1700000000000).',
          '16 digits: microseconds. 19 digits: nanoseconds.',
        ],
      },
      {
        heading: 'Why use timestamps at all',
        list: [
          'No ambiguity. A timestamp is always UTC, so it does not depend on the server\'s or user\'s location.',
          'Easy arithmetic. The difference between two moments is a subtraction, and adding 86,400 seconds moves forward one day (not counting changes to clock time).',
          'Compact and sortable. A number is smaller than a formatted string and sorts correctly.',
        ],
      },
      {
        heading: 'Time zones and daylight saving time',
        paragraphs: [
          'Store and transmit moments in UTC, and convert to a local time zone only when you show them to a person. Vietnam uses UTC+7 all year and has no daylight saving time, but many countries shift their clocks, so a local day can be 23 or 25 hours long. Never calculate "tomorrow" by adding 24 hours to a local time. Use a date library or the platform\'s time zone support, and refer to zones by name (for example Asia/Ho_Chi_Minh), not by a fixed offset.',
        ],
      },
      {
        heading: 'ISO 8601 for readable dates',
        paragraphs: [
          'When a date must be written as text, ISO 8601 is the safest format. 2026-11-01T10:30:00Z means 10:30 UTC (the Z stands for zero offset), and 2026-11-01T17:30:00+07:00 is the same moment written with an offset. It sorts alphabetically in time order and is understood by virtually every language and database.',
        ],
      },
      {
        heading: 'The Year 2038 problem',
        paragraphs: [
          'Some older systems store the timestamp in a signed 32-bit integer, whose largest value is 2,147,483,647. That second is 03:14:07 UTC on 19 January 2038; one second later the value overflows to a negative number and the date jumps back to 1901. Modern systems use 64-bit values, which last for hundreds of billions of years, but embedded devices, old databases and file formats can still be affected.',
        ],
      },
      {
        heading: 'Other things that catch people out',
        list: [
          'Unix time ignores leap seconds. Every day has exactly 86,400 seconds in Unix time.',
          'JavaScript months are zero-based: new Date(2026, 0, 1) is 1 January, not 1 February.',
          'Parsing a date string without a time zone may be treated as local time in one environment and UTC in another. Always include the offset or Z.',
          'Timestamps before 1970 are negative numbers, which some libraries do not accept.',
          'A "start of day" or "end of day" boundary depends on the user\'s time zone, so compute it in that zone and convert to a timestamp afterwards.',
        ],
      },
      {
        heading: 'A short checklist',
        orderedList: [
          'Decide whether your API uses seconds or milliseconds and document it.',
          'Store UTC, convert for display.',
          'Use ISO 8601 with an offset when exchanging dates as text.',
          'Use named time zones, never hard-coded offsets, when daylight saving matters.',
          'Test around daylight saving changes and at the end of months and years.',
        ],
      },
    ],
  },
  {
    slug: 'css-units-px-rem-em',
    title: 'CSS Units: px vs rem vs em (and When to Use Each)',
    description:
      'Understand pixels, rem and em in CSS, how to convert between them, how they affect accessibility and zoom, and simple rules for choosing the right unit.',
    readingMinutes: 5,
    tool: { path: '/unit-converter', label: 'Unit & Currency Converter' },
    intro: `Choosing between px, rem and em looks like a small styling detail, but it decides whether your layout respects the font size a visitor has chosen in their browser. This guide explains what each unit is relative to, how to convert between them, and a few rules that keep a design flexible and accessible.`,
    sections: [
      {
        heading: 'px: the CSS pixel',
        paragraphs: [
          'A px in CSS is a fixed reference unit, not a physical screen dot. Browsers scale it to the display, so a 16px font looks about the same size on a high-resolution phone and a regular monitor. A value in px does not change when the user increases their default font size in the browser settings. That predictability is good for borders, shadows and thin lines, and bad for text that people may need to enlarge.',
        ],
      },
      {
        heading: 'rem: relative to the root',
        paragraphs: [
          'rem means "root em": it is a multiple of the font size of the root element (html). The default root font size in browsers is 16px, so 1rem is normally 16px, 1.5rem is 24px and 0.875rem is 14px. If the user changes their default font size, everything sized in rem scales with it. Because it always refers to the same root value, rem is predictable.',
        ],
      },
      {
        heading: 'em: relative to the current element',
        paragraphs: [
          'em is relative to the font size of the element it is used on (or, for the font-size property itself, the parent). That is powerful for components that should scale together, such as padding on a button that follows the button\'s text size. It also compounds: if a list inside a list inside a list each uses font-size: 0.9em, the text keeps shrinking at every level.',
        ],
      },
      {
        heading: 'Converting between px and rem',
        paragraphs: [
          'Divide pixels by the root font size to get rem, and multiply to go back. With a 16px root:',
        ],
        code: {
          label: 'Quick table (root = 16px)',
          text: `12px = 0.75rem     20px = 1.25rem
14px = 0.875rem    24px = 1.5rem
16px = 1rem        32px = 2rem
18px = 1.125rem    48px = 3rem`,
        },
      },
      {
        heading: 'Why accessibility matters',
        paragraphs: [
          'Many people set a larger default font size in their browser or operating system. Text sized in rem respects that choice, while text locked in px may not follow it. Browser zoom works with both, but respecting the default size is part of building pages that are comfortable to read for everyone, and it is a recommendation of accessibility guidelines.',
        ],
      },
      {
        heading: 'Simple rules that work',
        list: [
          'Use rem for font sizes and for spacing that should grow with text (margins, padding, gaps, max widths of text blocks).',
          'Use em for properties of a component that should scale with that component\'s own text size.',
          'Use px for hairline borders, outlines and shadows where an exact size is wanted.',
          'Use unitless values for line-height (1.5 rather than 24px) so that it scales with the font size.',
          'Use percentages and viewport units (vw, vh) for fluid layout widths, but be careful with text sized only in vw, which ignores user preferences.',
        ],
      },
      {
        heading: 'Common mistakes',
        list: [
          'Setting html { font-size: 10px } to make the maths easy. It overrides the user\'s default size. If you want easier maths, use a percentage such as 62.5% knowing that it also shrinks the default, or simply learn that 1rem is 16px.',
          'Nesting em values without noticing the compounding effect.',
          'Using px in media queries for breakpoints when the layout should respond to larger default font sizes. Breakpoints in em or rem follow the user\'s font size setting.',
        ],
      },
    ],
  },
  {
    slug: 'markdown-cheat-sheet',
    title: 'Markdown Cheat Sheet: Syntax, Tables, Task Lists and Diagrams',
    description:
      'A complete Markdown syntax reference with examples: headings, emphasis, lists, links, images, code blocks, GitHub-style tables, task lists and Mermaid diagrams.',
    readingMinutes: 6,
    tool: { path: '/markdown-previewer', label: 'Markdown Previewer' },
    intro: `Markdown is a plain-text way to write formatted documents. You type simple symbols, and a renderer turns them into headings, lists, links and tables. It is used for README files, documentation, notes and chat messages. This cheat sheet lists the syntax you will use most, including the GitHub-flavoured extensions that most tools support.`,
    sections: [
      {
        heading: 'Headings and paragraphs',
        paragraphs: [
          'Start a line with one to six # characters for a heading, followed by a space. Separate paragraphs with a blank line. A single line break inside a paragraph is usually joined into one line; to force a line break, end the line with two spaces or a backslash.',
        ],
        code: {
          label: 'Headings',
          text: `# Heading level 1
## Heading level 2
### Heading level 3`,
        },
      },
      {
        heading: 'Emphasis',
        code: {
          label: 'Text styles',
          text: `*italic* or _italic_
**bold** or __bold__
***bold and italic***
~~strikethrough~~   (GitHub-flavoured)
\`inline code\``,
        },
      },
      {
        heading: 'Lists',
        paragraphs: [
          'Start lines with -, * or + for a bulleted list and with numbers followed by a dot for a numbered list. Indent by two or four spaces to nest items. The actual numbers in a numbered list do not matter; the renderer numbers them in order.',
        ],
        code: {
          label: 'Lists',
          text: `- First item
- Second item
  - Nested item

1. Step one
2. Step two
3. Step three`,
        },
      },
      {
        heading: 'Links and images',
        code: {
          label: 'Links and images',
          text: `[Link text](https://example.com "optional title")
![Alt text for the image](image.png)
<https://example.com>   (automatic link)`,
        },
        paragraphs: [
          'Always write meaningful alt text for images. It is shown if the image fails to load and read aloud by screen readers.',
        ],
      },
      {
        heading: 'Blockquotes and horizontal rules',
        code: {
          label: 'Quotes and rules',
          text: `> This is a quoted paragraph.
> It can span several lines.

---   (three hyphens make a horizontal rule)`,
        },
      },
      {
        heading: 'Code blocks',
        paragraphs: [
          'Surround code with three backticks on their own lines. Add the language name after the opening backticks to turn on syntax highlighting.',
        ],
        code: {
          label: 'Fenced code block',
          text: `\`\`\`javascript
const total = items.reduce((sum, item) => sum + item.price, 0);
\`\`\``,
        },
      },
      {
        heading: 'Tables (GitHub-flavoured)',
        paragraphs: [
          'Separate columns with pipes and add a row of hyphens under the header. Colons in the separator row set alignment.',
        ],
        code: {
          label: 'Table',
          text: `| Tool       | Purpose        | Price |
|:-----------|:--------------:|------:|
| Formatter  | Clean up JSON  | Free  |
| Compressor | Shrink images  | Free  |`,
        },
      },
      {
        heading: 'Task lists',
        code: {
          label: 'Task list',
          text: `- [x] Write the draft
- [ ] Review the draft
- [ ] Publish`,
        },
        paragraphs: ['Task lists render as checkboxes and are handy for to-do lists and pull request descriptions.'],
      },
      {
        heading: 'Diagrams with Mermaid',
        paragraphs: [
          'Many renderers can draw diagrams from text. Write a fenced code block with the language mermaid and describe the diagram inside.',
        ],
        code: {
          label: 'Mermaid flowchart',
          text: `\`\`\`mermaid
flowchart LR
  A[Write Markdown] --> B[Preview]
  B --> C{Looks right?}
  C -- Yes --> D[Publish]
  C -- No --> A
\`\`\``,
        },
      },
      {
        heading: 'Escaping and compatibility',
        list: [
          'To show a special character literally, put a backslash before it, for example \\* or \\#.',
          'Markdown has several flavours. Tables, task lists and strikethrough are extensions that most, but not all, renderers support, so preview your text in the tool where it will be published.',
          'Some renderers allow raw HTML inside Markdown and others remove it for safety.',
        ],
      },
    ],
  },
];
