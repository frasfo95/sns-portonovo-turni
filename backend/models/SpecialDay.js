const mongoose = require('mongoose');

const specialDaySchema = new mongoose.Schema({
  data: {
    type: String, // 'YYYY-MM-DD'
    required: true,
    unique: true
  },
  titolo: {
    type: String,
    default: 'Manifestazione in mare'
  },
  descrizione: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('SnsSpecialDay', specialDaySchema, 'sns_special_days');
