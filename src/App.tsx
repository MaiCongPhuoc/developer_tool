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

export const App: React.FC = () => {
  return (
    <Router>
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
          <Route
            index
            path="/time-converter"
            element={<TimeConverter />}
          />
          <Route index path="/regex-tester" element={<RegexTester />} />
          <Route
            index
            path="/unit-converter"
            element={<UnitConverter />}
          />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
