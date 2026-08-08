const express = require('express');
const Shift = require('../models/Shift');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { richiedeLogin, richiedeGestore } = require('../middleware/auth');
const { inviaPush } = require('../utils/webpush');

const router = express.Router();

const CAPIENZA_MAX = 5;
const TURNO_COMPLETO_INIZIO = '10:00';
const TURNO_COMPLETO_FINE = '18:00';

function orarioInMinuti(orario) {
  const [h, m] = orario.split(':').map(Number);
  return h * 60 + m;
}

// Calcola la massima sovrapposizione contemporanea se si aggiungesse il nuovo turno
function calcolaMaxSovrapposizione(turniConfermati, nuovoInizio, nuovoFine) {
  const ni = orarioInMinuti(nuovoInizio);
  const nf = orarioInMinuti(nuovoFine);

  // punti di confine rilevanti dentro l'intervallo richiesto
  const punti = new Set([ni, nf]);
  turniConfermati.forEach(t => {
    const ti = orarioInMinuti(t.oraInizio);
    const tf = orarioInMinuti(t.oraFine);
    if (ti > ni && ti < nf) punti.add(ti);
    if (tf > ni && tf < nf) punti.add(tf);
  });

  const puntiOrdinati = Array.from(punti).sort((a, b) => a - b);
  let max = 0;

  for (let i = 0; i < puntiOrdinati.length - 1; i++) {
    const meta = (puntiOrdinati[i] + puntiOrdinati[i + 1]) / 2;
    let conteggio = 1; // il nuovo turno copre sempre questo sotto-intervallo
    turniConfermati.forEach(t => {
      const ti = orarioInMinuti(t.oraInizio);
      const tf = orarioInMinuti(t.oraFine);
      if (meta >= ti && meta < tf) conteggio++;
    });
    if (conteggio > max) max = conteggio;
  }

  return max;
}

