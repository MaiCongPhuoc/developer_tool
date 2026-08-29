import { BrowserRouter as Router, Routes, Route } from 'react-router';

import { AppLayout } from './layout/AppLayout';
import Home from './pages/Home';
import XML from './pages/XML';

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index path="/" element={<Home />} />
          <Route index path="/xml" element={<XML />} />
          <Route index path="/encryption" element={<XML />} />
          <Route index path="/decryption" element={<XML />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
