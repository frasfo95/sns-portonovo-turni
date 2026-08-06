self.addEventListener('push', (event) => {
  let dati = { titolo: 'SNS Portonovo', testo: 'Hai una nuova notifica' };
  try {
    dati = event.data.json();
  } catch (e) {
    // ignora, usa i valori di default
  }

  const opzioni = {
    body: dati.testo,
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    vibrate: [100, 50, 100]
  };

  event.waitUntil(self.registration.showNotification(dati.titolo, opzioni));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((finestre) => {
      for (const finestra of finestre) {
        if ('focus' in finestra) return finestra.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
