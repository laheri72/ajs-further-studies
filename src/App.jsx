import { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Loading } from './components/Loading';
import { useAuth } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { AdminPage } from './pages/AdminPage';
import { StudentPage } from './pages/StudentPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

export default function App() {
  const { loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (window.location.hash === '#student') navigate('/student', { replace: true });
    if (window.location.hash === '#admin') navigate('/admin', { replace: true });
  }, [navigate]);

  if (loading) return <Loading />;

  return (
    <Routes>
      <Route path="/" element={<StudentPage />} />
      <Route path="/student" element={<StudentPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
