require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const shiftsRoutes = require('./routes/shifts');
const notificationsRoutes = require('./routes/notifications');
const specialDaysRoutes = require('./routes/specialDays');
const usersRoutes = require('./routes/users');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/turni', shiftsRoutes);
app.use('/api/notifiche', notificationsRoutes);
app.use('/api/giornate-speciali', specialDaysRoutes);
app.use('/api/utenti', usersRoutes);

app.get('/', (req, res) => {
  res.send('SNS Portonovo - server gestione turni attivo');
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connesso al database MongoDB');
    app.listen(PORT, () => console.log(`Server avviato sulla porta ${PORT}`));
  })
  .catch(err => {
    console.error('Errore di connessione al database:', err.message);
    process.exit(1);
  });
