import { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import TabBar from '../components/TabBar';
import WeekNav from '../components/WeekNav';
import { inizioSettimana, giorniSettimana, formatoData, nomeGiorno, dataBreve } from '../utils/dates';

const COLORI_STATO = {
  scoperto: { bg: 'rgba(214,72,59,0.12)', colore: 'var(--rosso-allerta)' },
  parziale: { bg: 'rgba(227,162,61,0.16)', colore: '#A8701D' },
  coperto: { bg: 'rgba(47,143,91,0.14)', colore: 'var(--verde-sicurezza)' }
};

export default function Gestore() {
  const { utente } = useAuth();
  const [lunedi, setLunedi] = useState(inizioSettimana(new Date()));
  const [riepilogo, setRiepilogo] = useState({});
  const [giornateSpeciali, setGiornateSpeciali] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [formManifestazione, setFormManifestazione] = useState(null); // { dataStr, titolo, descrizione }

  const giorni = giorniSettimana(lunedi);
  const domenica = giorni[6];
  const dal = formatoData(giorni[0]);
  const al = formatoData(giorni[6]);

  const carica = useCallback(async () => {
    setCaricamento(true);
    try {
      const [risRiep, risSpeciali] = await Promise.all([
        api.get('/api/turni/riepilogo/settimana', { params: { dal, al } }),
        api.get('/api/giornate-speciali', { params: { dal, al } })
      ]);
      setRiepilogo(risRiep.data);
      setGiornateSpeciali(risSpeciali.data);
    } finally {
      setCaricamento(false);
    }
  }, [dal, al]);

  useEffect(() => { carica(); }, [carica]);

  async function salvaManifestazione() {
    await api.post('/api/giornate-speciali', {
      data: formManifestazione.dataStr,
      titolo: formManifestazione.titolo,
      descrizione: formManifestazione.descrizione
    });
    setFormManifestazione(null);
    carica();
  }

  async function eliminaManifestazione(id) {
    if (!window.confirm('Rimuovere l\'etichetta di questa giornata?')) return;
    await api.delete(`/api/giornate-speciali/${id}`);
    carica();
  }

  const totaleConfermati = Object.values(riepilogo).reduce((s, g) => s + (g.confermati?.length || 0), 0);
  const giorniScoperti = Object.values(riepilogo).filter((g) => g.copertura === 'scoperto').length;

  return (
    <>
      <Header sottotitolo="AREA GESTORE" />
      <div className="contenitore">
        <WeekNav
          lunedi={lunedi}
          domenica={domenica}
          onIndietro={() => setLunedi((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })}
          onAvanti={() => setLunedi((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })}
          onOggi={() => setLunedi(inizioSettimana(new Date()))}
        />

        {caricamento ? (
          <div className="caricamento">Caricamento riepilogo…</div>
        ) : (
          <>
            <div className="card" style={{ padding: 16, marginTop: 8, display: 'flex', gap: 20 }}>
              <div>
                <div className="eyebrow">Presenze settimana</div>
                <div style={{ fontFamily: 'var(--font-orario)', fontSize: 24, fontWeight: 700, color: 'var(--blu-profondo)' }}>{totaleConfermati}</div>
              </div>
              <div>
                <div className="eyebrow">Giorni scoperti</div>
                <div style={{ fontFamily: 'var(--font-orario)', fontSize: 24, fontWeight: 700, color: giorniScoperti > 0 ? 'var(--rosso-allerta)' : 'var(--verde-sicurezza)' }}>
                  {giorniScoperti}
                </div>
              </div>
            </div>

            <h2 className="sezione-titolo">Personale per giorno</h2>

            {giorni.map((date) => {
              const dataStr = formatoData(date);
              const g = riepilogo[dataStr] || { confermati: [], riserve: [], copertura: 'scoperto' };
              const colori = COLORI_STATO[g.copertura];
              const speciale = giornateSpeciali.find((s) => s.data === dataStr);

              return (
                <div className="card giorno-card" key={dataStr}>
                  <div className="giorno-header">
                    <div>
                      <div className="giorno-nome">{nomeGiorno(date)}</div>
                      <div className="giorno-data">{dataBreve(date)}</div>
                    </div>
                    <span className="badge-stato" style={{ background: colori.bg, color: colori.colore }}>
                      {g.confermati.length} in servizio
                    </span>
                  </div>

                  {speciale ? (
                    <div className="giorno-manifestazione" style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        <strong>⚑ {speciale.titolo}</strong>
                        {speciale.descrizione && <div>{speciale.descrizione}</div>}
                      </div>
                      <button className="btn-pericolo" onClick={() => eliminaManifestazione(speciale._id)}>Rimuovi</button>
                    </div>
                  ) : (
                    <button
                      className="btn-testo"
                      style={{ marginBottom: 10, padding: 0 }}
                      onClick={() => setFormManifestazione({ dataStr, titolo: 'Manifestazione in mare', descrizione: '' })}
                    >
                      ⚑ Etichetta come manifestazione in mare
                    </button>
                  )}

                  {g.confermati.length === 0 && <p className="giorno-vuoto">Nessuno in servizio.</p>}

                  {g.confermati.map((t) => (
                    <div className="turno-riga" key={t._id}>
                      <div className="turno-avatar">{t.userId?.nome?.slice(0, 2).toUpperCase()}</div>
                      <div className="turno-info">
                        <div className="turno-nome">{t.userId?.nome}</div>
                        <div className="turno-orario">{t.oraInizio} – {t.oraFine}</div>
                      </div>
                    </div>
                  ))}

                  {g.riserve.length > 0 && (
                    <div style={{ marginTop: 6 }}>
                      {g.riserve.map((t) => (
                        <div className="turno-riga riserva" key={t._id}>
                          <div className="turno-avatar">{t.userId?.nome?.slice(0, 2).toUpperCase()}</div>
                          <div className="turno-info">
                            <div className="turno-nome">
                              {t.userId?.nome} <span className="turno-tag-riserva">RISERVA #{t.ordineRiserva}</span>
                            </div>
                            <div className="turno-orario">{t.oraInizio} – {t.oraFine}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {formManifestazione && (
        <div className="overlay" onClick={() => setFormManifestazione(null)}>
          <div className="modale" onClick={(e) => e.stopPropagation()}>
            <h2>Manifestazione in mare</h2>
            <p className="sotto">{formManifestazione.dataStr}</p>
            <div className="campo" style={{ marginBottom: 14 }}>
              <label>Titolo</label>
              <input
                type="text"
                value={formManifestazione.titolo}
                onChange={(e) => setFormManifestazione({ ...formManifestazione, titolo: e.target.value })}
              />
            </div>
            <div className="campo">
              <label>Descrizione (facoltativa)</label>
              <textarea
                rows={3}
                value={formManifestazione.descrizione}
                onChange={(e) => setFormManifestazione({ ...formManifestazione, descrizione: e.target.value })}
              />
            </div>
            <div className="modale-azioni">
              <button className="btn-secondaria" onClick={() => setFormManifestazione(null)}>Annulla</button>
              <button className="btn-primaria" onClick={salvaManifestazione}>Salva</button>
            </div>
          </div>
        </div>
      )}

      <TabBar utente={utente} />
    </>
  );
}
