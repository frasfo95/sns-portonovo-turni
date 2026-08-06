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

module.exports = router;
