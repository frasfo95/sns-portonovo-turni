const express = require('express');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { richiedeLogin, richiedeGestore } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifiche  → elenco notifiche del gestore loggato
router.get('/', richiedeLogin, richiedeGestore, async (req, res) => {
  try {
    const notifiche = await Notification.find({ destinatarioId: req.utente.id })
      .sort({ createdAt: -1 });
    res.json(notifiche);
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore nel recupero delle notifiche' });
  }
});

// PATCH /api/notifiche/:id/letta  → segna come letta
router.patch('/:id/letta', richiedeLogin, richiedeGestore, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { letta: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ errore: 'Errore aggiornamento notifica' });
  }
});

// DELETE /api/notifiche/:id  → elimina una notifica dopo averla letta
router.delete('/:id', richiedeLogin, richiedeGestore, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ errore: 'Errore eliminazione notifica' });
  }
});

// GET /api/notifiche/vapid-public-key  → chiave pubblica per attivare le push nel browser
router.get('/vapid-public-key', (req, res) => {
  res.json({ chiave: process.env.VAPID_PUBLIC_KEY || '' });
});

// POST /api/notifiche/sottoscrivi  → salva la sottoscrizione push del gestore
router.post('/sottoscrivi', richiedeLogin, richiedeGestore, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.utente.id, { pushSubscription: req.body.subscription });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ errore: 'Errore salvataggio sottoscrizione notifiche' });
  }
});

module.exports = router;
