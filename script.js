import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = "https://nqzpmhlxknbtkthifzqt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xenBtaGx4a25idGt0aGlmenF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNTE4ODgsImV4cCI6MjA3NjgyNzg4OH0.1JQTXbdTslRUz9VTeXB5rq6I-aKhdQ-lDC51QMpMGqU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Panel admin oculto
let adminVisible = false;

window.trackLookup = async function() {
  const input = document.getElementById("trackId").value.trim();
  const resultDiv = document.getElementById("trackResult");
  const adminPanel = document.getElementById("adminPanel");

  // Si escribe la clave secreta
  if (input.toLowerCase() === "jackson") {
    adminVisible = !adminVisible;
    adminPanel.classList.toggle("hidden", !adminVisible);
    if (adminVisible) loadShipments();
    resultDiv.innerHTML = "";
    return;
  }

  // Búsqueda normal
  const { data, error } = await supabase
    .from("rastreo")
    .select("*")
    .eq("codigo", input)
    .maybeSingle();

  if (error || !data) {
    resultDiv.innerHTML = `<p>🚫 No se encontró ningún envío con ese código.</p>`;
  } else {
    resultDiv.innerHTML = `
      <div class="envio">
        <p><strong>Código:</strong> ${data.codigo}</p>
        <p><strong>Cliente:</strong> ${data.cliente}</p>
        <p><strong>Estado:</strong> ${data.estado}</p>
      </div>`;
  }
};

// Agregar envío
window.addShipment = async function() {
  const codigo = document.getElementById("codigo").value.trim();
  const cliente = document.getElementById("cliente").value.trim();
  const estado = document.getElementById("estado").value.trim();

  if (!codigo || !cliente || !estado) return alert("Completa todos los campos");

  const { error } = await supabase.from("rastreo").insert([{ codigo, cliente, estado }]);
  if (error) alert("❌ Error al guardar: " + error.message);
  else {
    alert("✅ Envío agregado correctamente");
    document.getElementById("codigo").value = "";
    document.getElementById("cliente").value = "";
    document.getElementById("estado").value = "";
    loadShipments();
  }
};

// Cargar envíos
async function loadShipments() {
  const list = document.getElementById("enviosList");
  const { data, error } = await supabase.from("rastreo").select("*");
  if (error) {
    list.innerHTML = "Error cargando envíos.";
    return;
  }

  list.innerHTML = data
    .map(
      (envio) => `
      <div class="envio">
        <p><strong>${envio.codigo}</strong> — ${envio.cliente} (${envio.estado})</p>
        <button class="delete-btn" onclick="deleteShipment('${envio.codigo}')">Eliminar</button>
      </div>`
    )
    .join("");
}

// Eliminar envío
window.deleteShipment = async function(codigo) {
  const confirmDelete = confirm(`¿Eliminar envío ${codigo}?`);
  if (!confirmDelete) return;

  const { error } = await supabase.from("rastreo").delete().eq("codigo", codigo);
  if (error) alert("Error al eliminar");
  else {
    alert("✅ Envío eliminado");
    loadShipments();
  }
};
