import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import Dashboard from './pages/Dashboard.tsx';
import StoreDashboard from './pages/StoreDashboard.tsx';
import BaseMenu from './pages/BaseMenu.tsx';
import Products from './pages/Products.tsx';
import Orders from './pages/Orders.tsx';
import ArchivedOrders from './pages/ArchivedOrders.tsx';
import Customers from './pages/Customers.tsx';
import Login from './pages/Login.tsx';
import Managers from './pages/Managers.tsx';
import Stalls from './pages/Stalls.tsx';
import Staff from './pages/Staff.tsx';
import Terminals from './pages/Terminals.tsx';
import Vendors from './pages/Vendors.tsx';
import Purchases from './pages/Purchases.tsx';
import VendorDashboard from './pages/VendorDashboard.tsx';
import PurchaseAnalytics from './pages/PurchaseAnalytics.tsx';
import Bills from './pages/Bills.tsx';
import PurchaseSummary from './pages/PurchaseSummary.tsx';
import IntentDashboard from './pages/IntentDashboard.tsx';
import IntentList from './pages/IntentList.tsx';
import NewArrivals from './pages/NewArrivals.tsx';
import Reports from './pages/Reports.tsx';
import Feedback from './pages/Feedback.tsx';
import Ritz from './pages/Ritz.tsx';
import RitzCirculation from './pages/RitzCirculation.tsx';
import ManageWallets from './pages/ManageWallets.tsx';
import ManageCoupons from './pages/ManageCoupons.tsx';
import Settings from './pages/Settings.tsx';
import NotFound from './pages/NotFound.tsx';


const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="store-dashboard" element={<StoreDashboard />} />
          
          {/* Sale */}
          <Route path="sale/orders" element={<Orders />} />
          <Route path="sale/archived-bills" element={<ArchivedOrders />} />
          
          {/* Customers */}
          <Route path="customers/orders" element={<Customers />} />
          
          {/* Purchases */}
          <Route path="purchases/dashboard" element={<VendorDashboard />} />
          <Route path="purchases/orders" element={<Purchases />} />
          <Route path="purchases/summary" element={<PurchaseSummary />} />
          <Route path="purchases/bills" element={<Bills />} />
          <Route path="purchases/vendor" element={<Vendors />} />
          <Route path="purchases/analytics" element={<PurchaseAnalytics />} />
          
          {/* Intent */}
          <Route path="purchases/intent/orders-dashboard" element={<IntentDashboard title="ORDER DASHBOARD" />} />
          <Route path="purchases/intent/receives-dashboard" element={<IntentDashboard title="RECEIVABLE DASHBOARD" />} />
          <Route path="purchases/intent/orders" element={<IntentList title="ORDERS" />} />
          <Route path="purchases/intent/receives" element={<IntentList title="RECEIVES" />} />

          
          {/* Inventory */}
          <Route path="inventory/new-arrivals" element={<NewArrivals />} />
          <Route path="inventory/base" element={<BaseMenu />} />
          <Route path="inventory/products" element={<Products />} />
          <Route path="inventory/online" element={<Navigate to="/inventory/products" replace />} />
          
          {/* Others */}
          <Route path="reports" element={<Reports />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="ritz/overview" element={<Ritz />} />
          <Route path="ritz/circulation" element={<RitzCirculation />} />
          <Route path="ritz/wallets" element={<ManageWallets />} />
          <Route path="ritz/coupons" element={<ManageCoupons />} />

          
          {/* Stores */}
          <Route path="stores/terminals" element={<Terminals />} />
          <Route path="stores/managers" element={<Managers />} />
          <Route path="stores/staffs" element={<Staff />} />
          <Route path="stores/stalls" element={<Stalls />} />

          {/* Settings */}
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
