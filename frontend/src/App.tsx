import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { CustomerDetail } from './pages/CustomerDetail';
import { ChangePlan } from './pages/ChangePlan';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />

          <Route path="/customers" element={<Customers />} />

          <Route path="/customers/:customerId" element={<CustomerDetail />} />
          <Route
            path="/customers/:customerId/change-plan"
            element={<ChangePlan />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
