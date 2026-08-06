import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [nome, setNome] = useState('');
  const [pin, setPin] = useState('');
  const [errore, setErrore] = useState('');
  const [caricamento, setCaricamento] = useState(false);
  const navigate = useNavigate();
  const { accedi } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setErrore('');

    if (!nome.trim()) {
      setErrore('Inserisci il tuo nome e cognome');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setErrore('Il PIN deve essere composto da 4 cifre');
      return;
    }

    setCaricamento(true);
    try {
      const { data } = await api.post('/api/auth/registrati', { nome, pin });
      accedi(data.token, data.utente);
      navigate('/calendario');
    } catch (err) {
      setErrore(err.response?.data?.errore || 'Errore durante la registrazione');
    } finally {
      setCaricamento(false);
    }
  }

  return (
    <div className="form-auth">
      <div>
        <h1>Registrati</h1>
        <p className="hint">Scegli un PIN a 4 cifre: ti servirà per accedere anche le prossime volte.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {errore && <div className="errore-form">{errore}</div>}

        <div className="campo">
          <label htmlFor="nome">Nome e cognome</label>
          <input
            id="nome"
            type="text"
            placeholder="Es. Mario Rossi"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="name"
          />
        </div>

        <div className="campo">
          <label htmlFor="pin">Crea il tuo PIN (4 cifre)</label>
          <input
            id="pin"
            className="pin-input"
            type="tel"
            inputMode="numeric"
            maxLength={4}
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
        </div>

        <button className="btn-primaria" type="submit" disabled={caricamento}>
          {caricamento ? 'Registrazione in corso…' : 'Crea il mio account'}
        </button>
      </form>

      <Link to="/accedi" className="link-esci">Hai già un account? Accedi</Link>
    </div>
  );
}
