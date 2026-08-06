import { useState } from 'react';

export default function ShiftModal({ dataStr, dataLeggibile, turnoEsistente, onChiudi, onSalva }) {
  const [tipo, setTipo] = useState(
    turnoEsistente
      ? (turnoEsistente.oraInizio === '10:00' && turnoEsistente.oraFine === '18:00' ? 'completo' : 'personalizzato')
      : 'completo'
  );
  const [oraInizio, setOraInizio] = useState(turnoEsistente?.oraInizio || '10:00');
  const [oraFine, setOraFine] = useState(turnoEsistente?.oraFine || '18:00');
  const [note, setNote] = useState(turnoEsistente?.note || '');
  const [errore, setErrore] = useState('');
  const [caricamento, setCaricamento] = useState(false);

  async function handleSalva() {
    setErrore('');
    const inizio = tipo === 'completo' ? '10:00' : oraInizio;
    const fine = tipo === 'completo' ? '18:00' : oraFine;

    if (inizio >= fine) {
      setErrore('L\'orario di fine deve essere successivo a quello di inizio');
      return;
    }

    setCaricamento(true);
    try {
      await onSalva({ oraInizio: inizio, oraFine: fine, note, turnoCompleto: tipo === 'completo' });
    } catch (err) {
      setErrore(err.response?.data?.errore || 'Si è verificato un errore');
    } finally {
      setCaricamento(false);
    }
  }

  return (
    <div className="overlay" onClick={onChiudi}>
      <div className="modale" onClick={(e) => e.stopPropagation()}>
        <h2>{turnoEsistente ? 'Modifica il tuo turno' : 'Segnati per un turno'}</h2>
        <p className="sotto">{dataLeggibile}</p>

        {errore && <div className="errore-form" style={{ marginBottom: 14 }}>{errore}</div>}

        <div className="tab-turno">
          <button className={tipo === 'completo' ? 'attivo' : ''} onClick={() => setTipo('completo')}>
            Turno intero (10–18)
          </button>
          <button className={tipo === 'personalizzato' ? 'attivo' : ''} onClick={() => setTipo('personalizzato')}>
            Orario personalizzato
          </button>
        </div>

        {tipo === 'personalizzato' && (
          <div className="riga-orari" style={{ marginBottom: 14 }}>
            <div className="campo">
              <label>Dalle</label>
              <input type="time" value={oraInizio} min="10:00" max="18:00" onChange={(e) => setOraInizio(e.target.value)} />
            </div>
            <div className="campo">
              <label>Alle</label>
              <input type="time" value={oraFine} min="10:00" max="18:00" onChange={(e) => setOraFine(e.target.value)} />
            </div>
          </div>
        )}

        <div className="campo">
          <label>Note (facoltativo)</label>
          <textarea rows={2} placeholder="Es. Disponibile anche per pattugliamento" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div className="modale-azioni">
          <button className="btn-secondaria" onClick={onChiudi}>Annulla</button>
          <button className="btn-primaria" onClick={handleSalva} disabled={caricamento}>
            {caricamento ? 'Salvataggio…' : 'Conferma'}
          </button>
        </div>
      </div>
    </div>
  );
}
