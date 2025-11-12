// === Importaciones de Firebase ===
import { db } from "./firebase.js";
import { collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// === Clave secreta de acceso admin ===
const SECRET = "jackson"; // puedes cambiarla si quieres

// === Elementos del DOM ===
const btn = document.getElementById("consultarBtn");
const input = document.getElementById("codigo");
const mensaje = document.getElementById("mensaje");
const resultado = document.getElementById("resultado");

// === Eventos ===
btn.addEventListener("click", consultarEnvio);
input.addEventListener("keydown", (e) => { if (e.key === "Enter") consultarEnvio(); });

// === Función principal ===
async function consultarEnvio() {
  const codigo = (input.value || "").trim();
  mensaje.textContent = "";
  resultado.classList.add("hidden");
  resultado.innerHTML = "";

  if (!codigo) {
    mensaje.textContent = "⚠️ Introduce un número de rastreo o la clave secreta.";
    return;
  }

  // Si escribió la clave secreta -> ir al panel admin
  if (codigo.toLowerCase() === SECRET.toLowerCase()) {
    sessionStorage.setItem("apacargo_admin", "1");
    window.location.href = "admin.html";
    return;
  }

  try {
    const col = collection(db, "rastreo");
    const q = query(col, where("codigo", "==", codigo), orderBy("fecha_actualizacion", "desc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      mensaje.textContent = "❌ No se encontró ningún envío con ese número.";
      return;
    }

    let best = null;
    snap.forEach(doc => {
      const d = doc.data();
      if (!best) best = d;
      else {
        const bd = best.fecha_actualizacion?.seconds || 0;
        const nd = d.fecha_actualizacion?.seconds || 0;
        if (nd > bd) best = d;
      }
    });

    const data = best;
    resultado.innerHTML = `
      <div class="resultado-box">
        <h3>📦 Estado del Envío</h3>
        <div><strong>Código:</strong> ${escapeHtml(data.codigo || codigo)}</div>
        <div><strong>Cliente:</strong> ${escapeHtml(data.cliente || "—")}</div>
        <div><strong>Destino:</strong> ${escapeHtml(data.destino || "—")}</div>
        <div><strong>Estado:</strong> ${escapeHtml(data.estado || "—")}</div>
        <div><strong>Ubicación actual:</strong> ${escapeHtml(data.ubicacion || "—")}</div>
        <div><strong>Última actualización:</strong> ${
          data.fecha_actualizacion
            ? new Date(data.fecha_actualizacion.seconds * 1000).toLocaleString()
            : "—"
        }</div>
      </div>
    `;
    resultado.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    mensaje.textContent = "⚠️ Error al consultar, inténtalo otra vez.";
  }
}

// === Seguridad contra XSS simple ===
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

