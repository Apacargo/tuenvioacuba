// === Importaciones de Firebase ===
import { db } from "./firebase.js";
import {
  collection, addDoc, getDocs, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// === Verificación de sesión admin ===
if (!sessionStorage.getItem("apacargo_admin")) {
  alert("🚫 Acceso denegado. Usa la clave secreta en la página de rastreo.");
  window.location.href = "rastreo.html";
}

// === Elementos del DOM ===
const lista = document.getElementById("lista-envios");
const form = document.getElementById("form-agregar");

// === Cargar envíos existentes ===
async function cargarEnvios() {
  lista.innerHTML = "<p>Cargando envíos...</p>";

  const snap = await getDocs(collection(db, "rastreo"));
  lista.innerHTML = "";

  snap.forEach((docSnap) => {
    const d = docSnap.data();
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${d.codigo}</strong> — ${d.cliente || "Sin cliente"} — 
      ${d.estado || "Sin estado"} 
      <button data-id="${docSnap.id}" class="borrar">🗑️</button>
    `;
    lista.appendChild(li);
  });

  // Botones de eliminar
  document.querySelectorAll(".borrar").forEach((btn) => {
    btn.onclick = async () => {
      if (confirm("¿Seguro que deseas eliminar este envío?")) {
        await deleteDoc(doc(db, "rastreo", btn.dataset.id));
        cargarEnvios();
      }
    };
  });
}

// === Agregar nuevo envío ===
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    codigo: form.codigo.value.trim(),
    cliente: form.cliente.value.trim(),
    destino: form.destino.value.trim(),
    estado: form.estado.value.trim(),
    ubicacion: form.ubicacion.value.trim(),
    fecha_actualizacion: new Date(),
  };
  await addDoc(collection(db, "rastreo"), data);
  form.reset();
  cargarEnvios();
});

// === Cargar al iniciar ===
cargarEnvios();