function minutiInOrario(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Calcola le fasce orarie, dentro l'intervallo richiesto, dove c'è ancora posto (meno di 5 persone)
function calcolaFinestreLibere(turniConfermati, inizio, fine) {
  const ni = orarioInMinuti(inizio);
  const nf = orarioInMinuti(fine);

  const punti = new Set([ni, nf]);
  turniConfermati.forEach(t => {
    const ti = orarioInMinuti(t.oraInizio);
    const tf = orarioInMinuti(t.oraFine);
    if (ti > ni && ti < nf) punti.add(ti);
    if (tf > ni && tf < nf) punti.add(tf);
  });

  const ordinati = Array.from(punti).sort((a, b) => a - b);
  const finestre = [];
  let inizioLibero = null;

  for (let i = 0; i < ordinati.length - 1; i++) {
    const a = ordinati[i];
    const b = ordinati[i + 1];
    const meta = (a + b) / 2;
    const conteggio = turniConfermati.filter(t => {
      const ti = orarioInMinuti(t.oraInizio);
      const tf = orarioInMinuti(t.oraFine);
      return meta >= ti && meta < tf;
    }).length;

    if (conteggio < CAPIENZA_MAX) {
      if (inizioLibero === null) inizioLibero = a;
    } else if (inizioLibero !== null) {
      finestre.push([inizioLibero, a]);
      inizioLibero = null;
    }
  }
  if (inizioLibero !== null) finestre.push([inizioLibero, ordinati[ordinati.length - 1]]);

  // scarta finestre troppo piccole (meno di 15 minuti, non utili in pratica)
  return finestre
    .filter(([a, b]) => b - a >= 15)
    .map(([a, b]) => ({ oraInizio: minutiInOrario(a), oraFine: minutiInOrario(b) }));
}
async function creaNotificaPerGestori(tipo, messaggio, userId) {
  const gestori = await User.find({ ruolo: 'gestore' });
  const notifiche = await Promise.all(
    gestori.map(g =>
      Notification.create({ tipo, messaggio, userId, destinatarioId: g._id })
    )
  );
  await Promise.all(gestori.map(g => inviaPush(g, 'SNS Portonovo', messaggio)));
  return notifiche;
}

// GET /api/turni/miei  → tutti i turni futuri (da oggi in poi) dell'utente loggato
router.get('/miei', richiedeLogin, async (req, res) => {
  try {
    const oggi = new Date().toISOString().slice(0, 10);
    const turni = await Shift.find({ userId: req.utente.id, data: { $gte: oggi } })
      .sort({ data: 1, oraInizio: 1 });
    res.json(turni);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore nel recupero dei tuoi turni' });
  }
});

// GET /api/turni?dal=YYYY-MM-DD&al=YYYY-MM-DD  → turni di un intervallo (settimana)
router.get('/', richiedeLogin, async (req, res) => {
  try {
    const { dal, al } = req.query;
    if (!dal || !al) {
      return res.status(400).json({ errore: 'Specificare intervallo date (dal, al)' });
    }
    const turni = await Shift.find({ data: { $gte: dal, $lte: al } })
      .populate('userId', 'nome')
      .sort({ data: 1, oraInizio: 1 });

    res.json(turni);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore nel recupero dei turni' });
  }
});

// POST /api/turni  → iscrizione a un turno
router.post('/', richiedeLogin, async (req, res) => {
  try {
    const { data, oraInizio, oraFine, note, turnoCompleto, forzaRiserva } = req.body;
    const utenteId = req.utente.id;

    if (!data) return res.status(400).json({ errore: 'Data mancante' });

    const inizio = turnoCompleto ? TURNO_COMPLETO_INIZIO : oraInizio;
    const fine = turnoCompleto ? TURNO_COMPLETO_FINE : oraFine;

    if (!inizio || !fine || orarioInMinuti(inizio) >= orarioInMinuti(fine)) {
      return res.status(400).json({ errore: 'Orario non valido' });
    }

    // Un utente non può iscriversi due volte nella stessa data
    const giaIscritto = await Shift.findOne({ data, userId: utenteId });
    if (giaIscritto) {
      return res.status(409).json({ errore: 'Sei già iscritto a un turno in questa giornata' });
    }

    const turniConfermati = await Shift.find({ data, stato: 'confermato' });
    const maxSovrapposizione = calcolaMaxSovrapposizione(turniConfermati, inizio, fine);

    // Se il turno richiesto non è interamente disponibile, ma una parte sì,
    // proponiamo quella fascia invece di mettere subito in riserva per tutto l'orario
    if (maxSovrapposizione > CAPIENZA_MAX && !forzaRiserva) {
      const finestreLibere = calcolaFinestreLibere(turniConfermati, inizio, fine);
      if (finestreLibere.length > 0) {
        return res.json({ richiedeScelta: true, finestreLibere });
      }
    }

    const anno = new Date(data).getFullYear();
    let stato = 'confermato';
    let ordineRiserva = null;

    if (maxSovrapposizione > CAPIENZA_MAX) {
      // Nessuna fascia libera (o l'utente ha scelto comunque di attendere) → iscrizione come riserva
      const riserveEsistenti = await Shift.countDocuments({ data, stato: 'riserva' });
      stato = 'riserva';
      ordineRiserva = riserveEsistenti + 1;
    }

    const nuovoTurno = await Shift.create({
      data, oraInizio: inizio, oraFine: fine, note: note || '',
      userId: utenteId, stato, ordineRiserva, annoArchivio: anno
    });

    const utente = await User.findById(utenteId);
    const messaggio = stato === 'riserva'
      ? `${utente.nome} si è messo in riserva per il ${data} (${inizio}-${fine})`
      : `${utente.nome} si è iscritto al turno del ${data} (${inizio}-${fine})`;
    await creaNotificaPerGestori('iscrizione', messaggio, utenteId);

    res.status(201).json({ turno: nuovoTurno, stato });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore durante l\'iscrizione al turno' });
  }
});

// PUT /api/turni/:id  → modifica proprio turno (orario/note)
router.put('/:id', richiedeLogin, async (req, res) => {
  try {
    const turno = await Shift.findById(req.params.id);
    if (!turno) return res.status(404).json({ errore: 'Turno non trovato' });

    const isProprietario = String(turno.userId) === req.utente.id;
    if (!isProprietario && req.utente.ruolo !== 'gestore') {
      return res.status(403).json({ errore: 'Non puoi modificare questo turno' });
    }

    const { oraInizio, oraFine, note } = req.body;
    if (oraInizio) turno.oraInizio = oraInizio;
    if (oraFine) turno.oraFine = oraFine;
    if (note !== undefined) turno.note = note;

    // Se il turno era confermato e cambia orario, riverifichiamo la capienza (esclude se stesso)
    if (turno.stato === 'confermato') {
      const altriConfermati = await Shift.find({
        data: turno.data, stato: 'confermato', _id: { $ne: turno._id }
      });
      const max = calcolaMaxSovrapposizione(altriConfermati, turno.oraInizio, turno.oraFine);
      if (max > CAPIENZA_MAX) {
        return res.status(409).json({ errore: 'Con questo nuovo orario supereresti la capienza massima per quella fascia' });
      }
    }

    await turno.save();

    const utente = await User.findById(turno.userId);
    const messaggio = `${utente.nome} ha modificato il turno del ${turno.data} (${turno.oraInizio}-${turno.oraFine})`;
    await creaNotificaPerGestori('modifica', messaggio, turno.userId);

    res.json(turno);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore durante la modifica del turno' });
  }
});

