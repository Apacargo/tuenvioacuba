// Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ✅ Tu configuración de Firebase (copiala desde Configuración del proyecto → SDK de Firebase)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "apacargo-tracking.firebaseapp.com",
  projectId: "apacargo-tracking",
  storageBucket: "apacargo-tracking.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔍 Función para buscar un paquete por su código
export async function buscarCodigo(codigo) {
  const ref = collection(db, "rastreo");
  const q = query(ref, where("codigo", "==", codigo));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  } else {
    let datos = {};
    querySnapshot.forEach((doc) => {
      datos = doc.data();
    });
    return datos;
  }
}
