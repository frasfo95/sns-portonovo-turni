import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import TabBar from '../components/TabBar';
import { attivaNotifichePush } from '../utils/push';

const ICONE_TIPO = {
  iscrizione: '➕',
  modifica: '✎',
  eliminazione: '✕',
  subentro_riserva: '⤴'
};

export default function Notifications() {
  const { utente } = useAuth();
  const [notifiche, setNotifiche] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [messaggioPush, setMessaggioPush] = useState('');

  async function carica() {
    setCaricamento(true);
    try {
      const { data } = await api.get('/api/notifiche');
      setNotifiche(data);
    } finally {
      setCaricamento(false);
    }
  }

  useEffect(() => { carica(); }, []);

  async function segnaLetta(id) {
    await api.patch(`/api/notifiche/${id}/letta`);
    carica();
  }

  async function elimina(id) {
    await api.delete(`/api/notifiche/${id}`);
    setNotifiche((n) => n.filter((x) => x._id !== id));
  }

  async function handleAttivaPush() {
    setMessaggioPush('Attivazione in corso…');
    const risultato = await attivaNotifichePush();
    setMessaggioPush(risultato.ok
      ? 'Notifiche push attivate su questo dispositivo ✓'
      : `Non attivate: ${risultato.motivo}`);
  }

  const nonLette = notifiche.filter((n) => !n.letta).length;

  return (
    <>
      <Header sottotitolo="CENTRO NOTIFICHE" />
      <div className="contenitore">
        <div className="card" style={{ padding: 14, marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Notifiche sul telefono</div>
            <div style={{ fontSize: 12.5, color: 'var(--grigio-tenue)' }}>{messaggioPush || 'Ricevi un banner ad ogni iscrizione, modifica o subentro'}</div>
          </div>
          <button className="btn-secondaria" style={{ whiteSpace: 'nowrap', padding: '10px 14px', fontSize: 13 }} onClick={handleAttivaPush}>
            Attiva
          </button>
        </div>

        <h2 className="sezione-titolo">{nonLette > 0 ? `${nonLette} da leggere` : 'Tutto letto'}</h2>

        {caricamento ? (
          <div className="caricamento">Caricamento notifiche…</div>
        ) : notifiche.length === 0 ? (
          <div className="stato-vuoto">
            <div className="emoji">🔔</div>
            Nessuna notifica al momento.
          </div>
        ) : (
          notifiche.map((n) => (
            <div className={`notifica-item ${!n.letta ? 'non-letta' : ''}`} key={n._id}>
              <div style={{ fontSize: 18 }}>{ICONE_TIPO[n.tipo] || '•'}</div>
              <div className="notifica-testo">
                {n.messaggio}
                <div className="notifica-data">{new Date(n.createdAt).toLocaleString('it-IT')}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {!n.letta && (
                  <button className="icona-btn" title="Segna come letta" onClick={() => segnaLetta(n._id)}>✓</button>
                )}
                <button className="icona-btn" title="Elimina" onClick={() => elimina(n._id)}>✕</button>
              </div>
            </div>
          ))
        )}
      </div>
      <TabBar utente={utente} notificheNonLette={nonLette} />
    </>
  );
}
