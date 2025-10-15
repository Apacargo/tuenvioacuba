// ---------------- CONFIG ----------------
// Cambia estas constantes según prefieras
const ADMIN_PASSWORD = 'admin123';        // contraseña admin (cámbiala)
const STORAGE_KEY = 'apacargo_site_v2';   // clave localStorage
let WHATS_NUMBER = '';                    // deja vacío; pega tu número con código país luego, ej: '13053957996'

// ---------------- UI INIT ----------------
document.getElementById('year') && (document.getElementById('year').textContent = new Date().getFullYear());
const menuToggle = document.getElementById('menuToggle');
menuToggle && menuToggle.addEventListener('click', () => {
  const nav = document.getElementById('nav');
  if (!nav) return;
  nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
});

// Enlaces WhatsApp (actualiza cuando pongas número)
function openWhats(itemName){
  const num = WHATS_NUMBER;
  const text = encodeURIComponent(`Interesado en: ${itemName}`);
  if(!num){
    alert('Número de WhatsApp no configurado. Ve a script.js y coloca WHATS_NUMBER con tu número (ej: 1305...)');
    return;
  }
  const url = `https://wa.me/${num}?text=${text}`;
  window.open(url,'_blank');
}
const whatsLink = document.getElementById('whatsLink');
if(whatsLink){
  whatsLink.addEventListener('click', (e)=>{
    e.preventDefault();
    if(!WHATS_NUMBER) return alert('Número de WhatsApp no configurado en script.js');
    window.open(`https://wa.me/${WHATS_NUMBER}`,'_blank');
  });
}

// ---------------- Storage helpers ----------------
function loadAll(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  }catch(e){
    console.error(e); return {};
  }
}
function saveAll(obj){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

// ---------------- RASTREO PÚBLICO ----------------
function trackLookup(){
  const id = (document.getElementById('trackId').value || '').trim().toUpperCase();
  const out = document.getElementById('trackResult');
  const mapContainer = document.getElementById('mapContainer');

  if(!id){ out.innerHTML = '<div class="small">Introduce un número de seguimiento.</div>'; mapContainer && mapContainer.classList.add('hidden'); return; }
  const all = loadAll();
  const entry = all[id];
  if(!entry){
    out.innerHTML = `<div class="small">No se encontró el ID <strong>${id}</strong>.</div>`;
    mapContainer && mapContainer.classList.add('hidden');
    return;
  }

  // mostrar info
  let html = `<h4>${id} — ${entry.desc || ''}</h4>`;
  html += `<div class="small">Estado: <strong>${humanStatus(entry.status)}</strong></div>`;
  if(entry.steps && entry.steps.length){
    html += '<ol>';
    entry.steps.forEach((s,i)=>{
      html += `<li${i===entry.steps.length-1?' style="font-weight:700"':''}>${s.text}${s.lat?(' • '+s.lat+','+s.lng):''} <span class="small">(${new Date(s.ts).toLocaleString()})</span></li>`;
    });
    html += '</ol>';
  }

  html += `<div class="small">Última actualización: ${new Date(entry.updated||entry.created).toLocaleString()}</div>`;
  out.innerHTML = html;

  // mapa (si coords válidas en el último step o entry.center)
  const last = (entry.steps && entry.steps[entry.steps.length-1]) || {};
  const lat = last.lat || entry.centerLat;
  const lng = last.lng || entry.centerLng;
  if(lat && lng){
    const q = encodeURIComponent(`${lat},${lng}`);
    const iframe = `<iframe title="Mapa ${id}" src="https://www.google.com/maps?q=${q}&z=12&output=embed" loading="lazy"></iframe>`;
    if(mapContainer){ mapContainer.innerHTML = iframe; mapContainer.classList.remove('hidden'); }
  } else {
    mapContainer && mapContainer.classList.add('hidden');
  }
}
function humanStatus(s){
  if(!s) return 'Desconocido';
  if(s === 'recibido') return 'Recibido';
  if(s === 'en_transito') return 'En tránsito';
  if(s === 'en_aduana') return 'En aduana';
  if(s === 'entregado') return 'Entregado';
  return s;
}

// ---------------- ADMIN ----------------
function adminLogin(){
  const val = document.getElementById('adminPass').value || '';
  if(val === ADMIN_PASSWORD){
    sessionStorage.setItem('apacargo_admin','1');
    document.getElementById('loginBox').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    renderSavedList();
  } else alert('Contraseña incorrecta');
}
function requireAdmin(){
  if(!sessionStorage.getItem('apacargo_admin')){ alert('Debes ingresar en el panel Admin.'); return false; }
  return true;
}

let _tempSteps = [];
function addStep(){
  const text = (document.getElementById('a_stepText').value || '').trim();
  const lat = (document.getElementById('a_lat').value || '').trim();
  const lng = (document.getElementById('a_lng').value || '').trim();
  if(!text) return alert('Agrega texto del paso.');
  const step = { text, ts: new Date().toISOString() };
  if(lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))){
    step.lat = parseFloat(lat); step.lng = parseFloat(lng);
  }
  _tempSteps.push(step);
  document.getElementById('a_stepText').value=''; document.getElementById('a_lat').value=''; document.getElementById('a_lng').value='';
  renderStepsList();
}
function renderStepsList(){
  const ul = document.getElementById('stepsList');
  ul.innerHTML = '';
  _tempSteps.forEach((s,i)=>{
    const li = document.createElement('li');
    li.innerHTML = `${s.text}${s.lat?(' • '+s.lat+','+s.lng):''} <button class="btn btn-ghost" onclick="removeTempStep(${i})">Eliminar</button>`;
    ul.appendChild(li);
  });
}
function removeTempStep(i){ _tempSteps.splice(i,1); renderStepsList(); }

