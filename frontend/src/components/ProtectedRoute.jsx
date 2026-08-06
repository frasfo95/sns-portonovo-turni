import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RichiedeLogin({ children }) {
  const { utente } = useAuth();
  if (!utente) return <Navigate to="/" replace />;
  return children;
}

export function RichiedeGestore({ children }) {
  const { utente } = useAuth();
  if (!utente) return <Navigate to="/" replace />;
  if (utente.ruolo !== 'gestore') return <Navigate to="/calendario" replace />;
  return children;
}
