const jwt = require('jsonwebtoken');

// Verifica che l'utente abbia effettuato il login
function richiedeLogin(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ errore: 'Accesso non effettuato' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.utente = payload; // { id, nome, ruolo }
    next();
  } catch (err) {
    return res.status(401).json({ errore: 'Sessione scaduta, effettua di nuovo il login' });
  }
}

// Verifica che l'utente sia un gestore
function richiedeGestore(req, res, next) {
  if (!req.utente || req.utente.ruolo !== 'gestore') {
    return res.status(403).json({ errore: 'Funzione riservata al gestore' });
  }
  next();
}

module.exports = { richiedeLogin, richiedeGestore };
