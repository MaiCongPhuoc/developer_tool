import { BrowserRouter as Router, Routes, Route } from 'react-router';

import { AppLayout } from './layout/AppLayout';
import Home from './pages/Home';

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index path="/" element={<Home />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
