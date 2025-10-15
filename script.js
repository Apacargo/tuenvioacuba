/* ===========================
   script.js - Versión completa
   - Menú móvil
   - Año dinámico
   - WhatsApp (openWhats)
   - Rastreos (localStorage key: "rastreos")
   - Panel Admin (login, CRUD, import/export)
   =========================== */

/* ---------------- CONFIG ---------------- */
// Contraseña admin que pediste
const ADMIN_PASSWORD = 'jms980320';

// Clave en localStorage donde almacenamos los rastreos
const STORAGE_KEY = 'rastreos';

// Número de WhatsApp (pon tu número con código de país sin + ni espacios cuando lo tengas)
let WHATS_NUMBER = ''; // ej: '13053957996'

/* ---------------- UI INICIAL ---------------- */
// Año dinámico (si existe elemento con id 'year')
document.getElementById('year') && (document.getElementById('year').textContent = new Date().getFullYear());

/* ----- MENÚ MÓVIL ----- */
(function initMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');

  if (!menuToggle || !navMenu) return;

  menuToggle.addEventListener('click', (e) => {
    navMenu.classList.toggle('show');
  });

  // Cerrar menu al clicar fuera (en móvil)
  document.addEventListener('click', (e) => {
    if (!navMenu.classList.contains('show')) return;
    const target = e.target;
    if (target === menuToggle || navMenu.contains(target)) return;
    navMenu.classList.remove('show');
  });

  // Cerrar menu al cambiar tamaño a desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      navMenu.classList.remove('show');
    }
  });
})();

/* ---------------- WhatsApp helper ---------------- */
function openWhats(itemName) {
  const num = WHATS_NUMBER && WHATS_NUMBER.trim();
  const text = encodeURIComponent(`Interesado en: ${itemName}`);
  if (!num) {
    alert('Número de WhatsApp no configurado. Ve a script.js y asigna WHATS_NUMBER con tu número (ej: 13053957996).');
    return;
  }
  const url = `https://wa.me/${num}?text=${text}`;
  window.open(url, '_blank');
}

/* Si hay un enlace con id "whatsLink" lo conectamos */
const whatsLink = document.getElementById('whatsLink');
if (whatsLink) {
  whatsLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (!WHATS_NUMBER) return alert('Número de WhatsApp no configurado en script.js');
    window.open(`https://wa.me/${WHATS_NUMBER}`, '_blank');
  });
}

/* ---------------- Storage helpers ---------------- */
function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Error parsing localStorage', e);
    return {};
  }
}
function saveAll(obj) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

/* ---------------- RASTREO (público) ---------------- */
function humanStatus(s) {
  if (!s) return 'Desconocido';
  const map = {
    'recibido': 'Recibido',
    'en_transito': 'En tránsito',
    'en_aduana': 'En aduana',
    'entregado': 'Entregado'
  };
  return map[s] || s;
}

function trackLookup() {
  const input = document.getElementById('trackId');
  const out = document.getElementById('trackResult');
  const mapContainer = document.getElementById('mapContainer');
  if (!input || !out) return;
  const id = (input.value || '').trim().toUpperCase();
  if (!id) {
    out.innerHTML = '<div class="small">Introduce un número de seguimiento.</div>';
    mapContainer && mapContainer.classList.add('hidden');
    return;
  }
  const all = loadAll();
  const entry = all[id];
  if (!entry) {
    out.innerHTML = `<div class="small">No se encontró el ID <strong>${id}</strong>.</div>`;
    mapContainer && mapContainer.classList.add('hidden');
    return;
  }

  // Construir HTML de estado
  let html = `<h4>${id} — ${entry.desc || ''}</h4>`;
  html += `<div class="small">Estado: <strong>${humanStatus(entry.status)}</strong></div>`;
  if (entry.steps && entry.steps.length) {
    html += '<ol>';
    entry.steps.forEach((s, i) => {
      html += `<li${i === entry.steps.length - 1 ? ' style="font-weight:700"' : ''}>${s.text}${s.lat ? (' • ' + s.lat + ',' + s.lng) : ''} <span class="small">(${new Date(s.ts).toLocaleString()})</span></li>`;
    });
    html += '</ol>';
  }
  html += `<div class="small">Última actualización: ${new Date(entry.updated || entry.created).toLocaleString()}</div>`;
  out.innerHTML = html;

  // Mapa estático: usar coords del último paso con lat/lng o centerLat/centerLng
  const last = (entry.steps && entry.steps[entry.steps.length - 1]) || {};
  const lat = last.lat || entry.centerLat;
  const lng = last.lng || entry.centerLng;
  if (lat && lng && mapContainer) {
    const q = encodeURIComponent(`${lat},${lng}`);
    const iframe = `<iframe title="Mapa ${id}" src="https://www.google.com/maps?q=${q}&z=12&output=embed" loading="lazy" style="width:100%;height:320px;border:0;border-radius:8px;"></iframe>`;
    mapContainer.innerHTML = iframe;
    mapContainer.classList.remove('hidden');
  } else {
    mapContainer && mapContainer.classList.add('hidden');
  }
}

