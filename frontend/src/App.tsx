import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
