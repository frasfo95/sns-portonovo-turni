import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [pin, setPin] = useState('');
  const [errore, setErrore] = useState('');
  const [caricamento, setCaricamento] = useState(false);
  const navigate = useNavigate();
  const { accedi } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setErrore('');

    if (!/^\d{4}$/.test(pin)) {
      setErrore('Inserisci il tuo PIN a 4 cifre');
      return;
    }

    setCaricamento(true);
    try {
      const { data } = await api.post('/api/auth/accedi', { pin });
      accedi(data.token, data.utente);
      navigate('/calendario');
    } catch (err) {
      setErrore(err.response?.data?.errore || 'Errore durante l\'accesso');
    } finally {
      setCaricamento(false);
    }
  }

  return (
    <div className="form-auth">
      <div>
        <h1>Bentornato</h1>
        <p className="hint">Inserisci il tuo PIN per accedere.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {errore && <div className="errore-form">{errore}</div>}

        <div className="campo">
          <label htmlFor="pin">PIN</label>
          <input
            id="pin"
            className="pin-input"
            type="tel"
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
        </div>

        <button className="btn-primaria" type="submit" disabled={caricamento}>
          {caricamento ? 'Accesso in corso…' : 'Accedi'}
        </button>
      </form>

      <Link to="/registrati" className="link-esci">Non hai un account? Registrati</Link>
    </div>
  );
}
