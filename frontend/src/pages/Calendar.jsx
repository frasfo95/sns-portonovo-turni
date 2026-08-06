import { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import TabBar from '../components/TabBar';
import WeekNav from '../components/WeekNav';
import DayCard from '../components/DayCard';
import ShiftModal from '../components/ShiftModal';
import { inizioSettimana, giorniSettimana, formatoData, nomeGiorno, dataBreve } from '../utils/dates';

export default function Calendar() {
  const { utente } = useAuth();
  const [lunedi, setLunedi] = useState(inizioSettimana(new Date()));
  const [turni, setTurni] = useState([]);
  const [giornateSpeciali, setGiornateSpeciali] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [modale, setModale] = useState(null); // { dataStr, turnoEsistente? }
  const [avvisoRiserva, setAvvisoRiserva] = useState('');

  const giorni = giorniSettimana(lunedi);
  const domenica = giorni[6];
  const dal = formatoData(giorni[0]);
  const al = formatoData(giorni[6]);

  const carica = useCallback(async () => {
    setCaricamento(true);
    try {
      const [risTurni, risSpeciali] = await Promise.all([
        api.get('/api/turni', { params: { dal, al } }),
        api.get('/api/giornate-speciali', { params: { dal, al } })
      ]);
      setTurni(risTurni.data);
      setGiornateSpeciali(risSpeciali.data);
    } finally {
      setCaricamento(false);
    }
  }, [dal, al]);

  useEffect(() => { carica(); }, [carica]);

  function turniDelGiorno(dataStr) {
    return turni.filter((t) => t.data === dataStr);
  }

  function giornoSpecialeDi(dataStr) {
    return giornateSpeciali.find((g) => g.data === dataStr);
  }

  async function handleSalvaTurno(payload) {
    setAvvisoRiserva('');
    if (modale.turnoEsistente) {
      await api.put(`/api/turni/${modale.turnoEsistente._id}`, payload);
    } else {
      const { data } = await api.post('/api/turni', { data: modale.dataStr, ...payload });
      if (data.stato === 'riserva') {
        setAvvisoRiserva('Il turno era già completo per quell\'orario: sei stato inserito come riserva. Riceverai una notifica se dovesse liberarsi un posto.');
      }
    }
    setModale(null);
    carica();
  }

  async function handleElimina(turno) {
    if (!window.confirm(`Vuoi annullare il turno del ${turno.data} (${turno.oraInizio}-${turno.oraFine})?`)) return;
    await api.delete(`/api/turni/${turno._id}`);
    carica();
  }

  return (
    <>
      <Header />
      <div className="contenitore">
        <WeekNav
          lunedi={lunedi}
          domenica={domenica}
          onIndietro={() => setLunedi((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })}
          onAvanti={() => setLunedi((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })}
          onOggi={() => setLunedi(inizioSettimana(new Date()))}
        />

        {avvisoRiserva && (
          <div className="avviso-riserva" style={{ marginTop: 12 }}>{avvisoRiserva}</div>
        )}

        {caricamento ? (
          <div className="caricamento">Caricamento turni…</div>
        ) : (
          giorni.map((date) => {
            const dataStr = formatoData(date);
            return (
              <DayCard
                key={dataStr}
                date={date}
                dataStr={dataStr}
                turni={turniDelGiorno(dataStr)}
                giornoSpeciale={giornoSpecialeDi(dataStr)}
                utente={utente}
                onApri={() => setModale({ dataStr })}
                onModifica={(t) => setModale({ dataStr, turnoEsistente: t })}
                onElimina={handleElimina}
              />
            );
          })
        )}
      </div>

      {modale && (
        <ShiftModal
          dataStr={modale.dataStr}
          dataLeggibile={`${nomeGiorno(new Date(modale.dataStr + 'T00:00:00'))} ${dataBreve(new Date(modale.dataStr + 'T00:00:00'))}`}
          turnoEsistente={modale.turnoEsistente}
          onChiudi={() => setModale(null)}
          onSalva={handleSalvaTurno}
        />
      )}

      <TabBar utente={utente} />
    </>
  );
}
