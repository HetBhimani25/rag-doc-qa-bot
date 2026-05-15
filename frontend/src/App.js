import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login    from './pages/Login';
import Register from './pages/Register';
import Home     from './pages/Home';
import Bookmarks from './pages/Bookmarks';

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login"     element={<Login />} />
    <Route path="/register"  element={<Register />} />
    <Route path="/"          element={<PrivateRoute><Home /></PrivateRoute>} />
    <Route path="/bookmarks" element={<PrivateRoute><Bookmarks /></PrivateRoute>} />
    <Route path="*"          element={<Navigate to="/" />} />
  </Routes>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}