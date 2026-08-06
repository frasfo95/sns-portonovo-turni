import { etichettaSettimana } from '../utils/dates';

export default function WeekNav({ lunedi, domenica, onIndietro, onAvanti, onOggi }) {
  return (
    <div className="week-nav">
      <button className="week-nav-freccia" onClick={onIndietro} aria-label="Settimana precedente">‹</button>
      <div style={{ textAlign: 'center' }}>
        <div className="week-nav-label">{etichettaSettimana(lunedi, domenica)}</div>
        <button className="btn-testo" onClick={onOggi} style={{ padding: '2px 8px', fontSize: 12 }}>
          Vai a oggi
        </button>
      </div>
      <button className="week-nav-freccia" onClick={onAvanti} aria-label="Settimana successiva">›</button>
    </div>
  );
}
