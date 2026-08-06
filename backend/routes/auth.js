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

// LOGIN — utente già registrato
router.post('/accedi', async (req, res) => {
  try {
    const { nome, pin } = req.body;
    if (!nome || !pin) {
      return res.status(400).json({ errore: 'Inserisci nome e PIN' });
    }

    const utente = await User.findOne({
      nome: new RegExp(`^${nome.trim()}$`, 'i'),
      attivo: true
    });

    if (!utente) {
      return res.status(401).json({ errore: 'Nome o PIN non corretti' });
    }

    const pinValido = await bcrypt.compare(pin, utente.pin);
    if (!pinValido) {
      return res.status(401).json({ errore: 'Nome o PIN non corretti' });
    }

    const token = creaToken(utente);
    res.json({
      token,
      utente: { id: utente._id, nome: utente.nome, ruolo: utente.ruolo }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errore: 'Errore durante il login' });
  }
});

module.exports = router;
