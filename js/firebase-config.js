// ============================================================
//  Configuración de Firebase para la copia en la nube (proyecto "mis-extras").
//  Estos datos no son secretos: los datos los protegen las reglas de Firestore + el login con Google.
// ============================================================
window.MIS_EXTRAS_FIREBASE = {
    apiKey: 'AIzaSyD8VLI4eAefu-ZZTahRPaXaDnCI75OjKOM',
    authDomain: 'mis-extras.firebaseapp.com',
    projectId: 'mis-extras',
    appId: '1:441507829085:web:99e423949345b35b8384b4',
    messagingSenderId: '441507829085'
};

// Clave pública VAPID para los avisos (Firebase Console → Configuración del proyecto → Cloud Messaging
// → "Certificados push web" → Generar par de claves). Pegala acá, entre las comillas.
window.MIS_EXTRAS_VAPID = 'PEGAR_AQUI_LA_CLAVE_VAPID';
