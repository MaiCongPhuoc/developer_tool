import { BrowserRouter as Router, Routes, Route } from 'react-router';

import { AppLayout } from './layout/AppLayout';
import Home from './pages/Home';
import XML from './pages/XML';
import Encryption from './pages/Encryption';
import Decryption from './pages/Decryption';

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index path="/" element={<Home />} />
          <Route index path="/xml" element={<XML />} />
          <Route index path="/encryption" element={<Encryption />} />
          <Route index path="/decryption" element={<Decryption />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
