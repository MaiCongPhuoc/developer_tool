// Giới hạn độ dài markdown - việc parse+render chạy lại trên MỖI phím gõ
// (real-time preview), văn bản quá dài sẽ khiến việc gõ bị giật/lag. 100.000
// ký tự vẫn đủ rộng rãi cho tài liệu README/blog post thông thường.
export const MAX_MARKDOWN_LENGTH = 100000;

// Số ký tự "đánh dấu lồng nhau" (dấu > của blockquote, hoặc khoảng trắng thụt
// đầu dòng của list) tối đa cho phép ở đầu 1 dòng bất kỳ. QUAN TRỌNG: đây
// không phải giới hạn cho đẹp mà là RÀO CHẮN AN TOÀN thật sự - đã kiểm chứng
// thực tế bằng Playwright rằng markdown lồng quá sâu (vd 500 dấu ">" liên
// tiếp, tương đương ~1000 ký tự) làm CRASH HẲN TAB TRÌNH DUYỆT (không phải
// lỗi JS ném ra bình thường mà MarkdownErrorBoundary bắt được - đây là crash
// ở tầng renderer/native bên trong bộ parser đệ quy remark/rehype, không
// cách nào phục hồi bằng code JS). Đã đo được: 150 cấp AN TOÀN, 200 cấp trở
// lên CRASH - chọn mốc 100 KÝ TỰ (~50 cấp lồng nhau) để có biên an toàn lớn,
// vẫn dư sức cho mọi tài liệu thực tế (hiếm khi lồng quá 3-5 cấp).
export const MAX_LINE_NESTING_MARKUP = 100;

// Quét từng dòng, tìm dòng nào có chuỗi "> "/khoảng trắng đầu dòng dài bất
// thường - trả về true nếu phát hiện, để chặn TRƯỚC KHI đưa vào
// react-markdown thay vì để nó thử render rồi mới biết là nguy hiểm.
const LEADING_NESTING_PATTERN = /^[ \t>]+/;

export const hasExcessiveNesting = (text: string): boolean =>
  text
    .split('\n')
    .some(
      (line) =>
        (LEADING_NESTING_PATTERN.exec(line)?.[0].length ?? 0) >
        MAX_LINE_NESTING_MARKUP
    );

// Nội dung mẫu hiện sẵn lúc mới vào trang - demo đủ các tính năng chính
// (heading, in đậm/nghiêng/gạch ngang, list, link, code block, bảng, task
// list, blockquote) để người dùng thấy ngay công cụ hoạt động ra sao, thay
// vì nhìn 2 khung trống trơn. Đây cũng là nội dung mà nút Clear sẽ quay về
// (giống cách JwtState.headerInput/payloadInput có sẵn JSON mẫu).
export const DEFAULT_MARKDOWN = `# Markdown Previewer

Type your **Markdown** on the left, see the *live preview* update in
real-time on the right.

## Features

- Real-time rendering as you type
- **Bold**, *italic*, and ~~strikethrough~~ text
- [Links](https://www.markdownguide.org/) and \`inline code\`
- Ordered and unordered lists

### Code Block

\`\`\`js
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

### Table (GitHub Flavored Markdown)

| Feature      | Supported |
| ------------ | --------- |
| Headings     | ✅        |
| Tables       | ✅        |
| Task Lists   | ✅        |

### Task List

- [x] Write the parser
- [ ] Add more examples

### Diagram (Mermaid)

\`\`\`mermaid
sequenceDiagram
    autonumber
    Alice->>Bob: Hi Bob!
    Bob-->>Alice: Hi Alice!
\`\`\`

> This is a blockquote. Markdown makes writing docs enjoyable.
`;
