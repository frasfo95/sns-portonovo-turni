const GIORNI = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

export function formatoData(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Ritorna il lunedì della settimana contenente la data data
export function inizioSettimana(date) {
  const d = new Date(date);
  const giorno = d.getDay();
  const diff = giorno === 0 ? -6 : 1 - giorno;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function giorniSettimana(lunedi) {
  const giorni = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(lunedi);
    d.setDate(d.getDate() + i);
    giorni.push(d);
  }
  return giorni;
}

export function nomeGiorno(date) {
  return GIORNI[date.getDay()];
}

export function dataBreve(date) {
  return `${date.getDate()} ${MESI[date.getMonth()]}`;
}

export function etichettaSettimana(lunedi, domenica) {
  const stessoMese = lunedi.getMonth() === domenica.getMonth();
  if (stessoMese) {
    return `${lunedi.getDate()} – ${domenica.getDate()} ${MESI[domenica.getMonth()]} ${domenica.getFullYear()}`;
  }
  return `${dataBreve(lunedi)} – ${dataBreve(domenica)} ${domenica.getFullYear()}`;
}

export function iniziali(nome) {
  if (!nome) return '?';
  const parti = nome.trim().split(/\s+/);
  if (parti.length === 1) return parti[0].slice(0, 2).toUpperCase();
  return (parti[0][0] + parti[parti.length - 1][0]).toUpperCase();
}