// DELETE /api/turni/:id  → elimina turno (proprio, o del gestore) + subentro riserva
router.delete('/:id', richiedeLogin, async (req, res) => {
  try {
    const turno = await Shift.findById(req.params.id);
    if (!turno) return res.status(404).json({ errore: 'Turno non trovato' });

    const isProprietario = String(turno.userId) === req.utente.id;
    if (!isProprietario && req.utente.ruolo !== 'gestore') {
      return res.status(403).json({ errore: 'Non puoi eliminare questo turno' });
    }

    const eraConfermato = turno.stato === 'confermato';
    const { data, oraInizio, oraFine } = turno;
    const utenteEliminato = await User.findById(turno.userId);

    await turno.deleteOne();

    const messaggioElim = `${utenteEliminato.nome} ha annullato il turno del ${data} (${oraInizio}-${oraFine})`;
    await creaNotificaPerGestori('eliminazione', messaggioElim, turno.userId);

    // Se si liberava un posto confermato, proviamo a far subentrare la prima riserva compatibile
    if (eraConfermato) {
      const riserve = await Shift.find({ data, stato: 'riserva' }).sort({ ordineRiserva: 1 });
      const turniConfermatiRimasti = await Shift.find({ data, stato: 'confermato' });

      for (const riserva of riserve) {
        const max = calcolaMaxSovrapposizione(turniConfermatiRimasti, riserva.oraInizio, riserva.oraFine);
        if (max <= CAPIENZA_MAX) {
          riserva.stato = 'confermato';
          riserva.ordineRiserva = null;
          await riserva.save();

          const utenteSubentrato = await User.findById(riserva.userId);
          const msgSubentro = `Sei stato confermato per il turno del ${data} (${riserva.oraInizio}-${riserva.oraFine})`;
          await Notification.create({
            tipo: 'subentro_riserva', messaggio: msgSubentro,
            userId: riserva.userId, destinatarioId: riserva.userId
          });
          await inviaPush(utenteSubentrato, 'SNS Portonovo', msgSubentro);

          await creaNotificaPerGestori(
            'subentro_riserva',
            `${utenteSubentrato.nome} è subentrato dalla riserva per il ${data} (${riserva.oraInizio}-${riserva.oraFine})`,
            riserva.userId
          );
          break; // solo il primo compatibile in coda subentra
        }
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore durante l\'eliminazione del turno' });
  }
});

// GET /api/turni/riepilogo?dal=YYYY-MM-DD&al=YYYY-MM-DD  → riepilogo settimanale (solo gestore)
router.get('/riepilogo/settimana', richiedeLogin, richiedeGestore, async (req, res) => {
  try {
    const { dal, al } = req.query;
    const turni = await Shift.find({ data: { $gte: dal, $lte: al } }).populate('userId', 'nome');

    const perGiorno = {};
    let data = new Date(dal);
    const fine = new Date(al);
    while (data <= fine) {
      const chiave = data.toISOString().slice(0, 10);
      perGiorno[chiave] = { confermati: [], riserve: [], copertura: 'scoperto' };
      data.setDate(data.getDate() + 1);
    }

    turni.forEach(t => {
      if (!perGiorno[t.data]) return;
      if (t.stato === 'confermato') perGiorno[t.data].confermati.push(t);
      else perGiorno[t.data].riserve.push(t);
    });

    Object.keys(perGiorno).forEach(giorno => {
      const confermati = perGiorno[giorno].confermati;
      if (confermati.length === 0) {
        perGiorno[giorno].copertura = 'scoperto';
      } else {
        const max = calcolaMaxSovrapposizione(confermati, TURNO_COMPLETO_INIZIO, TURNO_COMPLETO_FINE) - 1;
        // se in qualche momento della giornata c'è meno di 1 persona presente, consideriamo il giorno parzialmente scoperto
        perGiorno[giorno].copertura = max >= 1 ? 'coperto' : 'parziale';
      }
    });

    res.json(perGiorno);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore nel calcolo del riepilogo' });
  }
});

// DELETE /api/turni/archivio/:anno  → elimina definitivamente tutti i turni di un anno (solo gestore)
router.delete('/archivio/:anno', richiedeLogin, richiedeGestore, async (req, res) => {
  try {
    const anno = parseInt(req.params.anno, 10);
    if (!anno) return res.status(400).json({ errore: 'Anno non valido' });
    const risultato = await Shift.deleteMany({ annoArchivio: anno });
    res.json({ ok: true, eliminati: risultato.deletedCount });
  } catch (err) {
    res.status(500).json({ errore: 'Errore durante l\'archiviazione' });
  }
});

module.exports = router;
