import type { GuideExtra } from './extraTypes';

export const extrasB: Record<string, GuideExtra> = {
  'regex-cheat-sheet': {
    sections: [
      {
        heading: 'Building a pattern step by step',
        paragraphs: [
          'Start with the simplest version that matches your example, then tighten it. Suppose you want to find dates such as 2026-11-01 in a text:',
        ],
        orderedList: [
          'Start with the shape: \\d{4}-\\d{2}-\\d{2} matches four digits, a hyphen, two digits, a hyphen and two digits.',
          'Add anchors if the whole string must be a date: ^\\d{4}-\\d{2}-\\d{2}$. Without them the pattern also matches inside a longer string.',
          'Capture the parts you need: ^(\\d{4})-(\\d{2})-(\\d{2})$, or with names, ^(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})$.',
          'Remember what a regex cannot do: it checks the shape, not the meaning. 2026-13-45 matches the pattern but is not a real date. Validate the values in code.',
        ],
      },
      {
        heading: 'Replacing with capture groups',
        paragraphs: [
          'Captured groups can be reused in the replacement text. This turns an ISO date into a day, month, year format:',
        ],
        code: {
          label: 'JavaScript',
          text: `"2026-11-01".replace(/(\\d{4})-(\\d{2})-(\\d{2})/, "$3/$2/$1")
// "01/11/2026"`,
        },
      },
    ],
    faq: [
      {
        question: 'Are regex engines the same everywhere?',
        answer:
          'The basics are shared, but there are differences between flavours such as JavaScript, Python, Java and PCRE (used by PHP and many tools). Lookbehind support, named group syntax and Unicode handling vary, so test in the engine you will actually use.',
      },
      {
        question: 'Why does [A-Z] not match letters such as "ế" or "Đ"?',
        answer:
          'Ranges like [A-Z] cover only basic Latin letters. To match letters from any language, turn on the u flag and use the Unicode property \\p{L}, for example /\\p{L}+/gu. This is important for Vietnamese and other languages with accents.',
      },
      {
        question: 'How do I match across several lines?',
        answer:
          'Use the s flag so that the dot also matches line breaks, or use [\\s\\S] as a character class that matches any character. Use the m flag if you want ^ and $ to match at the start and end of each line.',
      },
      {
        question: 'Why does my regex work in the tester but not in my code?',
        answer:
          'Usual causes are a missing flag, unescaped backslashes in a string (write \\\\d inside a normal string), or a different regex engine. Copy the exact pattern and flags, and check how your language handles escaping.',
      },
    ],
    sources: [
      { label: 'MDN: Regular expressions guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions' },
      { label: 'MDN: RegExp reference', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp' },
      { label: 'Regular-Expressions.info', url: 'https://www.regular-expressions.info/' },
      { label: 'OWASP: Regular expression Denial of Service (ReDoS)', url: 'https://community.owasp.org/attacks/Regular_expression_Denial_of_Service_-_ReDoS' },
    ],
  },

  'unix-timestamp-explained': {
    sections: [
      {
        heading: 'Converting in code',
        code: {
          label: 'Common conversions',
          text: `// JavaScript
new Date(1700000000 * 1000).toISOString();   // "2023-11-14T22:13:20.000Z"
Math.floor(Date.now() / 1000);               // current time in seconds

# Python
from datetime import datetime, timezone
datetime.fromtimestamp(1700000000, tz=timezone.utc)

-- PostgreSQL
SELECT to_timestamp(1700000000);

-- MySQL
SELECT FROM_UNIXTIME(1700000000);`,
        },
        paragraphs: [
          'Note the multiplication by 1000 in JavaScript: its Date works in milliseconds, while the timestamp here is in seconds. Also be aware that some functions, such as MySQL FROM_UNIXTIME, display the result in the session time zone, so the same timestamp can look different on two servers.',
        ],
      },
      {
        heading: 'One moment, many local times',
        paragraphs: [
          'The timestamp 1700000000 is a single instant. Here is how it reads in several places:',
        ],
        list: [
          'UTC and London: 14 November 2023, 22:13:20.',
          'Vietnam (UTC+7): 15 November 2023, 05:13:20.',
          'Tokyo (UTC+9): 15 November 2023, 07:13:20.',
          'New York (UTC−5 in November): 14 November 2023, 17:13:20.',
        ],
      },
    ],
    faq: [
      {
        question: 'What does the timestamp 0 mean?',
        answer: 'It is the epoch itself: 00:00:00 UTC on 1 January 1970.',
      },
      {
        question: 'Does a Unix timestamp depend on the time zone?',
        answer:
          'No. It counts seconds since the epoch in UTC, so it is the same everywhere. Only the displayed date and time depend on the time zone.',
      },
      {
        question: 'Why do some timestamps have decimals?',
        answer:
          'The fractional part holds fractions of a second, for example 1700000000.123. Many systems prefer an integer number of milliseconds instead.',
      },
      {
        question: 'Is Unix time the same as UTC?',
        answer:
          'Almost. Unix time counts every day as exactly 86,400 seconds and ignores leap seconds, so it can differ from strict UTC by a few seconds in the way leap seconds are handled.',
      },
    ],
    sources: [
      { label: 'Wikipedia: Unix time', url: 'https://en.wikipedia.org/wiki/Unix_time' },
      { label: 'Wikipedia: Year 2038 problem', url: 'https://en.wikipedia.org/wiki/Year_2038_problem' },
      { label: 'RFC 3339: Date and Time on the Internet (Timestamps)', url: 'https://www.rfc-editor.org/rfc/rfc3339' },
      { label: 'IANA Time Zone Database', url: 'https://www.iana.org/time-zones' },
      { label: 'MDN: Date', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date' },
    ],
  },

  'css-units-px-rem-em': {
    sections: [
      {
        heading: 'Fluid text with clamp()',
        paragraphs: [
          'The CSS clamp() function lets a size grow with the screen but never go below a minimum or above a maximum. For example, font-size: clamp(1rem, 0.8rem + 1vw, 1.5rem) keeps text at least 1rem, scales with the viewport width in between, and stops at 1.5rem. Using rem for the limits keeps the text responsive to the user\'s font setting, while the viewport unit provides the smooth growth.',
        ],
      },
      {
        heading: 'A small spacing scale in rem',
        code: {
          label: 'CSS variables',
          text: `:root {
  --space-1: 0.25rem;  /* 4px  */
  --space-2: 0.5rem;   /* 8px  */
  --space-3: 1rem;     /* 16px */
  --space-4: 1.5rem;   /* 24px */
  --space-5: 2rem;     /* 32px */
}`,
        },
        paragraphs: [
          'Defining spacing once as a scale keeps a layout consistent, and because the values are in rem the whole layout grows proportionally if a visitor increases their default text size.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is rem supported in all browsers?',
        answer:
          'Yes. rem has been supported by every current major browser for many years, so you can use it without a fallback.',
      },
      {
        question: 'Does browser zoom change rem values?',
        answer:
          'Zoom scales the whole page, including px values, so both px and rem layouts get bigger when you zoom. The difference is that a larger default font size set in browser settings changes rem values but does not change px values.',
      },
      {
        question: 'Why do vh units behave oddly on phones?',
        answer:
          'On mobile browsers the address bar can appear and disappear, changing the visible height. Newer units such as dvh (dynamic viewport height) follow the currently visible area and often work better for full-height layouts.',
      },
      {
        question: 'Should media queries use px, em or rem?',
        answer:
          'em or rem are better, because the breakpoints then follow the user\'s font size setting. In media queries these units are based on the browser default font size, not on the html element size you set in your CSS.',
      },
    ],
    sources: [
      { label: 'MDN: CSS values and units (length)', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length' },
      { label: 'MDN: clamp()', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/clamp' },
      { label: 'WCAG 2.2: Understanding Resize Text (1.4.4)', url: 'https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html' },
    ],
  },

  'markdown-cheat-sheet': {
    sections: [
      {
        heading: 'Common pitfalls when writing Markdown',
        list: [
          'No blank line before a list, table or code block. Many renderers will not recognise the structure unless it is separated from the paragraph above.',
          'Wrong indentation in nested lists or in code inside a list. Indent by a consistent two or four spaces, and check the preview.',
          'Underscores or asterisks inside words, such as snake_case_name, which some renderers may turn into italics. Wrap such text in backticks.',
          'A pipe character inside a table cell. Escape it as \\| or the cell is split in two.',
          'Expecting a single line break to start a new line. Add two trailing spaces, a backslash or a blank line.',
        ],
      },
      {
        heading: 'A simple structure for a README',
        orderedList: [
          'Project name and a one-sentence summary.',
          'How to install it.',
          'A minimal usage example in a fenced code block.',
          'A list of key features or options, perhaps as a table.',
          'How to contribute and how to report problems.',
          'The licence.',
        ],
      },
    ],
    faq: [
      {
        question: 'What is the difference between Markdown, CommonMark and GitHub Flavored Markdown?',
        answer:
          'Markdown was originally described informally, which led to different interpretations. CommonMark is a precise specification of the core syntax. GitHub Flavored Markdown (GFM) builds on CommonMark and adds tables, task lists, strikethrough and automatic links.',
      },
      {
        question: 'Can I use HTML inside Markdown?',
        answer:
          'Many renderers allow it, but some remove or restrict HTML for security. If your content must work everywhere, prefer plain Markdown syntax.',
      },
      {
        question: 'How do I add a table of contents?',
        answer:
          'Standard Markdown has no table of contents syntax. Many platforms generate one automatically from headings, or you can write a list of links to heading anchors by hand.',
      },
      {
        question: 'Are Mermaid diagrams part of Markdown?',
        answer:
          'No, they are an extension. A renderer that supports Mermaid turns a code block labelled mermaid into a diagram, while one that does not will show the text as ordinary code.',
      },
    ],
    sources: [
      { label: 'CommonMark specification', url: 'https://spec.commonmark.org/' },
      { label: 'GitHub Flavored Markdown specification', url: 'https://github.github.com/gfm/' },
      { label: 'Mermaid documentation', url: 'https://mermaid.js.org/' },
      { label: 'John Gruber: Markdown (original description)', url: 'https://daringfireball.net/projects/markdown/' },
    ],
  },

  'compress-images-for-web': {
    sections: [
      {
        heading: 'Serve different sizes with srcset',
        paragraphs: [
          'Even a well-compressed image is wasteful if a phone downloads the desktop version. The srcset and sizes attributes let the browser choose the best file for the screen:',
        ],
        code: {
          label: 'HTML',
          text: `<img
  src="photo-800.webp"
  srcset="photo-400.webp 400w, photo-800.webp 800w, photo-1600.webp 1600w"
  sizes="(max-width: 600px) 100vw, 800px"
  width="800" height="533"
  loading="lazy"
  alt="Describe what the picture shows">`,
        },
      },
      {
        heading: 'How much can you save?',
        paragraphs: [
          'A 4000 × 3000 photo has 12 million pixels. Resized to 1600 × 1200 it has about 1.9 million, which is only 16% of the original before any quality setting is applied. Add WebP at quality 80 and a typical photograph commonly ends up at a few hundred kilobytes instead of several megabytes. Exact numbers depend on the picture: smooth areas such as skies compress far better than detailed textures such as leaves or fabric.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is WebP safe to use?',
        answer:
          'Yes. WebP is supported by all current major browsers. If you must support a very old browser, you can serve a JPG fallback with the picture element.',
      },
      {
        question: 'Does compression remove EXIF data?',
        answer:
          'Re-encoding an image in the browser normally drops metadata such as camera model and GPS location. If you need to keep it, use a tool that preserves metadata, and check the result.',
      },
      {
        question: 'Should I use AVIF instead of WebP?',
        answer:
          'AVIF can produce smaller files, but it is slower to encode and not supported by quite as many tools. WebP is a good all-round default, and AVIF is worth considering for sites where every kilobyte counts.',
      },
      {
        question: 'How small should a hero image be?',
        answer:
          'There is no fixed rule, but as a guide, aim for a main image of a few hundred kilobytes at most on a typical page, and measure the effect on loading time instead of guessing.',
      },
    ],
    sources: [
      { label: 'web.dev: Largest Contentful Paint (LCP)', url: 'https://web.dev/articles/lcp' },
      { label: 'MDN: Image file type and format guide', url: 'https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types' },
      { label: 'Google Developers: WebP', url: 'https://developers.google.com/speed/webp' },
    ],
  },

  'qr-code-best-practices': {
    sections: [
      {
        heading: 'Versions and how much data fits',
        paragraphs: [
          'QR codes come in 40 versions. Version 1 is 21 × 21 modules, and each version adds four modules per side, so the size is 17 + 4 × version. The largest, version 40, is 177 × 177 modules. At the lowest error correction level (L), version 40 can hold up to 7,089 digits, 4,296 alphanumeric characters or 2,953 bytes. Higher error correction levels reduce these numbers, and every extra character makes the code denser, so shorter content scans more easily.',
        ],
      },
      {
        heading: 'Static and dynamic QR codes',
        paragraphs: [
          'A static code stores the content itself, such as the full URL. It never expires, needs no account and cannot be changed after printing. A dynamic code stores a short link to a redirect service, which can then point to any address you choose later and can count scans. The trade-off is that a dynamic code works only as long as the service and its link keep working, so printing one on something permanent depends on a third party.',
        ],
      },
    ],
    faq: [
      {
        question: 'Do QR codes expire?',
        answer:
          'A static code never expires, because it holds the content directly. A dynamic code stops working if the redirect service is shut down or the subscription ends.',
      },
      {
        question: 'Why does my code not scan when printed small?',
        answer:
          'Usually the modules are too small for the camera to separate, often because the code holds a long link. Shorten the link, enlarge the code, increase the contrast and keep the quiet zone clear.',
      },
      {
        question: 'Can I scan a QR code from a screen?',
        answer:
          'Yes, if the screen is bright, the code is large enough and there is no glare. Codes shown on screens are best exported as PNG at a size that is a whole multiple of the module size.',
      },
      {
        question: 'Is scanning a QR code safe?',
        answer:
          'Scanning itself is safe, but the content may lead to a harmful page. Check the address your phone shows before you open it, and be careful with codes on stickers placed over other codes.',
      },
    ],
    sources: [
      { label: 'ISO/IEC 18004: QR Code bar code symbology specification', url: 'https://www.iso.org/standard/62021.html' },
      { label: 'Denso Wave: About QR Code', url: 'https://www.qrcode.com/en/about/' },
    ],
  },

  'color-formats-hex-rgb-hsl': {
    sections: [
      {
        heading: 'Building a palette with HSL',
        paragraphs: [
          'Because HSL separates hue from lightness, a whole set of related colors can be made from one base color. Starting from the orange hsl(11 100% 60%):',
        ],
        list: [
          'A darker hover color: lower the lightness, hsl(11 100% 50%).',
          'A soft background tint: raise the lightness to hsl(11 100% 95%).',
          'A muted version: reduce saturation, hsl(11 40% 60%).',
          'A related accent: shift the hue by about 30 degrees, hsl(41 100% 60%).',
        ],
      },
      {
        heading: 'Contrast ratios in practice',
        paragraphs: [
          'Black text on a white background has the maximum ratio of 21:1. A mid-gray such as #767676 on white is about 4.5:1, which is roughly the lightest gray that still passes the AA level for body text. A lighter gray such as #999999 on white is only about 2.85:1 and fails. Check the pairs you actually use, including text over images and the dark-mode versions of your colors.',
        ],
      },
    ],
    faq: [
      {
        question: 'What is the difference between #FFF and #FFFFFF?',
        answer:
          'Nothing. The three-digit form repeats each digit, so #FFF means #FFFFFF (white) and #F53 means #FF5533.',
      },
      {
        question: 'What does the alpha value do?',
        answer:
          'Alpha sets opacity, from 0 (fully transparent) to 1 or 100% (fully opaque). It can be written in rgb(), hsl(), or as two extra hex digits, such as #FF573380 for about 50% opacity.',
      },
      {
        question: 'Are HSL and HSV the same?',
        answer:
          'No. They are different ways of organising the same colors. HSL uses lightness, where 50% is the pure color, while HSV (also called HSB) uses value or brightness, where 100% is the pure color. CSS uses HSL, many design tools show HSB.',
      },
      {
        question: 'Can CSS show colors outside the usual RGB range?',
        answer:
          'Yes. Newer CSS color spaces such as display-p3, oklch and oklab can describe a wider range of colors on supporting screens. They are useful for modern design systems, with a fallback for older browsers.',
      },
    ],
    sources: [
      { label: 'WCAG 2.2: Understanding Contrast (Minimum)', url: 'https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html' },
      { label: 'MDN: CSS color values', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value' },
      { label: 'W3C: CSS Color Module Level 4', url: 'https://www.w3.org/TR/css-color-4/' },
      { label: 'WebAIM: Contrast Checker', url: 'https://webaim.org/resources/contrastchecker/' },
    ],
  },
};
