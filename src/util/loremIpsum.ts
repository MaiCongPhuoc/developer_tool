// Danh sách từ nền của đoạn Lorem Ipsum kinh điển. Hai từ đầu viết hoa
// ("Lorem Ipsum") vì đây là cách hiển thị quen thuộc của các tool sinh dummy
// text (giống tiêu đề), các từ còn lại giữ nguyên dạng thường.
const LOREM_WORDS = [
  'Lorem', 'Ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'ut', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'ut', 'aliquip', 'ex', 'ea',
  'commodo', 'consequat', 'duis', 'aute', 'irure', 'dolor', 'in', 'reprehenderit',
  'in', 'voluptate', 'velit', 'esse', 'cillum', 'dolore', 'eu', 'fugiat', 'nulla',
  'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident',
  'sunt', 'in', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id',
  'est', 'laborum',
];

// Sinh đoạn text dài đúng `length` ký tự (tính cả khoảng trắng) bằng cách nối
// dần từng từ trong LOREM_WORDS (lặp lại vòng tròn nếu chưa đủ độ dài), rồi
// cắt đúng ký tự cuối cùng -> luôn trả về chuỗi có length ký tự chính xác.
export const generateLoremIpsum = (length: number): string => {
  if (length <= 0) return '';

  let result = '';
  let wordIndex = 0;

  while (result.length < length) {
    const word = LOREM_WORDS[wordIndex % LOREM_WORDS.length];
    result += (result ? ' ' : '') + word;
    wordIndex++;
  }

  return result.slice(0, length);
};
