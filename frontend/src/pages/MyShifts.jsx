import { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import TabBar from '../components/TabBar';
import ShiftModal from '../components/ShiftModal';
import { nomeGiorno, dataBreve } from '../utils/dates';

export default function MyShifts() {
  const { utente } = useAuth();
  const [turni, setTurni] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [modale, setModale] = useState(null); // { turnoEsistente, scelta?, ultimoPayload? }

  const carica = useCallback(async () => {
    setCaricamento(true);
    try {
      const { data } = await api.get('/api/turni/miei');
      setTurni(data);
    } finally {
      setCaricamento(false);
    }
  }, []);

  useEffect(() => { carica(); }, [carica]);

  async function handleElimina(turno) {
    if (!window.confirm(`Vuoi annullare il turno del ${turno.data} (${turno.oraInizio}-${turno.oraFine})?`)) return;
    await api.delete(`/api/turni/${turno._id}`);
    carica();
  }

  async function handleSalvaTurno(payload) {
    await api.put(`/api/turni/${modale.turnoEsistente._id}`, payload);
    setModale(null);
    carica();
  }

  const oggi = new Date().toISOString().slice(0, 10);

  return (
    <>
      <Header sottotitolo="I MIEI TURNI" />
      <div className="contenitore">
        <h2 className="sezione-titolo" style={{ marginTop: 20 }}>Le tue prossime giornate</h2>

        {caricamento ? (
          <div className="caricamento">Caricamento…</div>
        ) : turni.length === 0 ? (
          <div className="stato-vuoto">
            <div className="emoji">🗓️</div>
            Non sei ancora segnato in nessun turno futuro.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {turni.map((t) => {
              const data = new Date(t.data + 'T00:00:00');
              const isOggi = t.data === oggi;
              return (
                <div className="card" style={{ padding: 14 }} key={t._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15.5, color: 'var(--blu-profondo)', textTransform: 'capitalize' }}>
                        {nomeGiorno(data)} {dataBreve(data)}
                        {isOggi && <span style={{ fontFamily: 'var(--font-orario)', fontSize: 10, color: 'var(--blu-adriatico)', marginLeft: 8 }}>OGGI</span>}
                      </div>
                      <div className="turno-orario" style={{ marginTop: 2 }}>{t.oraInizio} – {t.oraFine}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {t.stato === 'riserva' ? (
                        <span className="turno-tag-riserva">RISERVA #{t.ordineRiserva}</span>
                      ) : (
                        <span className="badge-stato badge-coperto">Confermato</span>
                      )}
                      <button className="icona-btn" aria-label="Modifica" onClick={() => setModale({ turnoEsistente: t })}>✎</button>
                      <button className="icona-btn" aria-label="Elimina" onClick={() => handleElimina(t)}>✕</button>
                    </div>
                  </div>
                  {t.note && <div className="turno-nota">"{t.note}"</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modale && (
        <ShiftModal
          dataStr={modale.turnoEsistente.data}
          dataLeggibile={`${nomeGiorno(new Date(modale.turnoEsistente.data + 'T00:00:00'))} ${dataBreve(new Date(modale.turnoEsistente.data + 'T00:00:00'))}`}
          turnoEsistente={modale.turnoEsistente}
          onChiudi={() => setModale(null)}
          onSalva={handleSalvaTurno}
        />
      )}

      <TabBar utente={utente} />
    </>
  );
}
