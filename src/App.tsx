import { BrowserRouter as Router, Routes, Route } from 'react-router';

import { AppLayout } from './layout/AppLayout';
import Home from './pages/Home';
import XML from './pages/XML';
import SQL from './pages/SQL';
import Encryption from './pages/Encryption';
import DummyText from './pages/DummyText';
import TextCompare from './pages/TextCompare';
import FileCompare from './pages/FileCompare';
import Uuid from './pages/Uuid';
import PasswordGenerator from './pages/PasswordGenerator';
import QrCode from './pages/QrCode';
import TimeConverter from './pages/TimeConverter';
import RegexTester from './pages/RegexTester';
import UnitConverter from './pages/UnitConverter';
import ColorPicker from './pages/ColorPicker';
import MarkdownPreviewer from './pages/MarkdownPreviewer';
import HtmlPreviewer from './pages/HtmlPreviewer';
import ImageCompressor from './pages/ImageCompressor';
import ImageFormatConverter from './pages/ImageFormatConverter';
import DocumentConverter from './pages/DocumentConverter';
import PrivacyPolicy from './pages/PrivacyPolicy';
import NotFound from './pages/NotFound';

// Tách riêng bảng route (không kèm BrowserRouter) để script tạo HTML tĩnh
// cho SEO (src/entry-server.tsx) có thể tái sử dụng NGUYÊN bảng route này
// dưới <StaticRouter> khi build, thay vì phải chép lại 19 <Route> ở 1 file
// khác rồi 2 nơi dễ lệch nhau theo thời gian.
export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index path="/" element={<Home />} />
        <Route index path="/xml" element={<XML />} />
        <Route index path="/sql" element={<SQL />} />
        <Route index path="/encryption" element={<Encryption />} />
        <Route index path="/dummy-text" element={<DummyText />} />
        <Route index path="/text-compare" element={<TextCompare />} />
        <Route index path="/file-compare" element={<FileCompare />} />
        <Route index path="/uuid" element={<Uuid />} />
        <Route
          index
          path="/password-generator"
          element={<PasswordGenerator />}
        />
        <Route index path="/qr-code" element={<QrCode />} />
        <Route index path="/time-converter" element={<TimeConverter />} />
        <Route index path="/regex-tester" element={<RegexTester />} />
        <Route index path="/unit-converter" element={<UnitConverter />} />
        <Route index path="/color-picker" element={<ColorPicker />} />
        <Route
          index
          path="/markdown-previewer"
          element={<MarkdownPreviewer />}
        />
        <Route index path="/html-converter" element={<HtmlPreviewer />} />
        <Route index path="/image-compressor" element={<ImageCompressor />} />
        <Route
          index
          path="/image-format-converter"
          element={<ImageFormatConverter />}
        />
        <Route
          index
          path="/document-converter"
          element={<DocumentConverter />}
        />
        <Route index path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;
