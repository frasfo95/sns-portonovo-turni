import { useState } from 'react';
import { nomeGiorno, dataBreve, iniziali } from '../utils/dates';

const ORARIO_INIZIO = 10 * 60; // 10:00 in minuti
const ORARIO_FINE = 18 * 60;   // 18:00 in minuti
const CAPIENZA_MAX = 5;

function orarioInMinuti(orario) {
  const [h, m] = orario.split(':').map(Number);
  return h * 60 + m;
}

// Assegna ogni turno confermato a una "corsia" (max 5), riempiendo prima quelle
// già usate se l'orario non si sovrappone (es. un turno mattina + uno pomeriggio)
function assegnaCorsie(confermati) {
  const ordinati = [...confermati].sort((a, b) => orarioInMinuti(a.oraInizio) - orarioInMinuti(b.oraInizio));
  const corsie = []; // ogni corsia: { fineUltimo, turni: [] }

  ordinati.forEach((t) => {
    const inizio = orarioInMinuti(t.oraInizio);
    let corsia = corsie.find((c) => c.fineUltimo <= inizio);
    if (!corsia) {
      corsia = { fineUltimo: 0, turni: [] };
      corsie.push(corsia);
    }
    corsia.turni.push(t);
    corsia.fineUltimo = orarioInMinuti(t.oraFine);
  });

  return corsie;
}

// Costruisce, per una corsia, la sequenza di segmenti occupati/liberi che coprono le 10:00-18:00
function costruisciSegmenti(turniCorsia) {
  const segmenti = [];
  let cursore = ORARIO_INIZIO;

  (turniCorsia || []).forEach((t) => {
    const ti = orarioInMinuti(t.oraInizio);
    const tf = orarioInMinuti(t.oraFine);
    if (ti > cursore) segmenti.push({ tipo: 'libero', inizio: cursore, fine: ti });
    segmenti.push({ tipo: 'occupato', inizio: ti, fine: tf, turno: t });
    cursore = tf;
  });

  if (cursore < ORARIO_FINE) segmenti.push({ tipo: 'libero', inizio: cursore, fine: ORARIO_FINE });
  return segmenti;
}

export default function DayCard({ date, dataStr, turni, giornoSpeciale, utente, onApri, onModifica, onElimina }) {
  const [notaAperta, setNotaAperta] = useState(null);

  const confermati = turni.filter((t) => t.stato === 'confermato');
  const riserve = turni.filter((t) => t.stato === 'riserva');

  const corsieOccupate = assegnaCorsie(confermati);
  const corsie = Array.from({ length: CAPIENZA_MAX }, (_, i) => corsieOccupate[i]?.turni || []);

  const tuttoPieno = corsieOccupate.length >= CAPIENZA_MAX &&
    corsie.every((turniCorsia) => costruisciSegmenti(turniCorsia).every((s) => s.tipo === 'occupato'));

  const oreConPresenza = corsie.some((c) => c.length > 0);
  let stato = 'scoperto';
  if (tuttoPieno) stato = 'coperto';
  else if (oreConPresenza) stato = 'parziale';

  const etichettaStato = { scoperto: 'Scoperto', parziale: 'Copertura parziale', coperto: 'Coperto' }[stato];
  const mioTurno = turni.find((t) => t.userId?._id === utente?.id || t.userId === utente?.id);

  function eMio(turno) {
    return turno.userId?._id === utente?.id || turno.userId === utente?.id;
  }

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

      <div className="corsie-container">
        {corsie.map((turniCorsia, idx) => {
          const segmenti = costruisciSegmenti(turniCorsia);
          return (
            <div key={idx}>
              <div className="corsia-riga">
                {segmenti.map((s, i) => {
                  const durata = s.fine - s.inizio;
                  if (s.tipo === 'libero') {
                    const mostraEtichetta = durata >= 90;
                    return (
                      <div key={i} className="corsia-segmento libero" style={{ flex: `${durata} 1 0` }}>
                        {mostraEtichetta && <span className="corsia-nome-libero">Libero</span>}
                      </div>
                    );
                  }
                  const t = s.turno;
                  const mio = eMio(t);
                  return (
                    <div key={i} className="corsia-segmento occupato" style={{ flex: `${durata} 1 0` }}>
                      <span className="corsia-nome">{t.userId?.nome}</span>
                      <span className="corsia-azioni">
                        {t.note && (
                          <button
                            className="corsia-icona-mini"
                            aria-label="Mostra nota"
                            onClick={() => setNotaAperta(notaAperta === t._id ? null : t._id)}
                          >
                            📝
                          </button>
                        )}
                        {mio && (
                          <>
                            <button className="corsia-icona-mini" aria-label="Modifica turno" onClick={() => onModifica(t)}>✎</button>
                            <button className="corsia-icona-mini" aria-label="Elimina turno" onClick={() => onElimina(t)}>✕</button>
                          </>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              {segmenti.filter((s) => s.tipo === 'occupato' && s.turno.note && notaAperta === s.turno._id).map((s) => (
                <div className="corsia-nota-bubble" key={s.turno._id}>"{s.turno.note}"</div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="ore-tacche">
        {Array.from({ length: 9 }).map((_, i) => {
          const ora = 10 + i;
          const posizione = (i / 8) * 100;
          const transform = i === 0 ? 'translateX(0)' : i === 8 ? 'translateX(-100%)' : 'translateX(-50%)';
          return (
            <span key={ora} className="ora-tacca" style={{ left: `${posizione}%`, transform }}>
              {ora}
            </span>
          );
        })}
      </div>

      {riserve.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          {riserve.map((t) => (
            <div className="riserva-pill" key={t._id}>
              <div className="turno-avatar" style={{ background: 'var(--ambra-segnale)', width: 26, height: 26, fontSize: 11 }}>
                {iniziali(t.userId?.nome)}
              </div>
              <span style={{ flex: 1, fontSize: 12.5, color: '#A8701D' }}>
                {t.userId?.nome} · in lista d'attesa #{t.ordineRiserva} ({t.oraInizio}–{t.oraFine})
              </span>
              {eMio(t) && (
                <span style={{ display: 'flex', gap: 4 }}>
                  <button className="icona-btn" onClick={() => onModifica(t)} aria-label="Modifica">✎</button>
                  <button className="icona-btn" onClick={() => onElimina(t)} aria-label="Elimina">✕</button>
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {!mioTurno && (
        <button className={`btn-aggiungi-turno ${tuttoPieno ? 'pieno' : ''}`} onClick={onApri}>
          {tuttoPieno ? '⏳ Segnati come riserva' : '+ Segnati per questo turno'}
        </button>
      )}
    </div>
  );
}
