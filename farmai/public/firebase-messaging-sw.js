importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDhan64t76AcdG4ZlT6v6QWHvFsOp-85OU",
  messagingSenderId: "921196523463",
  projectId: "farmai-2f0f9",
  appId: "1:921196523463:web:1d56ab53c8cd53898af3e2",
});

const messaging = firebase.messaging();

// ✅ THIS IS REQUIRED FOR FCM
messaging.onBackgroundMessage((payload) => {
  console.log("📩 Background message:", payload);

  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/logo192.png",
  });
});

// click action
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});