const express = require('express');
const User = require('../models/User');
const Shift = require('../models/Shift');
const { richiedeLogin, richiedeGestore } = require('../middleware/auth');

const router = express.Router();

// GET /api/utenti  → elenco iscritti (solo gestore)
router.get('/', richiedeLogin, richiedeGestore, async (req, res) => {
  try {
    const utenti = await User.find({}, 'nome ruolo attivo createdAt').sort({ nome: 1 });
    res.json(utenti);
  } catch (err) {
    res.status(500).json({ errore: 'Errore nel recupero degli iscritti' });
  }
});

// DELETE /api/utenti/:id  → elimina un iscritto e i suoi turni futuri (solo gestore)
router.delete('/:id', richiedeLogin, richiedeGestore, async (req, res) => {
  try {
    await Shift.deleteMany({ userId: req.params.id });
    await User.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ errore: 'Errore nell\'eliminazione dell\'iscritto' });
  }
});

// PATCH /api/utenti/:id/ruolo  → promuove/retrocede un utente (solo gestore)
router.patch('/:id/ruolo', richiedeLogin, richiedeGestore, async (req, res) => {
  try {
    const { ruolo } = req.body;
    if (!['volontario', 'gestore'].includes(ruolo)) {
      return res.status(400).json({ errore: 'Ruolo non valido' });
    }
    const utente = await User.findByIdAndUpdate(req.params.id, { ruolo }, { new: true });
    if (!utente) return res.status(404).json({ errore: 'Utente non trovato' });
    res.json({ id: utente._id, nome: utente.nome, ruolo: utente.ruolo });
  } catch (err) {
    res.status(500).json({ errore: 'Errore nell\'aggiornamento del ruolo' });
  }
});

module.exports = router;