function clearForm(){
  document.getElementById('a_trackId').value=''; document.getElementById('a_desc').value=''; document.getElementById('a_status').value='recibido';
  _tempSteps = []; renderStepsList();
}

function saveTracking(){
  if(!requireAdmin()) return;
  const id = (document.getElementById('a_trackId').value||'').trim().toUpperCase();
  if(!id) return alert('Introduce ID.');
  const desc = (document.getElementById('a_desc').value||'').trim();
  const status = document.getElementById('a_status').value;
  const all = loadAll();
  all[id] = all[id] || { steps: [], created: new Date().toISOString() };
  // append temp steps
  if(_tempSteps.length){ all[id].steps = all[id].steps.concat(_tempSteps); _tempSteps = []; renderStepsList(); }
  all[id].desc = desc; all[id].status = status; all[id].updated = new Date().toISOString();
  // optional center coordinates if provided (from last step or explicit)
  const last = all[id].steps[all[id].steps.length-1];
  if(last && last.lat && last.lng){ all[id].centerLat = last.lat; all[id].centerLng = last.lng; }
  saveAll(all);
  renderSavedList();
  alert('Rastreo guardado.');
  clearForm();
}

function renderSavedList(){
  if(!requireAdmin()) return;
  const cont = document.getElementById('savedList');
  const all = loadAll();
  cont.innerHTML = '';
  const keys = Object.keys(all).sort();
  if(!keys.length){ cont.innerHTML = '<div class="small">No hay rastreos</div>'; return; }
  keys.forEach(k=>{
    const item = all[k];
    const d = document.createElement('div');
    d.style.marginBottom='0.6rem';
    d.innerHTML = `<strong>${k}</strong> <div class="small">${item.desc||''}</div>
      <div class="small">Estado: ${humanStatus(item.status)} • Pasos: ${item.steps.length}</div>
      <div style="margin-top:.4rem"><button class="btn btn-ghost" onclick="viewTracking('${k}')">Ver</button> <button class="btn btn-secondary" onclick="duplicateTracking('${k}')">Duplicar</button> <button class="btn btn-outline" onclick="deleteTracking('${k}')">Borrar</button></div>`;
    cont.appendChild(d);
  });
}

function viewTracking(id){
  const all = loadAll(); const item = all[id]; if(!item) return alert('No existe');
  let txt = `ID: ${id}\nDesc: ${item.desc||''}\nEstado: ${humanStatus(item.status)}\n\nPasos:\n`;
  item.steps.forEach((s,i)=> txt += `${i+1}. ${s.text}${s.lat?(' • '+s.lat+','+s.lng):''} (${new Date(s.ts).toLocaleString()})\n`);
  alert(txt);
}

function duplicateTracking(id){
  if(!requireAdmin()) return;
  const all = loadAll(); const item = all[id]; if(!item) return;
  const newId = `${id}-COPY-${Date.now().toString().slice(-5)}`;
  all[newId] = JSON.parse(JSON.stringify(item));
  all[newId].created = new Date().toISOString(); all[newId].updated = new Date().toISOString();
  saveAll(all); renderSavedList(); alert('Duplicado: '+newId);
}

function deleteTracking(id){
  if(!requireAdmin()) return;
  if(!confirm('Borrar rastreo '+id+'?')) return;
  const all = loadAll(); delete all[id]; saveAll(all); renderSavedList();
}

function exportAll(){
  if(!requireAdmin()) return;
  const all = loadAll();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(all, null, 2));
  const dl = document.createElement('a'); dl.setAttribute('href', dataStr); dl.setAttribute('download','apacargo_tracking.json'); document.body.appendChild(dl); dl.click(); dl.remove();
}

function importPrompt(){
  if(!requireAdmin()) return;
  const raw = prompt('Pega JSON de rastreos (se fusiona con lo existente):');
  if(!raw) return;
  try{
    const parsed = JSON.parse(raw);
    const all = loadAll();
    Object.keys(parsed).forEach(k => all[k] = parsed[k]);
    saveAll(all); alert('Importado.'); renderSavedList();
  }catch(e){ alert('JSON inválido: '+e.message); }
}

// INIT admin view if ya logueado
(function initAdmin(){
  const adminPanel = document.getElementById('adminPanel'); const loginBox = document.getElementById('loginBox');
  if(!adminPanel || !loginBox) return;
  if(sessionStorage.getItem('apacargo_admin')){ loginBox.classList.add('hidden'); adminPanel.classList.remove('hidden'); renderSavedList(); }
})();