/* ---------------- ADMIN (panel local) ---------------- */
function adminLogin() {
  const val = (document.getElementById('adminPass') && document.getElementById('adminPass').value) || '';
  if (val === ADMIN_PASSWORD) {
    sessionStorage.setItem('apacargo_admin', '1');
    document.getElementById('loginBox') && document.getElementById('loginBox').classList.add('hidden');
    document.getElementById('adminPanel') && document.getElementById('adminPanel').classList.remove('hidden');
    renderSavedList();
  } else {
    alert('Contraseña incorrecta');
  }
}
function requireAdmin() {
  if (!sessionStorage.getItem('apacargo_admin')) {
    alert('Debes ingresar con la contraseña admin en la página Admin.');
    return false;
  }
  return true;
}

/* Admin temporales */
let _tempSteps = [];

function addStep() {
  const textEl = document.getElementById('a_stepText');
  const latEl = document.getElementById('a_lat');
  const lngEl = document.getElementById('a_lng');
  if (!textEl) return alert('Elemento de paso no encontrado.');
  const text = (textEl.value || '').trim();
  const lat = (latEl && latEl.value || '').trim();
  const lng = (lngEl && lngEl.value || '').trim();
  if (!text) return alert('Agrega texto del paso.');
  const step = { text, ts: new Date().toISOString() };
  if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
    step.lat = parseFloat(lat);
    step.lng = parseFloat(lng);
  }
  _tempSteps.push(step);
  if (textEl) textEl.value = '';
  if (latEl) latEl.value = '';
  if (lngEl) lngEl.value = '';
  renderStepsList();
}

function renderStepsList() {
  const ul = document.getElementById('stepsList');
  if (!ul) return;
  ul.innerHTML = '';
  _tempSteps.forEach((s, i) => {
    const li = document.createElement('li');
    li.innerHTML = `${s.text}${s.lat ? (' • ' + s.lat + ',' + s.lng) : ''} <button class="btn btn-ghost" onclick="removeTempStep(${i})">Eliminar</button>`;
    ul.appendChild(li);
  });
}

function removeTempStep(i) {
  _tempSteps.splice(i, 1);
  renderStepsList();
}

function clearForm() {
  const idEl = document.getElementById('a_trackId');
  const descEl = document.getElementById('a_desc');
  const statusEl = document.getElementById('a_status');
  if (idEl) idEl.value = '';
  if (descEl) descEl.value = '';
  if (statusEl) statusEl.value = 'recibido';
  _tempSteps = [];
  renderStepsList();
}

function saveTracking() {
  if (!requireAdmin()) return;
  const idEl = document.getElementById('a_trackId');
  if (!idEl) return alert('Elemento de ID no encontrado.');
  const id = (idEl.value || '').trim().toUpperCase();
  if (!id) return alert('Introduce ID.');
  const desc = (document.getElementById('a_desc') && document.getElementById('a_desc').value) || '';
  const status = (document.getElementById('a_status') && document.getElementById('a_status').value) || 'recibido';
  const all = loadAll();
  all[id] = all[id] || { steps: [], created: new Date().toISOString() };
  if (_tempSteps.length) {
    all[id].steps = all[id].steps.concat(_tempSteps);
    _tempSteps = [];
    renderStepsList();
  }
  all[id].desc = desc;
  all[id].status = status;
  all[id].updated = new Date().toISOString();
  const last = all[id].steps[all[id].steps.length - 1];
  if (last && last.lat && last.lng) {
    all[id].centerLat = last.lat;
    all[id].centerLng = last.lng;
  }
  saveAll(all);
  renderSavedList();
  alert('Rastreo guardado.');
  clearForm();
}

