importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const urlParams = new URLSearchParams(self.location.search);

const firebaseConfig = {
  apiKey: urlParams.get('apiKey') || "AIzaSyCAPY1sfluAtJtb525bYFdwLuGK0nwIr6U",
  authDomain: urlParams.get('authDomain') || "auth-ba8ff.firebaseapp.com",
  projectId: urlParams.get('projectId') || "auth-ba8ff",
  storageBucket: urlParams.get('storageBucket') || "auth-ba8ff.firebasestorage.app",
  messagingSenderId: urlParams.get('messagingSenderId') || "452516814543",
  appId: urlParams.get('appId') || "1:452516814543:web:default"
};

if (firebaseConfig.apiKey && !firebase.apps?.length) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    const notificationTitle = payload.notification?.title || payload.data?.title || 'Dwelly Notification';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || '',
      icon: '/icon.png',
      data: payload.data || {}
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const targetUrl = event.notification.data?.link || event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
