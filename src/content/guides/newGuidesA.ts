import type { Guide } from './types';

export const newGuidesA: Guide[] = [
  {
    slug: 'base64-encoding-explained',
    title: 'Base64 Encoding Explained: How It Works and When to Use It',
    description:
      'What Base64 is, how three bytes become four characters, why it adds about 33% to the size, how Base64URL differs, and why Base64 is encoding and not encryption.',
    readingMinutes: 6,
    tool: { path: '/encryption', label: 'JWT Encoder & Decoder' },
    intro: `Base64 appears in more places than most developers notice: email attachments, images embedded in web pages, HTTP login headers and the three parts of every JSON Web Token. It is a simple idea, a way to write any binary data using only 64 safe, printable characters, and it is often misunderstood as a way to protect data. This guide explains how it works, what it is for, and where it goes wrong.`,
    sections: [
      {
        heading: 'What problem Base64 solves',
        paragraphs: [
          'Many channels were designed for text, not for arbitrary bytes. Email bodies, JSON documents, URLs and HTML attributes can break if they contain raw binary values, such as line breaks, null bytes or characters the system treats as special. Base64 turns any sequence of bytes into a string made only of letters, digits and a couple of symbols, which passes safely through those channels, and it can be turned back into the exact original bytes at the other end.',
        ],
      },
      {
        heading: 'How it works',
        paragraphs: [
          'Base64 reads the input three bytes (24 bits) at a time and splits them into four groups of six bits. Each six-bit value, from 0 to 63, is mapped to one character of a 64-character alphabet: A to Z, a to z, 0 to 9, plus the symbols + and /. Three bytes therefore become four characters.',
          'When the input length is not a multiple of three, the last group is padded with the = character so that the output length is always a multiple of four. Here are the classic examples:',
        ],
        code: {
          label: 'Examples',
          text: `"Man"  ->  TWFu      (3 bytes, no padding)
"Ma"   ->  TWE=      (2 bytes, one =)
"M"    ->  TQ==      (1 byte, two =)`,
        },
      },
      {
        heading: 'The size cost',
        paragraphs: [
          'Four characters for every three bytes means the output is about one third larger than the input (a factor of 4/3). Some formats, such as email, also insert line breaks every 76 characters, which adds a little more. This overhead is the reason not to use Base64 for large files when a binary transfer is possible, and the reason a page with many large inline images can load more slowly than one that links to image files.',
        ],
      },
      {
        heading: 'Base64URL: the URL-safe variant',
        paragraphs: [
          'The standard alphabet contains + and /, which have special meanings in URLs and file names, and the padding character = is reserved in query strings. The Base64URL variant, defined in the same standard, replaces + with - and / with _, and usually omits the padding. JSON Web Tokens use Base64URL for their header, payload and signature, which is why a JWT can travel safely in a URL or an HTTP header.',
        ],
      },
      {
        heading: 'Where you will meet Base64',
        list: [
          'Data URIs, for example data:image/png;base64,iVBOR..., which embed a small image directly in HTML or CSS.',
          'Email attachments (MIME), where binary files are sent as Base64 text.',
          'HTTP Basic authentication. The header Authorization: Basic followed by the Base64 of "username:password" is only encoded, not protected, so it must always travel over HTTPS.',
          'JSON Web Tokens and many other web tokens.',
          'Storing or sending a small amount of binary data, such as a key or a thumbnail, inside a JSON document.',
        ],
      },
      {
        heading: 'Base64 is not encryption',
        paragraphs: [
          'Anyone can decode Base64 instantly, with no key, because the alphabet and the method are public. It hides nothing. Seeing a string that looks like random letters and ending in = does not mean the content is protected. If data must stay confidential, use real encryption. If you only need to prove it was not changed, use a signature or an HMAC. Never store passwords or secrets in Base64.',
        ],
      },
      {
        heading: 'A common bug with Unicode text',
        paragraphs: [
          'The browser function btoa() works on strings whose characters are all in the Latin-1 range, so it throws an error for text such as "xin chào" with accents outside that range or for emoji. Convert the text to UTF-8 bytes first, then encode those bytes:',
        ],
        code: {
          label: 'JavaScript',
          text: `const bytes = new TextEncoder().encode("xin chào");
const base64 = btoa(String.fromCharCode(...bytes));

// Node.js
Buffer.from("xin chào", "utf8").toString("base64");`,
        },
      },
      {
        heading: 'Quick rules',
        orderedList: [
          'Use Base64 to carry bytes through text-only channels, not to protect them.',
          'Use the URL-safe variant for anything that goes into a URL, a file name or a cookie.',
          'Convert text to UTF-8 bytes before encoding, and decode back to bytes before reading as text.',
          'Do not Base64 large files when you can send them as binary.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is Base64 secure?',
        answer:
          'No. It is a reversible encoding that anyone can undo without a key. Use encryption to keep data secret.',
      },
      {
        question: 'Why does Base64 sometimes end with = or ==?',
        answer:
          'The = signs are padding. They make the output length a multiple of four characters when the input length is not a multiple of three bytes. Some systems, including JWT, omit the padding.',
      },
      {
        question: 'Why is Base64 output larger than the input?',
        answer:
          'Each group of three bytes becomes four characters, so the result is about 33% longer, before any line breaks.',
      },
      {
        question: 'What is the difference between Base64 and Base64URL?',
        answer:
          'Base64URL swaps + for - and / for _, and normally drops the = padding, so the result can be used safely in URLs and file names.',
      },
    ],
    sources: [
      { label: 'RFC 4648: The Base16, Base32, and Base64 Data Encodings', url: 'https://www.rfc-editor.org/rfc/rfc4648' },
      { label: 'MDN: Base64 (glossary)', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Base64' },
      { label: 'MDN: btoa()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/btoa' },
    ],
  },
  {
    slug: 'url-encoding-explained',
    title: 'URL Encoding (Percent-Encoding) Explained with Examples',
    description:
      'How percent-encoding works, which characters are reserved, the difference between encodeURI and encodeURIComponent, why spaces become %20 or +, and how to avoid double encoding.',
    readingMinutes: 6,
    tool: { path: '/qr-code', label: 'QR Code Generator' },
    intro: `A URL can contain only a limited set of characters. Anything else, including spaces, accented letters and characters that have a special job in a URL, has to be written in a safe form called percent-encoding. Getting it wrong produces broken links, lost query parameters and, in the worst case, security bugs. This guide explains the rules and the usual mistakes.`,
    sections: [
      {
        heading: 'What percent-encoding is',
        paragraphs: [
          'Percent-encoding replaces a byte with a percent sign followed by two hexadecimal digits. A space is the byte 0x20, so it becomes %20. Characters outside basic ASCII are first converted to bytes using UTF-8 and each byte is then encoded. For example, the Vietnamese letter "ế" is three bytes in UTF-8 (E1 BA BF), so it becomes %E1%BA%BF.',
        ],
      },
      {
        heading: 'Unreserved and reserved characters',
        paragraphs: [
          'The URL standard (RFC 3986) divides characters into groups:',
        ],
        list: [
          'Unreserved characters never need encoding: letters A to Z and a to z, digits 0 to 9, and the symbols - . _ ~',
          'Reserved characters have a special meaning as separators: : / ? # [ ] @ and ! $ & \' ( ) * + , ; =',
          'Everything else, including spaces, quotes, non-ASCII letters and control characters, must be percent-encoded.',
        ],
      },
      {
        heading: 'The context matters',
        paragraphs: [
          'A reserved character is left alone when it is doing its separating job, and must be encoded when it is part of the data. The ? that starts a query string stays as it is. A question mark inside a search term must become %3F. Likewise & separates parameters, so an ampersand inside a value must be written %26, and a literal # inside a value must be %23, or the browser treats everything after it as a fragment.',
        ],
      },
      {
        heading: 'encodeURI versus encodeURIComponent',
        paragraphs: [
          'JavaScript has two functions, and choosing the wrong one is a frequent bug. encodeURI encodes a whole URL and deliberately leaves reserved characters such as : / ? # & = alone, so the address keeps its structure. encodeURIComponent encodes a single piece of data (a parameter value, for example) and encodes those reserved characters too. Use encodeURIComponent for values you insert into a URL.',
        ],
        code: {
          label: 'JavaScript',
          text: `encodeURIComponent("a b&c=d")   // "a%20b%26c%3Dd"
encodeURIComponent("ế")         // "%E1%BA%BF"

// Safer: let the platform build the query string
new URLSearchParams({ q: "a b&c" }).toString()   // "q=a+b%26c"`,
        },
      },
      {
        heading: 'Space: %20 or +?',
        paragraphs: [
          'In a URL path, a space is %20. In the query string of an HTML form submission (the application/x-www-form-urlencoded format) a space may be written as +. Both are understood by servers in a query string, but a + in a path is a literal plus sign. URLSearchParams uses +, while encodeURIComponent uses %20. If you mix them up you may see plus signs where spaces should be, or the reverse.',
        ],
      },
      {
        heading: 'Double encoding',
        paragraphs: [
          'Encoding a string that is already encoded turns % into %25, so %20 becomes %2520 and the server sees a literal "%20" instead of a space. It usually happens when several layers of code each "helpfully" encode the value. Encode exactly once, at the point where you build the URL, and decode exactly once when you read it.',
        ],
      },
      {
        heading: 'Security angle',
        paragraphs: [
          'Never put untrusted text into a URL without encoding it, and never trust a decoded value. Attackers use encoding tricks to slip characters past filters, for example %2e%2e%2f for ../ in path traversal, or %0d%0a to inject line breaks into headers. Decode first, then validate. Also check that redirect targets taken from a URL parameter point only to places you allow.',
        ],
      },
      {
        heading: 'URLs in QR codes',
        paragraphs: [
          'A QR code stores the exact text you give it. If the link contains spaces or special characters that are not encoded, many scanners and browsers will fix it in different ways, or fail. Encode the link first, and keep it short, because each additional character makes the code denser and harder to scan.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is percent-encoding the same as encryption?',
        answer:
          'No. It is a reversible way of writing characters so that a URL stays valid. It offers no confidentiality.',
      },
      {
        question: 'Do I need to encode the slashes in a path?',
        answer:
          'Slashes that separate path segments stay as they are. A slash that is part of a single segment\'s data, for example an ID that contains one, must be encoded as %2F.',
      },
      {
        question: 'Why did my link break after a # sign?',
        answer:
          'In a URL, # starts the fragment, which is never sent to the server. If a # is part of your data, encode it as %23.',
      },
      {
        question: 'How do I decode a percent-encoded string?',
        answer:
          'Use decodeURIComponent() in JavaScript or the equivalent function in your language, and decode only once. Be ready to handle an error if the input contains an invalid sequence.',
      },
    ],
    sources: [
      { label: 'RFC 3986: Uniform Resource Identifier (URI): Generic Syntax', url: 'https://www.rfc-editor.org/rfc/rfc3986' },
      { label: 'WHATWG URL Standard', url: 'https://url.spec.whatwg.org/' },
      { label: 'MDN: encodeURIComponent()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent' },
      { label: 'MDN: URLSearchParams', url: 'https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams' },
    ],
  },
  {
    slug: 'hashing-vs-encoding-vs-encryption',
    title: 'Hashing vs Encoding vs Encryption: What Is the Difference?',
    description:
      'A clear comparison of encoding, hashing, HMAC and encryption: what each is for, whether it can be reversed, which keys are involved, and which one to use for passwords, integrity and secrecy.',
    readingMinutes: 7,
    tool: { path: '/encryption', label: 'JWT Encoder & Decoder' },
    intro: `Encoding, hashing and encryption are often mixed up, and the mix-up leads to real vulnerabilities, such as "encrypting" passwords with Base64 or storing them with a fast hash. They solve different problems. This guide gives you a simple way to tell them apart and to choose the right one.`,
    sections: [
      {
        heading: 'Encoding: changing the format',
        paragraphs: [
          'Encoding transforms data into another representation so that it can be stored or transmitted correctly. It is public, reversible and uses no secret. Examples are Base64, URL percent-encoding, UTF-8 and HTML entities. Encoding provides no security at all. Its goal is compatibility.',
        ],
      },
      {
        heading: 'Encryption: keeping data secret',
        paragraphs: [
          'Encryption scrambles data using a key so that only someone with the right key can read it. It is reversible, but only with the key. Symmetric encryption, such as AES, uses the same key to encrypt and decrypt. Asymmetric encryption, such as RSA and elliptic-curve schemes, uses a public key to encrypt and a private key to decrypt. Use authenticated modes such as AES-GCM or ChaCha20-Poly1305, which also detect tampering, rather than older modes that only hide data.',
        ],
      },
      {
        heading: 'Hashing: a fingerprint',
        paragraphs: [
          'A hash function turns any input into a fixed-size value (the digest). It is designed to be one way: you cannot work backwards from the digest to the input. The same input always gives the same digest, and a tiny change to the input changes the digest completely. For example, the SHA-256 hash of the text "hello" is:',
        ],
        code: {
          label: 'SHA-256 of "hello"',
          text: `2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824`,
        },
      },
      {
        heading: 'What hashes are used for',
        list: [
          'Integrity: compare the hash of a downloaded file with the published hash to check it was not altered.',
          'Identification: content-addressed storage and caches use hashes as keys.',
          'Passwords, but only with special slow hash functions (see below).',
        ],
        paragraphs: [
          'Not every hash function is still safe. MD5 and SHA-1 have known collision attacks, so they should not be used for security purposes. SHA-256 and the other members of the SHA-2 and SHA-3 families are the common choices today.',
        ],
      },
      {
        heading: 'HMAC and signatures: proving who made it',
        paragraphs: [
          'A plain hash can be recomputed by anyone, so it cannot prove who created the data. An HMAC combines a hash function with a secret key, so only someone who knows the key can produce or check the value. This is how the HS256 signature in a JSON Web Token works. A digital signature (RSA, ECDSA, Ed25519) does the same job with a key pair: it is created with a private key and checked with a public key, so anyone can verify it and only the owner can produce it.',
        ],
      },
      {
        heading: 'Passwords need special treatment',
        paragraphs: [
          'Fast hashes such as SHA-256 let an attacker who steals your database test billions of guesses per second. Passwords should be stored with a purpose-built, deliberately slow and memory-hungry function such as Argon2id, scrypt or bcrypt, together with a unique random salt for each password. The salt makes identical passwords produce different hashes and defeats precomputed tables. You never need to be able to recover a password, so you never decrypt it: you hash the attempt and compare.',
        ],
      },
      {
        heading: 'At a glance',
        list: [
          'Encoding: reversible, no key, goal is format compatibility (Base64, URL encoding).',
          'Encryption: reversible with a key, goal is confidentiality (AES-GCM, RSA).',
          'Hashing: one way, no key, goal is a fingerprint or integrity check (SHA-256).',
          'Password hashing: one way, slow and salted, goal is safe password storage (Argon2id, bcrypt).',
          'HMAC and signatures: need a key, goal is authenticity and integrity (HS256, Ed25519).',
        ],
      },
      {
        heading: 'Common mistakes',
        list: [
          'Treating Base64 as encryption.',
          'Storing passwords with MD5, SHA-1 or a single round of SHA-256.',
          'Inventing your own encryption scheme instead of using a proven library.',
          'Reusing a nonce or IV with the same key in a mode that forbids it.',
          'Encrypting data but never checking that it was not modified, which is why authenticated modes are preferred.',
        ],
      },
    ],
    faq: [
      {
        question: 'Can a hash be reversed?',
        answer:
          'Not directly. But a short or common input can be found by guessing: an attacker hashes many candidate inputs and looks for a match. That is why passwords need slow hashes and salts, and why strong, long passwords matter.',
      },
      {
        question: 'Is SHA-256 encryption?',
        answer:
          'No. It is a hash function. It produces a fixed-size fingerprint and cannot be decrypted, because there is nothing to decrypt.',
      },
      {
        question: 'What is a salt?',
        answer:
          'A random value stored alongside each password hash and mixed into it. It ensures that two users with the same password get different hashes.',
      },
      {
        question: 'Which should I use to check a downloaded file?',
        answer:
          'Compare a SHA-256 hash of the file with the one published by the source over a trusted channel. A digital signature gives stronger assurance of who published it.',
      },
    ],
    sources: [
      { label: 'NIST FIPS 180-4: Secure Hash Standard (SHS)', url: 'https://csrc.nist.gov/pubs/fips/180-4/upd1/final' },
      { label: 'RFC 2104: HMAC: Keyed-Hashing for Message Authentication', url: 'https://www.rfc-editor.org/rfc/rfc2104' },
      { label: 'RFC 9106: Argon2 Memory-Hard Function', url: 'https://www.rfc-editor.org/rfc/rfc9106' },
      { label: 'OWASP: Password Storage Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html' },
      { label: 'OWASP: Cryptographic Storage Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html' },
    ],
  },
];
