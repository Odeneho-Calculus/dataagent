import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BuyData from './pages/BuyData';
import Transactions from './pages/Transactions';
import TopUp from './pages/TopUp';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminDataPlans from './pages/AdminDataPlans';
import AdminOrders from './pages/AdminOrders';
import AdminReferrals from './pages/AdminReferrals';
import AdminTransactions from './pages/AdminTransactions';
import AdminPurchases from './pages/AdminPurchases';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/buy-data"
              element={
                <ProtectedRoute>
                  <BuyData />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <Transactions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/topup"
              element={
                <ProtectedRoute>
                  <TopUp />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminProtectedRoute>
                  <AdminUsers />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/dataplans"
              element={
                <AdminProtectedRoute>
                  <AdminDataPlans />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <AdminProtectedRoute>
                  <AdminOrders />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/referrals"
              element={
                <AdminProtectedRoute>
                  <AdminReferrals />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/transactions"
              element={
                <AdminProtectedRoute>
                  <AdminTransactions />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/purchases"
              element={
                <AdminProtectedRoute>
                  <AdminPurchases />
                </AdminProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
