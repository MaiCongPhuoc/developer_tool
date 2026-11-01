import type { Guide } from './types';

export const webSecurityGuides: Guide[] = [
  {
    slug: 'jwt-explained',
    title: 'JWT Explained: Structure, Claims, Signing and Common Pitfalls',
    description:
      'How a JSON Web Token is built (header, payload, signature), what the standard claims mean, how HS256 signing works and the security mistakes to avoid when you use JWTs.',
    readingMinutes: 7,
    tool: { path: '/encryption', label: 'JWT Encoder & Decoder' },
    intro: `A JSON Web Token (JWT) is a compact string that carries a few facts about a user or a session and proves that nobody changed them. It is used for login sessions, API access and service-to-service calls. Because a JWT looks like random characters, it is easy to misunderstand. This guide explains what is inside one, what the signature does and does not protect, and the mistakes that cause real security problems.`,
    sections: [
      {
        heading: 'The three parts',
        paragraphs: [
          'A JWT is three pieces separated by dots: header.payload.signature. The header and payload are JSON documents encoded with Base64URL, a variant of Base64 that uses - and _ instead of + and / and drops the = padding so the token is safe in URLs. Encoding is not encryption: anyone can decode the first two parts and read them.',
        ],
        code: {
          label: 'Decoded example',
          text: `Header:   { "alg": "HS256", "typ": "JWT" }
Payload:  { "sub": "1234567890", "name": "Lan",
            "iat": 1700000000, "exp": 1700003600 }
Signature: HMAC-SHA256(
  base64url(header) + "." + base64url(payload),
  secret
)`,
        },
      },
      {
        heading: 'The header',
        paragraphs: [
          'The header says how the token was signed. The alg field names the algorithm, for example HS256 (HMAC with SHA-256, using one shared secret) or RS256 (RSA signature, using a private key to sign and a public key to verify). The typ field is usually "JWT".',
        ],
      },
      {
        heading: 'The payload and its claims',
        paragraphs: [
          'The payload holds claims, which are statements about the subject. A few are registered by the standard and widely understood:',
        ],
        list: [
          'iss (issuer): who created the token.',
          'sub (subject): who the token is about, usually a user ID.',
          'aud (audience): who the token is meant for.',
          'exp (expiration time): the moment after which the token must be rejected.',
          'nbf (not before): the moment before which the token must be rejected.',
          'iat (issued at): when the token was created.',
          'jti (JWT ID): a unique identifier, useful for revocation lists.',
        ],
      },
      {
        heading: 'Dates are Unix timestamps',
        paragraphs: [
          'The exp, nbf and iat claims are numbers of seconds since 1 January 1970 UTC, not milliseconds. A common bug is generating them in milliseconds, which creates a token that appears to expire thousands of years in the future. When a token is rejected as expired, convert exp to a readable date and compare it with the server clock.',
        ],
      },
      {
        heading: 'What the signature does',
        paragraphs: [
          'The signature is computed over the encoded header and payload. If anyone changes a single character of either part, the signature no longer matches, so the receiver can detect tampering. With HS256, both the issuer and the verifier know the same secret. The secret must be long and random: the standard requires a key at least as long as the hash output, which is 256 bits (32 random bytes) for HS256.',
        ],
      },
      {
        heading: 'Decoding is not verifying',
        paragraphs: [
          'Reading the payload tells you nothing about whether the token is genuine. Your server must verify the signature with the expected key and algorithm, and then check exp, nbf, iss and aud, before trusting any claim. Decoding tools are for debugging. Production code must always verify.',
        ],
      },
      {
        heading: 'Common pitfalls',
        list: [
          'Putting secrets in the payload. A standard signed JWT is readable by anyone who holds it. Do not store passwords, card numbers or other sensitive data in it. If a payload must be confidential, use an encrypted token format (JWE) instead.',
          'Accepting the algorithm named in the token. Fix the algorithm on the server. Historically, libraries that trusted the alg header allowed "none" (no signature) or let attackers switch from RS256 to HS256 and sign with the public key.',
          'Weak or guessable HS256 secrets. A short secret can be brute-forced offline from a single captured token.',
          'Very long lifetimes. A JWT cannot be recalled before it expires unless you keep a deny list, so keep access tokens short, for example minutes, and renew them with a separate refresh token.',
          'Careless storage. Tokens stored where page scripts can read them are exposed if the site has a cross-site scripting bug. Prefer HttpOnly cookies where your architecture allows it.',
          'Skipping audience and issuer checks. A token that is valid for one service should not be accepted by another.',
        ],
      },
      {
        heading: 'When a JWT is a good fit',
        paragraphs: [
          'JWTs work well for stateless APIs and for passing short-lived, signed identity information between services. For a classic website with server-side sessions, an opaque session ID stored on the server is often simpler and easier to revoke. Choose the tool that matches how much state you want the server to keep.',
        ],
      },
    ],
  },
  {
    slug: 'uuid-versions-explained',
    title: 'UUID Versions Explained: v1, v4, v7 and Which One to Use',
    description:
      'What a UUID is, how versions 1, 4 and 7 differ, how unlikely a collision really is, and how to choose UUIDs for database keys without hurting performance.',
    readingMinutes: 6,
    tool: { path: '/uuid', label: 'UUID Generator' },
    intro: `A UUID (universally unique identifier) is a 128-bit value you can generate on any machine without asking a central server for a number, and still be almost certain that nobody else generated the same one. They are popular for database keys, request IDs and file names. The word "UUID" covers several versions that are made in very different ways, and the version you pick affects privacy and database performance.`,
    sections: [
      {
        heading: 'What a UUID looks like',
        paragraphs: [
          'A UUID is written as 32 hexadecimal digits in five groups separated by hyphens, in the pattern 8-4-4-4-12. For example: 3f2504e0-4f89-41d3-9a0c-0305e82c3301. The first digit of the third group is the version number (4 in this example), and the first digit of the fourth group encodes the variant. GUID is simply Microsoft\'s name for the same thing. Uppercase letters, missing hyphens or surrounding braces change only how it is written, not what it is.',
        ],
      },
      {
        heading: 'Version 1: time and machine',
        paragraphs: [
          'Version 1 combines a timestamp with a node identifier that is often based on the network card address. It is unique and roughly time-ordered, but it can leak when and on which machine an identifier was created, which is a privacy concern. It is rarely the right choice for new systems that expose identifiers publicly.',
        ],
      },
      {
        heading: 'Versions 3 and 5: names',
        paragraphs: [
          'Versions 3 and 5 are derived from a name and a namespace using a hash (MD5 and SHA-1 respectively). The same input always produces the same UUID, which is useful when you need a stable identifier for something that already has a name, such as a URL. They are not random.',
        ],
      },
      {
        heading: 'Version 4: random',
        paragraphs: [
          'Version 4 fills 122 of the 128 bits with random data; the rest hold the version and variant. It is the most widely used version because it needs no coordination and reveals nothing about the creator. Generating one in a browser is a single call to crypto.randomUUID(), which uses a secure random source.',
        ],
      },
      {
        heading: 'Version 7: time-ordered and random',
        paragraphs: [
          'Version 7, defined in RFC 9562 (2024), starts with a Unix timestamp in milliseconds followed by random bits. New values sort roughly in creation order, which is much friendlier to database indexes. The trade-off is that the creation time is visible in the identifier. If that matters for privacy, use version 4 for public identifiers.',
        ],
      },
      {
        heading: 'How likely is a collision?',
        paragraphs: [
          'With 122 random bits there are about 5.3 × 10^36 possible version 4 values. By the birthday paradox, you would need to generate around 2.7 × 10^18 UUIDs to reach a 50% chance of a single duplicate. At a billion per second that would take about 85 years. For practical purposes a collision from a correct random generator is not something to plan around. Problems almost always come from a poor random source, copied test data or buggy code, not from the maths.',
        ],
      },
      {
        heading: 'UUIDs as database keys',
        list: [
          'Random version 4 keys are inserted at random positions in a B-tree index. On large tables this causes more page splits and cache misses than a steadily increasing key.',
          'Time-ordered values (version 7, or similar schemes) keep new rows near each other in the index and usually perform better as primary keys.',
          'Store UUIDs in a compact native type where available (for example the uuid type in PostgreSQL, or BINARY(16) in MySQL) rather than as a 36-character string. It halves the space and speeds up comparisons.',
        ],
      },
      {
        heading: 'What UUIDs are not',
        paragraphs: [
          'A UUID is an identifier, not a secret. Do not use one as a password, an API key or a reset token unless you are sure it comes from a cryptographically secure source and you treat it as a secret. For passwords, use a password generator with a proper length and character mix.',
        ],
      },
      {
        heading: 'Quick recommendation',
        orderedList: [
          'Need an ID that must not reveal anything and is exposed publicly? Use version 4.',
          'Need a database primary key on a large, busy table? Prefer version 7.',
          'Need the same ID from the same input every time? Use version 5.',
          'Avoid version 1 for new public-facing systems.',
        ],
      },
    ],
  },
  {
    slug: 'strong-password-guide',
    title: 'What Makes a Password Strong: Length, Randomness and Entropy',
    description:
      'A plain-language guide to password strength: why length beats complexity, how entropy is calculated, how to use passphrases and managers, and what current NIST guidance says.',
    readingMinutes: 6,
    tool: { path: '/password-generator', label: 'Password Generator' },
    intro: `Most password advice is a list of rules: add a capital letter, a number and a symbol. The rules often produce passwords that are hard to remember but still easy to guess, like "P@ssw0rd1!". Strength really comes from two things: how long the password is, and how unpredictable it is. This guide shows how to measure that and what to do in practice.`,
    sections: [
      {
        heading: 'Entropy: measuring unpredictability',
        paragraphs: [
          'Entropy, measured in bits, describes how many guesses an attacker would need. For a password made of randomly chosen characters, it is the length multiplied by log2 of the number of possible characters. Every extra bit doubles the work. The key word is randomly: a password a human invents is far weaker than the same length chosen by a generator.',
        ],
        code: {
          label: 'Examples (random characters)',
          text: `8 lowercase letters      8 × log2(26) ≈ 38 bits
12 letters, digits, symbols   12 × log2(94) ≈ 79 bits
16 letters, digits, symbols   16 × log2(94) ≈ 105 bits
20 lowercase letters     20 × log2(26) ≈ 94 bits`,
        },
      },
      {
        heading: 'Length beats complexity',
        paragraphs: [
          'The last line above is worth noticing: 20 random lowercase letters are stronger than 12 random characters from the full keyboard. Adding length is the cheapest way to add entropy, and long passwords are not harder for software to handle. Symbols and capitals help, but only when they are chosen randomly rather than in predictable places, such as a capital at the start and a number at the end.',
        ],
      },
      {
        heading: 'Why predictable patterns fail',
        paragraphs: [
          'Attackers do not try every combination in order. They try common passwords, dictionary words, names, dates and common substitutions (a→@, o→0) first, and they run these against stolen password databases at enormous speed. A password that follows a pattern gives the attacker a huge shortcut, no matter how many character types it contains.',
        ],
      },
      {
        heading: 'Passphrases',
        paragraphs: [
          'A passphrase is several random words, such as four to six words picked by a generator from a list of thousands. If a list has 7,776 words, each random word adds about 12.9 bits, so six words give roughly 77 bits. Passphrases are easier to type and remember than a random string, which makes them a good choice for the few secrets you must remember, such as the master password of a password manager. The words must be chosen randomly, not picked by you from a favourite quote.',
        ],
      },
      {
        heading: 'One password per site',
        paragraphs: [
          'The most damaging habit is reusing a password. When one site is breached, attackers try the same email and password on other services. Use a different, random password for every account and let a password manager remember them. A manager is also protection against phishing, because it will not fill a password on a look-alike domain.',
        ],
      },
      {
        heading: 'Add a second factor',
        paragraphs: [
          'Even a strong password can be phished or leaked. Turn on two-factor authentication for important accounts such as email, banking and cloud services. Passkeys and hardware security keys are the most resistant to phishing, followed by authenticator-app codes. SMS codes are better than nothing but weaker.',
        ],
      },
      {
        heading: 'What current guidance says',
        paragraphs: [
          'The US standards body NIST, in its digital identity guidelines (SP 800-63B), recommends favouring length, allowing long passwords and passphrases, and checking new passwords against lists of known breached or common passwords. It advises against forced composition rules and against forcing regular password changes without a reason, because those habits push people toward weak, predictable passwords.',
        ],
      },
      {
        heading: 'How a good generator works',
        list: [
          'It uses a cryptographically secure random source, such as the browser crypto.getRandomValues, never Math.random, which is not designed for security.',
          'It picks each character independently and without bias.',
          'It runs on your device, so the password is not sent anywhere.',
          'It lets you choose a long length (16 characters or more) and the character types the website accepts.',
        ],
      },
      {
        heading: 'A practical checklist',
        orderedList: [
          'Use a password manager and generate a random password of 16+ characters for every account.',
          'Use a random passphrase of 5–6 words for the manager itself and your device login.',
          'Enable two-factor authentication or passkeys on important accounts.',
          'Change a password if a service reports a breach, not on a fixed timer.',
        ],
      },
    ],
  },
];
