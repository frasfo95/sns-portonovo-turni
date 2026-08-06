const webpush = require('web-push');

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_CONTACT_EMAIL || 'mailto:example@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Invia una notifica push a un utente specifico (se ha una sottoscrizione salvata)
async function inviaPush(utente, titolo, testo) {
  if (!utente || !utente.pushSubscription) return;
  try {
    await webpush.sendNotification(
      utente.pushSubscription,
      JSON.stringify({ titolo, testo })
    );
  } catch (err) {
    // Se la sottoscrizione non è più valida (es. utente ha disinstallato), ignoriamo l'errore
    console.error('Errore invio push:', err.message);
  }
}

module.exports = { inviaPush };