function renderSavedList() {
  if (!requireAdmin()) return;
  const cont = document.getElementById('savedList');
  if (!cont) return;
  const all = loadAll();
  cont.innerHTML = '';
  const keys = Object.keys(all).sort();
  if (!keys.length) {
    cont.innerHTML = '<div class="small">No hay rastreos guardados.</div>';
    return;
  }
  keys.forEach(k => {
    const item = all[k];
    const div = document.createElement('div');
    div.style.marginBottom = '0.6rem';
    div.innerHTML = `<strong>${k}</strong> ${item.desc ? ('<div class="small">' + item.desc + '</div>') : ''}
      <div class="small">Estado: ${humanStatus(item.status)} • Pasos: ${item.steps.length}</div>
      <div style="margin-top:.4rem">
        <button class="btn btn-ghost" onclick="viewTracking('${k}')">Ver</button>
        <button class="btn btn-secondary" onclick="duplicateTracking('${k}')">Duplicar</button>
        <button class="btn btn-outline" onclick="deleteTracking('${k}')">Borrar</button>
      </div>`;
    cont.appendChild(div);
  });
}

function viewTracking(id) {
  const all = loadAll();
  const item = all[id];
  if (!item) return alert('No existe');
  let txt = `ID: ${id}\nDesc: ${item.desc || ''}\nEstado: ${humanStatus(item.status)}\n\nPasos:\n`;
  item.steps.forEach((s, i) => txt += `${i + 1}. ${s.text}${s.lat ? (' • ' + s.lat + ',' + s.lng) : ''} (${new Date(s.ts).toLocaleString()})\n`);
  alert(txt);
}

function duplicateTracking(id) {
  if (!requireAdmin()) return;
  const all = loadAll();
  const item = all[id];
  if (!item) return alert('No existe');
  const newId = `${id}-COPY-${Date.now().toString().slice(-5)}`;
  all[newId] = JSON.parse(JSON.stringify(item));
  all[newId].created = new Date().toISOString();
  all[newId].updated = new Date().toISOString();
  saveAll(all);
  renderSavedList();
  alert('Duplicado: ' + newId);
}

function deleteTracking(id) {
  if (!requireAdmin()) return;
  if (!confirm('Borrar rastreo ' + id + '?')) return;
  const all = loadAll();
  delete all[id];
  saveAll(all);
  renderSavedList();
}

/* ---------------- Import / Export (archivo y texto) ---------------- */
(function initImportExport() {
  const importBtn = document.getElementById("importJsonBtn");
  const exportBtn = document.getElementById("exportJsonBtn");
  const fileInput = document.getElementById("jsonFileInput");
  const textInput = document.getElementById("jsonTextInput");
  const textLoadBtn = document.getElementById("jsonTextLoadBtn");

  // Exportar
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return alert('No hay rastreos guardados para exportar.');
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "rastreos-apacargo.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Importar: si existe botón y file input
  if (importBtn && fileInput) {
    importBtn.addEventListener("click", () => {
      const opcion = prompt("Escribe 1 para importar desde archivo, 2 para pegar texto JSON manualmente:");
      if (opcion === "1") {
        fileInput.click();
      } else if (opcion === "2") {
        if (textInput) textInput.style.display = "block";
        if (textLoadBtn) textLoadBtn.style.display = "inline-block";
      }
    });

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          alert("✅ Rastreos importados correctamente");
          location.reload();
        } catch (err) {
          alert("❌ Error al importar JSON: " + err.message);
        }
      };
      reader.readAsText(file);
    });

    if (textLoadBtn && textInput) {
      textLoadBtn.addEventListener("click", () => {
        try {
          const data = JSON.parse(textInput.value);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          alert("✅ Rastreos cargados correctamente desde texto");
          location.reload();
        } catch (err) {
          alert("❌ Error: JSON inválido");
        }
      });
    }
  }
})();

/* ---------------- INIT admin view if already logged ---------------- */
(function initAdminView() {
  const adminPanel = document.getElementById('adminPanel');
  const loginBox = document.getElementById('loginBox');
  if (!adminPanel || !loginBox) return;
  if (sessionStorage.getItem('apacargo_admin')) {
    loginBox.classList.add('hidden');
    adminPanel.classList.remove('hidden');
    renderSavedList();
  }
})();

/* ---------------- Expose some functions to global so HTML buttons can call them ---------------- */
window.trackLookup = trackLookup;
window.adminLogin = adminLogin;
window.addStep = addStep;
window.saveTracking = saveTracking;
window.clearForm = clearForm;
window.exportAll = function() { document.getElementById('exportJsonBtn') && document.getElementById('exportJsonBtn').click(); };
window.importPrompt = function() { document.getElementById('importJsonBtn') && document.getElementById('importJsonBtn').click(); };
window.openWhats = openWhats;
window.viewTracking = viewTracking;
window.duplicateTracking = duplicateTracking;
window.deleteTracking = deleteTracking;
