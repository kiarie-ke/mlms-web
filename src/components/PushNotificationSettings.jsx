import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

function decodeVapidPublicKey(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - base64.length % 4) % 4), '=');
  return Uint8Array.from(window.atob(padded), (character) => character.charCodeAt(0));
}

function errorMessage(error) {
  if (error?.status === 503) return 'Phone notifications are not configured on the LMS server yet. In-app notifications will continue to work.';
  if (error?.status === 404) return 'The LMS push service is not available yet. Please try again after the server is updated.';
  return error?.message || 'Could not update phone notification settings.';
}

export default function PushNotificationSettings() {
  const [publicKey, setPublicKey] = useState('');
  const [subscription, setSubscription] = useState(null);
  const [permission, setPermission] = useState('default');
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let current = true;
    const load = async () => {
      const canPush = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      if (!canPush) {
        if (current) {
          setSupported(false);
          setLoading(false);
        }
        return;
      }
      setSupported(true);

      try {
        const result = await api.get('/push/public-key');
        const registration = await navigator.serviceWorker.getRegistration();
        const existing = registration ? await registration.pushManager.getSubscription() : null;
        if (current) {
          setPublicKey(result.publicKey);
          setSubscription(existing);
          setPermission(Notification.permission);
        }
        const keys = existing?.toJSON().keys;
        if (existing && keys?.auth && keys.p256dh) {
          await api.post('/push/subscribe', {
            endpoint: existing.endpoint,
            keys: { auth: keys.auth, p256dh: keys.p256dh },
          });
        }
      } catch (loadError) {
        if (current) setError(errorMessage(loadError));
      } finally {
        if (current) setLoading(false);
      }
    };

    load();
    return () => { current = false; };
  }, []);

  const enable = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (Notification.permission === 'denied') {
        throw new Error('Notifications are blocked in this browser. Allow them in your phone settings, then try again.');
      }
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      if (permissionResult !== 'granted') {
        throw new Error('Allow notifications in the permission prompt to enable phone alerts.');
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const nextSubscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeVapidPublicKey(publicKey),
      });
      const keys = nextSubscription.toJSON().keys;
      if (!keys?.auth || !keys.p256dh) throw new Error('The browser did not provide a valid push subscription.');

      await api.post('/push/subscribe', {
        endpoint: nextSubscription.endpoint,
        keys: { auth: keys.auth, p256dh: keys.p256dh },
      });
      setSubscription(nextSubscription);
      setMessage('Phone notifications are enabled on this device.');
    } catch (enableError) {
      setError(errorMessage(enableError));
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (!subscription) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.post('/push/unsubscribe', { endpoint: subscription.endpoint });
      const removed = await subscription.unsubscribe();
      if (!removed) throw new Error('The browser could not remove this device subscription.');
      setSubscription(null);
      setMessage('Phone notifications are turned off on this device.');
    } catch (disableError) {
      setError(errorMessage(disableError));
    } finally {
      setBusy(false);
    }
  };

  const permissionDenied = permission === 'denied';
  const isIOS = typeof navigator !== 'undefined'
    && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

  return (
    <section className="card mb-6">
      <h2 className="font-display text-lg font-bold">Phone notifications</h2>
      <p className="mt-1 text-sm text-ink-soft">Get alerts for new classes, assignments, messages, and other LMS notifications.</p>
      {isIOS && <p className="mt-2 text-xs text-ink-soft">On iPhone or iPad, add MODARA LMS to your Home Screen and open it there before enabling notifications.</p>}
      {!supported && !loading && <p role="status" className="mt-3 text-sm text-ink-soft">This browser does not support web push notifications.</p>}
      {loading && <p role="status" className="mt-3 text-sm text-ink-soft">Checking this device…</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      {message && <p role="status" className="mt-3 text-sm text-emerald">{message}</p>}
      {supported && !loading && (subscription ? (
        <button className="btn-ghost mt-4" disabled={busy} onClick={disable}>
          {busy ? 'Updating…' : 'Turn off on this device'}
        </button>
      ) : permissionDenied ? (
        <p className="mt-3 text-sm text-ink-soft">Notifications are blocked. Enable them in your browser or phone settings first.</p>
      ) : (
        <button className="btn-primary mt-4" disabled={busy || !publicKey} onClick={enable}>
          {busy ? 'Enabling…' : 'Enable phone notifications'}
        </button>
      ))}
      <p className="mt-3 text-xs text-ink-soft">This setting applies only to this device. In-app notifications remain available.</p>
    </section>
  );
}
