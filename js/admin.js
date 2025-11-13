// js/admin.js
// Panel admin: login con email/password, listar, agregar, editar y eliminar envíos.
// Usa Firebase v11 (mismo SDK que usamos en rastreo).

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, onSnapshot,
  deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

/* ====== CONFIG FIREBASE - REEMPLAZA si usas otro proyecto ======
   Si ya tienes firebase.js y prefieres importar desde allí,
   sustituye esta sección por: import { app, db, auth } from './firebase.js';
=============================================================== */
const firebaseConfig = {
  apiKey: "AIzaSyDUqgpXR7v5y0JqtNgEz7JMWIvOmRNerXI",
  authDomain: "apacargo-tracking.firebaseapp.com",
  projectId: "apacargo-tracking",
  storageBucket: "apacargo-tracking.firebasestorage.app",
  messagingSenderId: "553785487239",
  appId: "1:553785487239:web:9b8c1cc17bbc1e7f76ad22"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
/* ============================================================= */

const loginSection = document.getElementById("loginSection");
const panelSection = document.getElementById("panelSection");
const inputEmail = document.getElementById("inputEmail");
const inputPass = document.getElementById("inputPass");
const btnLogin = document.getElementById("btnLogin");
const btnTryDemo = document.getElementById("btnTryDemo");
const loginMsg = document.getElementById("loginMsg");

const formAdd = document.getElementById("formAdd");
const formMsg = document.getElementById("formMsg");
const tableBody = document.getElementById("tableBody");
const logoutBtn = document.getElementById("logoutBtn");
const clearLocal = document.getElementById("clearLocal");

/* --- Login --- */
btnLogin.addEventListener("click", async () => {
  const email = inputEmail.value.trim();
  const pass = inputPass.value.trim();
  if (!email || !pass) {
    loginMsg.textContent = "Introduce email y contraseña.";
    return;
  }
  loginMsg.textContent = "Iniciando...";
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    loginMsg.textContent = "";
  } catch (err) {
    console.error(err);
    loginMsg.textContent = "Error de acceso: " + (err.message || err.code);
  }
});

// Botón de prueba rápida (intenta iniciar con el email que dijiste)
btnTryDemo.addEventListener("click", () => {
  inputEmail.value = "apacargo2025@gmail.com";
  inputPass.value = "";
  inputPass.focus();
  loginMsg.textContent = "Introduce la contraseña del admin y pulsa Entrar.";
});

/* --- Observador de estado de autenticación --- */
onAuthStateChanged(auth, (user) => {
  if (user) {
    // mostrar panel
    loginSection.classList.add("hidden");
    panelSection.classList.remove("hidden");
    startRealtime();
  } else {
    loginSection.classList.remove("hidden");
    panelSection.classList.add("hidden");
  }
});

/* --- Cerrar sesión --- */
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  // limpiar UI
  tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center">Sesión cerrada.</td></tr>`;
});

/* --- Agregar envío --- */
formAdd.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const tracking_id = f.tracking_id.value.trim() || null;
  const codigo = f.codigo.value.trim();
  const cliente = f.cliente.value.trim() || "";
  const destino = f.destino.value.trim() || "";
  const estado = f.estado.value.trim() || "";
  const ubicacion = f.ubicacion.value.trim() || "";
  const notas = f.notas.value.trim() || "";

  if (!codigo) {
    formMsg.textContent = "El campo Código es obligatorio.";
    return;
  }
  formMsg.textContent = "Guardando...";

  try {
    await addDoc(collection(db, "rastreo"), {
      tracking_id, codigo, cliente, destino, estado, ubicacion, notas,
      fecha_actualizacion: serverTimestamp()
    });
    formMsg.textContent = "Envío agregado ✅";
    f.reset();
  } catch (err) {
    console.error(err);
    formMsg.textContent = "Error al guardar: " + (err.message || err.code);
  }

  setTimeout(() => formMsg.textContent = "", 3000);
});

/* --- Mostrar lista en tiempo real --- */
let unsubscribe = null;
function startRealtime() {
  // si ya había un listener, cancelarlo
  if (unsubscribe) unsubscribe();

  const colRef = collection(db, "rastreo");
  const q = query(colRef, orderBy("fecha_actualizacion", "desc"));

  // onSnapshot para updates en tiempo real (funciona en móvil y PC)
  unsubscribe = onSnapshot(q, (snapshot) => {
    if (!snapshot.size) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center">No hay envíos registrados.</td></tr>`;
      return;
    }

    const rows = [];
    snapshot.forEach(docSnap => {
      const id = docSnap.id;
      const d = docSnap.data();
      const fecha = d.fecha_actualizacion?.seconds ? new Date(d.fecha_actualizacion.seconds * 1000).toLocaleString() : (d.fecha_actualizacion || "—");
      rows.push(`
        <tr data-id="${id}">
          <td>${escapeHtml(d.tracking_id || "")}</td>
          <td>${escapeHtml(d.codigo || "")}</td>
          <td>${escapeHtml(d.cliente || "")}</td>
          <td>${escapeHtml(d.estado || "")}</td>
          <td>${escapeHtml(d.ubicacion || "")}</td>
          <td>${fecha}</td>
          <td class="actions">
            <button class="btn" data-action="edit" data-id="${id}">✏️</button>
            <button class="btn critical" data-action="delete" data-id="${id}">🗑️</button>
          </td>
        </tr>
      `);
    });

    tableBody.innerHTML = rows.join("");
    attachRowListeners();
  }, (err) => {
    console.error("Snapshot error:", err);
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center">Error cargando datos.</td></tr>`;
  });
}

/* --- Adjuntar eventos a botones de fila --- */
function attachRowListeners() {
  document.querySelectorAll('button[data-action="delete"]').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      if (!confirm("¿Eliminar este envío?")) return;
      try {
        await deleteDoc(doc(db, "rastreo", id));
      } catch (err) {
        console.error(err);
        alert("Error al eliminar");
      }
    };
  });

  document.querySelectorAll('button[data-action="edit"]').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      // cargar doc, mostrar prompt para editar (simple y rápido)
      const docRef = doc(db, "rastreo", id);
      const snap = await getDocs(query(collection(db, "rastreo"))); // fallback: get doc data below
      // Mejor obtener el documento por id:
      // Firestore no tiene getDoc imported yet — use update flow below:
      try {
        // Obtener documento actual desde snapshot del DOM
        const tr = document.querySelector(`tr[data-id="${id}"]`);
        const codigo = tr.children[1].textContent || "";
        const cliente = tr.children[2].textContent || "";
        const estado = tr.children[3].textContent || "";
        const ubicacion = tr.children[4].textContent || "";
        // Mostrar prompts (rápido). Puedes cambiar por modal si prefieres.
        const nuevoCliente = prompt("Cliente:", cliente) || cliente;
        const nuevoEstado = prompt("Estado:", estado) || estado;
        const nuevaUbicacion = prompt("Ubicación:", ubicacion) || ubicacion;
        await updateDoc(docRef, {
          cliente: nuevoCliente,
          estado: nuevoEstado,
          ubicacion: nuevaUbicacion,
          fecha_actualizacion: serverTimestamp()
        });
      } catch (err) {
        console.error(err);
        alert("Error al actualizar");
      }
    };
  });
}

/* --- Botón recargar / forzar --- */
clearLocal.addEventListener("click", () => {
  if (unsubscribe) unsubscribe();
  startRealtime();
});

/* --- Utilidades --- */
function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}
