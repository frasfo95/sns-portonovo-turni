import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import TabBar from '../components/TabBar';
import { iniziali } from '../utils/dates';

export default function UsersList() {
  const { utente } = useAuth();
  const [utenti, setUtenti] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [anno, setAnno] = useState(new Date().getFullYear() - 1);
  const [messaggioArchivio, setMessaggioArchivio] = useState('');

  async function carica() {
    setCaricamento(true);
    try {
      const { data } = await api.get('/api/utenti');
      setUtenti(data);
    } finally {
      setCaricamento(false);
    }
  }

  useEffect(() => { carica(); }, []);

  async function cambiaRuolo(u, nuovoRuolo) {
    const messaggio = nuovoRuolo === 'gestore'
      ? `Rendere ${u.nome} un gestore? Potrà vedere iscritti, notifiche e riepiloghi.`
      : `Togliere a ${u.nome} i permessi da gestore?`;
    if (!window.confirm(messaggio)) return;
    await api.patch(`/api/utenti/${u._id}/ruolo`, { ruolo: nuovoRuolo });
    setUtenti((list) => list.map((x) => (x._id === u._id ? { ...x, ruolo: nuovoRuolo } : x)));
  }

  async function elimina(u) {
    if (!window.confirm(`Eliminare ${u.nome}? Verranno rimossi anche tutti i suoi turni.`)) return;
    await api.delete(`/api/utenti/${u._id}`);
    setUtenti((list) => list.filter((x) => x._id !== u._id));
  }

  async function archivia() {
    if (!window.confirm(`Eliminare definitivamente tutti i turni dell'anno ${anno}? L'operazione non è reversibile.`)) return;
    const { data } = await api.delete(`/api/turni/archivio/${anno}`);
    setMessaggioArchivio(`Eliminati ${data.eliminati} turni dell'anno ${anno}.`);
  }

  return (
    <>
      <Header sottotitolo="ELENCO ISCRITTI" />
      <div className="contenitore">
        <h2 className="sezione-titolo" style={{ marginTop: 20 }}>Personale registrato</h2>

        {caricamento ? (
          <div className="caricamento">Caricamento…</div>
        ) : (
          <div className="card" style={{ padding: '4px 16px' }}>
            {utenti.map((u) => (
              <div className="lista-item" key={u._id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="turno-avatar">{iniziali(u.nome)}</div>
                  <div>
                    <div className="turno-nome">{u.nome}</div>
                    <div className="turno-orario" style={{ textTransform: 'capitalize' }}>{u.ruolo}</div>
                  </div>
                </div>
                {u._id !== utente?.id && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {u.ruolo === 'volontario' ? (
                      <button className="btn-testo" style={{ fontSize: 12.5 }} onClick={() => cambiaRuolo(u, 'gestore')}>
                        Rendi gestore
                      </button>
                    ) : (
                      <button className="btn-testo" style={{ fontSize: 12.5 }} onClick={() => cambiaRuolo(u, 'volontario')}>
                        Rimuovi da gestore
                      </button>
                    )}
                    <button className="btn-pericolo" onClick={() => elimina(u)}>Elimina</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <h2 className="sezione-titolo">Archiviazione annuale</h2>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ fontSize: 13.5, color: 'var(--grigio-tenue)', marginTop: 0 }}>
            Elimina definitivamente tutti i turni registrati per un determinato anno, per liberare spazio.
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="number"
              value={anno}
              onChange={(e) => setAnno(Number(e.target.value))}
              style={{ width: 100 }}
            />
            <button className="btn-pericolo" style={{ border: '1.5px solid var(--rosso-allerta)' }} onClick={archivia}>
              Elimina turni {anno}
            </button>
          </div>
          {messaggioArchivio && <p style={{ fontSize: 13, marginTop: 10 }}>{messaggioArchivio}</p>}
        </div>
      </div>
      <TabBar utente={utente} />
    </>
  );
}
