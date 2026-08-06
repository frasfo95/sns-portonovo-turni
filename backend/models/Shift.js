const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  data: {
    type: String, // formato 'YYYY-MM-DD'
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SnsUser',
    required: true
  },
  oraInizio: {
    type: String, // formato 'HH:mm'
    required: true
  },
  oraFine: {
    type: String,
    required: true
  },
  note: {
    type: String,
    default: ''
  },
  stato: {
    type: String,
    enum: ['confermato', 'riserva'],
    default: 'confermato'
  },
  ordineRiserva: {
    type: Number,
    default: null // valorizzato solo se stato = 'riserva', indica la posizione in coda
  },
  annoArchivio: {
    type: Number,
    required: true
  }
}, { timestamps: true });

shiftSchema.index({ data: 1, stato: 1 });

module.exports = mongoose.model('SnsShift', shiftSchema, 'sns_shifts');
