import { useLocation, useNavigate } from 'react-router-dom';

export default function TabBar({ utente, notificheNonLette }) {
  const location = useLocation();
  const navigate = useNavigate();
  const attivo = (path) => location.pathname === path;

  return (
    <nav className="tab-bar">
      <button
        className={attivo('/calendario') ? 'attivo' : ''}
        onClick={() => navigate('/calendario')}
      >
        <span className="icona">🗓️</span>
        Calendario
      </button>

      <button
        className={attivo('/miei-turni') ? 'attivo' : ''}
        onClick={() => navigate('/miei-turni')}
      >
        <span className="icona">📋</span>
        I miei turni
      </button>

      {utente?.ruolo === 'gestore' && (
        <>
          <button
            className={attivo('/gestore') ? 'attivo' : ''}
            onClick={() => navigate('/gestore')}
          >
            <span className="icona">📊</span>
            Riepilogo
          </button>
          <button
            className={attivo('/notifiche') ? 'attivo' : ''}
            onClick={() => navigate('/notifiche')}
            style={{ position: 'relative' }}
          >
            <span className="icona">🔔</span>
            Notifiche
            {notificheNonLette > 0 && <span className="pallino-notifica" />}
          </button>
          <button
            className={attivo('/iscritti') ? 'attivo' : ''}
            onClick={() => navigate('/iscritti')}
          >
            <span className="icona">👥</span>
            Iscritti
          </button>
        </>
      )}
    </nav>
  );
}
