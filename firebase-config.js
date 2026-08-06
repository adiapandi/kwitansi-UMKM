// =======================================================================
// GANTI seluruh isi objek di bawah ini dengan konfigurasi project
// Firebase kamu sendiri.
//
// Cara ambil:
// 1. Buka https://console.firebase.google.com -> buat project baru (gratis)
// 2. Di dalam project: klik ikon "</>" (Add app -> Web)
// 3. Beri nama app, lalu Firebase akan menampilkan objek firebaseConfig
// 4. Copy-paste isinya ke bawah ini
// 5. Aktifkan Firestore Database: menu "Build" -> "Firestore Database"
//    -> "Create database" -> mode "Test" dulu (bisa diperketat nanti,
//    lihat catatan keamanan di README.md)
// =======================================================================

const firebaseConfig = {
  apiKey: "AIzaSyBLM2buLzQJSa1bUqw-2LmV9KKcZsSWA8o",
  authDomain: "kwitansi-d2424.firebaseapp.com",
  projectId: "kwitansi-d2424",
  storageBucket: "kwitansi-d2424.firebasestorage.app",
  messagingSenderId: "772959539521",
  appId: "1:772959539521:web:40d0f0b664e51a10ae11c0"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
