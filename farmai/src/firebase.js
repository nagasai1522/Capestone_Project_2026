import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDhan64t76AcdG4ZlT6v6QWHvFsOp-85OU",
  authDomain: "farmai-2f0f9.firebaseapp.com",
  projectId: "farmai-2f0f9",
  storageBucket: "farmai-2f0f9.firebasestorage.app",
  messagingSenderId: "921196523463",
  appId: "1:921196523463:web:1d56ab53c8cd53898af3e2",
};

const app = initializeApp(firebaseConfig);

// Eagerly initialize messaging so onMessageListener always has an instance
let messaging = null;
const _messagingReady = isSupported().then(supported => {
  if (!supported) return null;
  try {
    messaging = getMessaging(app);
    return messaging;
  } catch (err) {
    console.warn('Firebase Messaging init failed:', err.message);
    return null;
  }
});

// Register / reuse existing service worker
const _swReady = ('serviceWorker' in navigator)
  ? navigator.serviceWorker
      .getRegistration('/firebase-messaging-sw.js')
      .then(existing => existing || navigator.serviceWorker.register('/firebase-messaging-sw.js'))
      .catch(() => null)
  : Promise.resolve(null);

export const requestFirebaseNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const m = await _messagingReady;
    if (!m) return null;

    const sw = await _swReady;

    const token = await getToken(m, {
      vapidKey: 'BBrJ5TAYbZ9w05E-NPmDE5F0Ikx6lWRJ4hjEKJ0BSjAjk2yQfdKJsVQ_ZXL9GWXY2UdzqRuSE5yNo3bBMTYCvQY',
      serviceWorkerRegistration: sw,
    });

    if (token) console.log('✅ FCM token:', token.slice(0, 30) + '...');
    return token || null;
  } catch (err) {
    console.error('FCM permission/token error:', err);
    return null;
  }
};

// Sets up foreground message listener — waits for messaging to be ready
export const onMessageListener = (callback) => {
  let unsubscribe = null;
  _messagingReady.then(m => {
    if (m) unsubscribe = onMessage(m, callback);
  });
  return () => { if (unsubscribe) unsubscribe(); };
};

export { app };