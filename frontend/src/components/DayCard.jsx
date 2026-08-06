import { nomeGiorno, dataBreve, iniziali } from '../utils/dates';

const ORE_TURNO = [10, 11, 12, 13, 14, 15, 16, 17]; // segmenti di un'ora dalle 10 alle 18

function orarioInMinuti(orario) {
  const [h, m] = orario.split(':').map(Number);
  return h * 60 + m;
}

function coperturaOraria(confermati) {
  return ORE_TURNO.map((ora) => {
    const inizioSeg = ora * 60;
    const fineSeg = (ora + 1) * 60;
    const presenti = confermati.filter((t) => {
      const ti = orarioInMinuti(t.oraInizio);
      const tf = orarioInMinuti(t.oraFine);
      return ti < fineSeg && tf > inizioSeg;
    }).length;
    return presenti;
  });
}

function coloreSegmento(presenti) {
  if (presenti === 0) return 'var(--rosso-allerta)';
  if (presenti >= 5) return 'var(--verde-sicurezza)';
  if (presenti >= 3) return '#5FAE7C';
  return 'var(--ambra-segnale)';
}

export default function DayCard({ date, dataStr, turni, giornoSpeciale, utente, onApri, onModifica, onElimina }) {
  const confermati = turni.filter((t) => t.stato === 'confermato');
  const riserve = turni.filter((t) => t.stato === 'riserva');
  const segmenti = coperturaOraria(confermati);
  const oreScoperte = segmenti.filter((p) => p === 0).length;

  let stato = 'coperto';
  if (oreScoperte === ORE_TURNO.length) stato = 'scoperto';
  else if (oreScoperte > 0) stato = 'parziale';

  const etichettaStato = { scoperto: 'Scoperto', parziale: 'Copertura parziale', coperto: 'Coperto' }[stato];
  const mioTurno = turni.find((t) => t.userId?._id === utente?.id || t.userId === utente?.id);

  return (
    <div className="card giorno-card">
      <div className="giorno-header">
        <div>
          <div className="giorno-nome">{nomeGiorno(date)}</div>
          <div className="giorno-data">{dataBreve(date)}</div>
        </div>
        <span className={`badge-stato badge-${stato}`}>{etichettaStato}</span>
      </div>

      {giornoSpeciale && (
        <div className="giorno-manifestazione">
          <strong>⚑ {giornoSpeciale.titolo}</strong>
          {giornoSpeciale.descrizione && <div>{giornoSpeciale.descrizione}</div>}
        </div>
      )}

      <div className="gauge" title="Copertura dalle 10:00 alle 18:00">
        {segmenti.map((presenti, i) => (
          <div
            key={i}
            className="gauge-segmento"
            style={{ flex: 1, background: coloreSegmento(presenti) }}
          />
        ))}
      </div>

      {turni.length === 0 && <p className="giorno-vuoto">Nessuno ancora iscritto a questo turno.</p>}

      {confermati.map((t) => (
        <div className="turno-riga" key={t._id}>
          <div className="turno-avatar">{iniziali(t.userId?.nome)}</div>
          <div className="turno-info">
            <div className="turno-nome">{t.userId?.nome}</div>
            <div className="turno-orario">{t.oraInizio} – {t.oraFine}</div>
            {t.note && <div className="turno-nota">"{t.note}"</div>}
          </div>
          {(t.userId?._id === utente?.id || utente?.ruolo === 'gestore') && (
            <div className="turno-azioni">
              <button className="icona-btn" onClick={() => onModifica(t)} aria-label="Modifica turno">✎</button>
              <button className="icona-btn" onClick={() => onElimina(t)} aria-label="Elimina turno">✕</button>
            </div>
          )}
        </div>
      ))}

      {riserve.map((t) => (
        <div className="turno-riga riserva" key={t._id}>
          <div className="turno-avatar">{iniziali(t.userId?.nome)}</div>
          <div className="turno-info">
            <div className="turno-nome">
              {t.userId?.nome} <span className="turno-tag-riserva">RISERVA #{t.ordineRiserva}</span>
            </div>
            <div className="turno-orario">{t.oraInizio} – {t.oraFine}</div>
            {t.note && <div className="turno-nota">"{t.note}"</div>}
          </div>
          {(t.userId?._id === utente?.id || utente?.ruolo === 'gestore') && (
            <div className="turno-azioni">
              <button className="icona-btn" onClick={() => onModifica(t)} aria-label="Modifica turno">✎</button>
              <button className="icona-btn" onClick={() => onElimina(t)} aria-label="Elimina turno">✕</button>
            </div>
          )}
        </div>
      ))}

      {!mioTurno && (
        <button className={`btn-aggiungi-turno ${stato === 'coperto' ? 'pieno' : ''}`} onClick={onApri}>
          + Segnati per questo turno
        </button>
      )}
    </div>
  );
}
