const express = require('express');
const SpecialDay = require('../models/SpecialDay');
const { richiedeLogin, richiedeGestore } = require('../middleware/auth');

const router = express.Router();

// GET /api/giornate-speciali?dal=...&al=...
router.get('/', richiedeLogin, async (req, res) => {
  try {
    const { dal, al } = req.query;
    const filtro = dal && al ? { data: { $gte: dal, $lte: al } } : {};
    const giornate = await SpecialDay.find(filtro).sort({ data: 1 });
    res.json(giornate);
  } catch (err) {
    res.status(500).json({ errore: 'Errore nel recupero delle giornate speciali' });
  }
});

// POST /api/giornate-speciali  → solo gestore
router.post('/', richiedeLogin, richiedeGestore, async (req, res) => {
  try {
    const { data, titolo, descrizione } = req.body;
    if (!data) return res.status(400).json({ errore: 'Data mancante' });

    const giornata = await SpecialDay.findOneAndUpdate(
      { data },
      { data, titolo: titolo || 'Manifestazione in mare', descrizione: descrizione || '' },
      { upsert: true, new: true }
    );
    res.status(201).json(giornata);
  } catch (err) {
    res.status(500).json({ errore: 'Errore nella creazione della giornata speciale' });
  }
});

// DELETE /api/giornate-speciali/:id  → solo gestore
router.delete('/:id', richiedeLogin, richiedeGestore, async (req, res) => {
  try {
    await SpecialDay.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ errore: 'Errore nell\'eliminazione' });
  }
});

module.exports = router;
