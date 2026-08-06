const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  pin: {
    type: String, // salvato come hash, mai in chiaro
    required: true
  },
  ruolo: {
    type: String,
    enum: ['volontario', 'gestore'],
    default: 'volontario'
  },
  // sottoscrizione per le notifiche push (solo per il gestore, ma il campo resta generico)
  pushSubscription: {
    type: Object,
    default: null
  },
  attivo: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Impedisce a livello di database che due utenti abbiano lo stesso PIN
userSchema.index({ pin: 1 });

module.exports = mongoose.model('SnsUser', userSchema, 'sns_users');
