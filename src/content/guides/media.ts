import type { Guide } from './types';

export const mediaGuides: Guide[] = [
  {
    slug: 'compress-images-for-web',
    title: 'How to Compress Images for the Web Without Visible Quality Loss',
    description:
      'A practical guide to reducing image file size: choosing between JPG, PNG and WebP, picking a quality level, resizing correctly and avoiding common compression mistakes.',
    readingMinutes: 6,
    tool: { path: '/image-compressor', label: 'Image Compressor' },
    intro: `Images are usually the heaviest part of a web page. Large files slow loading, use visitors' mobile data and hurt the metrics that search engines measure. The good news is that most photos can be made several times smaller with no difference a viewer would notice. The trick is to resize first, pick the right format, and then choose a sensible quality level.`,
    sections: [
      {
        heading: 'Why image size matters',
        paragraphs: [
          'The largest image on a page is often the largest element a visitor waits for, so it directly affects the Largest Contentful Paint (LCP) measurement used in Core Web Vitals. A smaller file also saves bandwidth for people on slow or metered connections and reduces your hosting costs.',
        ],
      },
      {
        heading: 'Lossy and lossless compression',
        paragraphs: [
          'Lossless compression makes a file smaller without changing a single pixel, but the savings are modest. Lossy compression throws away detail that the eye is unlikely to notice, and can reduce a photo to a fraction of its original size. Each lossy save loses a little more, so keep the original file and compress from it, instead of re-compressing a file that is already compressed.',
        ],
      },
      {
        heading: 'Choosing the right format',
        list: [
          'JPG is a lossy format designed for photographs. It has no transparency. It is a safe, universally supported choice.',
          'PNG is lossless and supports transparency. It is ideal for logos, icons, screenshots and graphics with flat colours and sharp edges, but files of photographs are large.',
          'WebP supports both lossy and lossless modes and transparency, and usually produces smaller files than JPG or PNG at similar visual quality. It is supported by all current major browsers, so it is a good default for web images.',
          'AVIF can be smaller still, but encoding is slower and tool support is less universal. Consider it once you have the basics in place.',
        ],
      },
      {
        heading: 'Resize before you compress',
        paragraphs: [
          'A photo straight from a phone camera can be 4,000 pixels wide, while it is displayed in a column 800 pixels wide. The browser downloads every unused pixel. A good rule is to export at the largest size at which the image is displayed, multiplied by two for high-density screens. Resizing from 4,000 to 1,600 pixels wide reduces the pixel count by more than 80% before any quality setting is applied.',
        ],
      },
      {
        heading: 'Choosing a quality level',
        paragraphs: [
          'For JPG and lossy WebP, a quality setting between about 70 and 85 usually looks the same as the original at normal viewing size, while saving a large share of the file size. Going above 90 increases the size a lot for almost no visible gain. Going below 60 starts to show blocky artefacts around edges and in smooth gradients such as skies. Always look at the result at 100% zoom, on the areas with the most detail, before you accept it.',
        ],
      },
      {
        heading: 'What not to do',
        list: [
          'Do not save screenshots with text, or logos, as lossy JPG. Fuzzy halos appear around the letters. Use PNG or lossless WebP instead.',
          'Do not scale a small image up. It will be blurry and the file will not be smaller.',
          'Do not convert a JPG to PNG expecting better quality. The detail already lost cannot be recovered, and the file will be larger.',
          'Do not compress the same file repeatedly. Quality drops each time.',
        ],
      },
      {
        heading: 'Metadata and privacy',
        paragraphs: [
          'Photos often contain EXIF metadata such as camera model, date and sometimes GPS coordinates. Re-encoding an image in the browser typically drops this data, which reduces the file size slightly and prevents you from publishing the location where a photo was taken by accident.',
        ],
      },
      {
        heading: 'Compressing in your browser',
        paragraphs: [
          'A browser-based compressor decodes the image, redraws it at the chosen size and saves it again in the format and quality you select. Because everything happens on your device, the picture is never uploaded to a server, which is convenient for private photos and documents.',
        ],
      },
      {
        heading: 'A simple workflow',
        orderedList: [
          'Keep the original file safe.',
          'Resize to the largest display size (times two for sharp screens).',
          'Choose WebP or JPG for photos and PNG or lossless WebP for graphics.',
          'Start at quality 75–80 and check the result at 100% zoom.',
          'Aim for a main image well under a few hundred kilobytes, and set width and height attributes in your HTML so the page does not jump while loading.',
        ],
      },
    ],
  },
  {
    slug: 'qr-code-best-practices',
    title: 'QR Code Best Practices: Size, Contrast, Error Correction and Testing',
    description:
      'How QR codes work and how to make ones that scan reliably: error correction levels, quiet zone, contrast, minimum print size, shortening data, formats and safety.',
    readingMinutes: 5,
    tool: { path: '/qr-code', label: 'QR Code Generator' },
    intro: `A QR code that will not scan wastes the effort of printing it. Most failures come from a few avoidable problems: too much data, low contrast, a missing margin or a code printed too small. This guide explains how a QR code stores information and the practical rules that make it scan on the first try, on any phone.`,
    sections: [
      {
        heading: 'How a QR code stores data',
        paragraphs: [
          'A QR code is a square grid of dark and light modules (the small squares). The three large squares in the corners let a scanner find the code and its orientation. The data is protected by error correction (Reed–Solomon codes), which lets the code still be read when part of it is dirty, damaged or covered. There are 40 sizes (versions), from 21×21 modules up to 177×177, and the more text you encode, the denser and larger the grid becomes.',
        ],
      },
      {
        heading: 'Error correction levels',
        paragraphs: [
          'You choose how much of the code can be lost and still be recoverable. Higher levels are more robust but add more modules, making the code denser:',
        ],
        list: [
          'L (low): recovers about 7% of the code.',
          'M (medium): about 15%. A good default for most uses.',
          'Q (quartile): about 25%.',
          'H (high): about 30%. Use it when a logo will cover the centre or the code may be scratched or printed on rough surfaces.',
        ],
      },
      {
        heading: 'Keep the content short',
        paragraphs: [
          'A shorter URL makes a simpler, bigger-module code that scans faster from farther away. Remove tracking parameters you do not need, prefer a short path on your own domain and use https. A very long link produces a dense code that cheap cameras struggle with.',
        ],
      },
      {
        heading: 'Contrast and colours',
        list: [
          'Use dark modules on a light background. Black on white is the most reliable.',
          'Avoid light-on-dark (inverted) codes unless you have tested them. Some scanners cannot read them.',
          'Coloured codes are fine when the contrast is strong. Two similar mid-tones are not.',
        ],
      },
      {
        heading: 'The quiet zone',
        paragraphs: [
          'Leave an empty margin around the code, at least four modules wide. Text, borders or images touching the code confuse the scanner. When you place a QR code on a coloured background, put it on a white block with that margin.',
        ],
      },
      {
        heading: 'Size and distance',
        paragraphs: [
          'As a rule of thumb, the scanning distance should be no more than about ten times the width of the code. A code 2 cm wide scans comfortably from about 20 cm, which suits a business card. A poster viewed from 3 metres needs a code at least 30 cm wide. As a general minimum, avoid printing codes smaller than about 2 × 2 cm.',
        ],
      },
      {
        heading: 'Adding a logo',
        paragraphs: [
          'A logo in the middle hides modules, so use error correction level Q or H, keep the logo small (well under a quarter of the code area) and test with several phones. If a code has to be perfectly reliable, skip the logo.',
        ],
      },
      {
        heading: 'PNG or SVG?',
        paragraphs: [
          'PNG is a pixel image that suits screens and documents, but it blurs if scaled up. SVG is a vector format that stays sharp at any size, so it is the better choice for print, signage and packaging. Whichever you choose, export it at a size that is a whole multiple of the module size to avoid blurry edges.',
        ],
      },
      {
        heading: 'What you can encode',
        list: [
          'A web link (URL) or plain text.',
          'A Wi-Fi login in the format WIFI:T:WPA;S:NetworkName;P:Password;;',
          'A phone number (tel:+84...), an email (mailto:), an SMS or contact details (vCard).',
        ],
      },
      {
        heading: 'Test and stay safe',
        orderedList: [
          'Scan the code with at least two different phones (one older) and with the built-in camera app, not only a dedicated scanner.',
          'Test at the real size and distance, on the real material, in typical lighting.',
          'Check that the link opens the right page over a mobile connection.',
          'As a user, remember that a QR code can hide a malicious link. Look at the address your phone shows before you open it, especially on stickers placed over other codes.',
        ],
      },
    ],
  },
  {
    slug: 'color-formats-hex-rgb-hsl',
    title: 'Color Formats Explained: HEX, RGB and HSL (with Conversions)',
    description:
      'How HEX, RGB and HSL describe color, how to convert between them, when each is easiest to use, and how to check contrast for accessible text.',
    readingMinutes: 5,
    tool: { path: '/color-picker', label: 'Color Picker' },
    intro: `The same color can be written in several ways, and designers and developers move between them all day. HEX is compact, RGB matches how screens mix light, and HSL is the easiest to reason about when you want a lighter or a more muted version. This guide explains each format, shows a worked conversion and finishes with the contrast rules that keep text readable.`,
    sections: [
      {
        heading: 'RGB: mixing light',
        paragraphs: [
          'Screens create color by mixing red, green and blue light. RGB writes the amount of each channel from 0 (none) to 255 (full). In CSS: rgb(255 87 51), or the older comma form rgb(255, 87, 51). Black is rgb(0 0 0), white is rgb(255 255 255) and pure red is rgb(255 0 0). Adding an alpha value sets transparency: rgb(255 87 51 / 50%).',
        ],
      },
      {
        heading: 'HEX: RGB in base 16',
        paragraphs: [
          'A HEX color is the same three channel values written in hexadecimal, two digits each, after a # sign: #RRGGBB. Each pair runs from 00 (0) to FF (255). So #FF5733 means red FF = 255, green 57 = 87 and blue 33 = 51, exactly the RGB color above. A three-digit shorthand such as #F53 doubles each digit (it means #FF5533), and an eight-digit form #RRGGBBAA adds alpha at the end.',
        ],
      },
      {
        heading: 'HSL: hue, saturation, lightness',
        paragraphs: [
          'HSL describes a color the way people think about it. Hue is the position on the color wheel in degrees (0 red, 120 green, 240 blue). Saturation is how vivid it is, from 0% (gray) to 100% (full color). Lightness runs from 0% (black) through 50% (the pure color) to 100% (white). The orange above is hsl(11 100% 60%).',
        ],
      },
      {
        heading: 'A worked conversion',
        code: {
          label: '#FF5733 to RGB and HSL',
          text: `#FF5733
R = FF = 255, G = 57 = 87, B = 33 = 51
rgb(255 87 51)

Lightness  = (max + min) / 2 = (1.00 + 0.20) / 2 = 60%
Saturation = (max - min) / (1 - |2L - 1|) = 0.80 / 0.80 = 100%
Hue        ≈ 60 × (G - B) / (max - min) ≈ 11 degrees
hsl(11 100% 60%)`,
        },
      },
      {
        heading: 'Which format when',
        list: [
          'HEX: compact and universal in design tools and style sheets. Good for copying and pasting a single fixed color.',
          'RGB: handy when you compute colors in code or need transparency in a simple form.',
          'HSL: best for creating variations. To make a hover state, keep the hue and change lightness by 5–10 points. To make a muted version, lower saturation. To build a palette, keep saturation and lightness steady and rotate the hue.',
        ],
      },
      {
        heading: 'Picking a color from an image',
        paragraphs: [
          'An eyedropper reads the color of one pixel. In photographs and gradients, neighbouring pixels differ slightly because of lighting and compression, so sample a few places or an area that is a flat color. Remember that a color on screen can look different on another display or after printing, because of color profiles and hardware differences.',
        ],
      },
      {
        heading: 'Contrast and accessibility',
        paragraphs: [
          'Readable text needs enough contrast against its background. The Web Content Accessibility Guidelines (WCAG) define a contrast ratio from 1:1 (no contrast) to 21:1 (black on white). For normal body text, the AA level asks for at least 4.5:1, and for large text (about 24 px, or 19 px bold) at least 3:1. The stricter AAA level asks for 7:1 for body text. Light gray text on white and many pastel combinations fail these checks.',
        ],
      },
      {
        heading: 'Do not rely on color alone',
        paragraphs: [
          'Around one in twelve men and a smaller share of women have some form of color vision deficiency. Do not use color as the only way to show an error, a required field or a chart category. Add an icon, a label or a pattern as well.',
        ],
      },
      {
        heading: 'Practical tips',
        orderedList: [
          'Store brand colors once, as CSS variables, and reuse them.',
          'Keep a neutral base, one or two accent colors and use them sparingly.',
          'Check the contrast of every text and background pair, including the dark mode version.',
          'Prefer HSL when you need lighter or darker variations of the same color.',
        ],
      },
    ],
  },
];
