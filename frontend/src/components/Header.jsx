import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header({ sottotitolo }) {
  const { utente, esci } = useAuth();
  const navigate = useNavigate();

  function handleEsci() {
    esci();
    navigate('/');
  }

  return (
    <header className="app-header">
      <div className="app-header-row">
        <h1 className="app-titolo">
          SNS · Portonovo
          <small>{sottotitolo || 'GESTIONE TURNI SOCCORRITORI'}</small>
        </h1>
        {utente && (
          <button
            onClick={handleEsci}
            style={{ background: 'transparent', color: '#C9DCE8', fontSize: 12.5, padding: '6px 4px', fontWeight: 500 }}
          >
            Esci
          </button>
        )}
      </div>
    </header>
  );
}
