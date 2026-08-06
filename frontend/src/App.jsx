import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RichiedeLogin, RichiedeGestore } from './components/ProtectedRoute';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Calendar from './pages/Calendar';
import Gestore from './pages/Gestore';
import Notifications from './pages/Notifications';
import UsersList from './pages/UsersList';

function PaginaIniziale() {
  const { utente } = useAuth();
  if (utente) return <Navigate to="/calendario" replace />;
  return <Home />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PaginaIniziale />} />
          <Route path="/registrati" element={<Register />} />
          <Route path="/accedi" element={<Login />} />
          <Route path="/calendario" element={<RichiedeLogin><Calendar /></RichiedeLogin>} />
          <Route path="/gestore" element={<RichiedeGestore><Gestore /></RichiedeGestore>} />
          <Route path="/notifiche" element={<RichiedeGestore><Notifications /></RichiedeGestore>} />
          <Route path="/iscritti" element={<RichiedeGestore><UsersList /></RichiedeGestore>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
