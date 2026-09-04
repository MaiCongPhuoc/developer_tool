// Giới hạn độ dài HTML - iframe sandbox render lại TOÀN BỘ document mỗi lần
// (không tăng dần như DOM diffing của React), nội dung quá dài sẽ khiến mỗi
// lần debounce xong bị giật/lag. 200.000 ký tự đủ rộng rãi cho 1 trang HTML
// mẫu kèm cả CSS lẫn JavaScript nhúng bên trong (thường dài hơn markdown
// thuần vì có thêm <style>/<script>).
export const MAX_HTML_LENGTH = 200000;

// Nội dung mẫu hiện sẵn lúc mới vào trang - 1 trang HTML hoàn chỉnh có cả
// <style> (CSS) lẫn <script> (JavaScript) nhúng bên trong, demo luôn tính
// năng "real-time preview" (đếm số khi bấm nút) để người dùng thấy ngay công
// cụ hoạt động ra sao, thay vì nhìn 1 khung trống trơn. Đây cũng là nội dung
// mà nút Clear sẽ quay về khi vào lại trang (giống DEFAULT_MARKDOWN).
export const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Live Preview</title>
    <style>
      body {
        font-family: system-ui, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 24px;
        color: #1f2937;
        background: #ffffff;
      }
      button {
        padding: 8px 16px;
        border: none;
        border-radius: 8px;
        background: #3b82f6;
        color: white;
        font-weight: 600;
        cursor: pointer;
      }
      button:hover {
        background: #2563eb;
      }
      #count {
        font-size: 2rem;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <h1>HTML Previewer</h1>
    <p>Edit the HTML on the left - CSS and JavaScript can live right here,
      inside &lt;style&gt; and &lt;script&gt; tags.</p>
    <div id="count">0</div>
    <button id="btn" type="button">Click me</button>

    <script>
      let count = 0;
      const countEl = document.getElementById('count');
      document.getElementById('btn').addEventListener('click', () => {
        count += 1;
        countEl.textContent = String(count);
      });
    </script>
  </body>
</html>
`;
