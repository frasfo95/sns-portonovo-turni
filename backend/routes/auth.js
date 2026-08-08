const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

function creaToken(utente) {
  return jwt.sign(
    { id: utente._id, nome: utente.nome, ruolo: utente.ruolo },
    process.env.JWT_SECRET,
    { expiresIn: '180d' }
  );
}

function determinaRuolo(nome) {
  const gestori = (process.env.NOMI_GESTORI || '')
    .split(',')
    .map(n => n.trim().toLowerCase())
    .filter(Boolean);
  return gestori.includes(nome.trim().toLowerCase()) ? 'gestore' : 'volontario';
}

// REGISTRAZIONE — nuovo utente
router.post('/registrati', async (req, res) => {
  try {
    const { nome, pin } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ errore: 'Inserisci il tuo nome' });
    }
    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ errore: 'Il PIN deve essere composto da esattamente 4 cifre' });
    }

    // Il PIN deve essere unico in assoluto
    const tuttiUtenti = await User.find({}, 'pin');
    for (const u of tuttiUtenti) {
      const uguale = await bcrypt.compare(pin, u.pin);
      if (uguale) {
        return res.status(409).json({ errore: 'Questo PIN è già in uso, scegline un altro' });
      }
    }

    const pinHash = await bcrypt.hash(pin, 10);
    const ruolo = determinaRuolo(nome);

    const nuovoUtente = await User.create({ nome: nome.trim(), pin: pinHash, ruolo });

    const token = creaToken(nuovoUtente);
    res.status(201).json({
      token,
      utente: { id: nuovoUtente._id, nome: nuovoUtente.nome, ruolo: nuovoUtente.ruolo }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore durante la registrazione' });
  }
});

// LOGIN — utente già registrato (solo PIN, il PIN è univoco per ciascuno)
router.post('/accedi', async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ errore: 'Inserisci il tuo PIN a 4 cifre' });
    }

    const utenti = await User.find({ attivo: true });
    let utenteTrovato = null;
    for (const u of utenti) {
      const uguale = await bcrypt.compare(pin, u.pin);
      if (uguale) { utenteTrovato = u; break; }
    }

    if (!utenteTrovato) {
      return res.status(401).json({ errore: 'PIN non riconosciuto' });
    }

    const token = creaToken(utenteTrovato);
    res.json({
      token,
      utente: { id: utenteTrovato._id, nome: utenteTrovato.nome, ruolo: utenteTrovato.ruolo }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore durante il login' });
  }
});

module.exports = router;
