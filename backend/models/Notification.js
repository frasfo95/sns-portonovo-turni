const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['iscrizione', 'modifica', 'eliminazione', 'subentro_riserva'],
    required: true
  },
  messaggio: {
    type: String,
    required: true
  },
  // utente che ha generato la notifica (chi si è iscritto/modificato/eliminato)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SnsUser',
    required: false
  },
  // destinatario della notifica: se null, è per tutti i gestori
  destinatarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SnsUser',
    default: null
  },
  letta: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('SnsNotification', notificationSchema, 'sns_notifications');
