import api from '../api';

function base64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64Sicuro = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64Sicuro);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function attivaNotifichePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, motivo: 'Il tuo browser non supporta le notifiche push' };
  }

  const permesso = await Notification.requestPermission();
  if (permesso !== 'granted') {
    return { ok: false, motivo: 'Permesso notifiche non concesso' };
  }

  const registrazione = await navigator.serviceWorker.ready;
  const { data } = await api.get('/api/notifiche/vapid-public-key');
  if (!data.chiave) {
    return { ok: false, motivo: 'Chiave notifiche non configurata sul server' };
  }

  const sottoscrizione = await registrazione.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64ToUint8Array(data.chiave)
  });

  await api.post('/api/notifiche/sottoscrivi', { subscription: sottoscrizione });
  return { ok: true };
}
