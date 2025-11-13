import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { app } from "./firebase.js";

const auth = getAuth(app);
const db = getFirestore(app);

const loginSection = document.getElementById("login-section");
const panelSection = document.getElementById("panel-section");
const loginForm = document.getElementById("login-form");
const addForm = document.getElementById("add-form");
const logoutBtn = document.getElementById("logout-btn");
const enviosList = document.getElementById("envios-list");
const loginError = document.getElementById("login-error");

// 🔹 LOGIN ADMIN
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginError.textContent = "";
  } catch (err) {
    loginError.textContent = "Error: credenciales incorrectas o usuario no autorizado.";
  }
});

// 🔹 MONITOREAR SESIÓN
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (user.email === "apacargo2025@gmail.com") {
      loginSection.style.display = "none";
      panelSection.style.display = "block";
      cargarEnvios();
    } else {
      alert("No tienes permiso de administrador");
      signOut(auth);
    }
  } else {
    loginSection.style.display = "block";
    panelSection.style.display = "none";
  }
});

// 🔹 AGREGAR ENVÍO
addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const codigo = document.getElementById("codigo").value.trim();
  const cliente = document.getElementById("cliente").value.trim();
  const destino = document.getElementById("destino").value.trim();
  const estado = document.getElementById("estado").value.trim();

  try {
    await addDoc(collection(db, "envios"), { codigo, cliente, destino, estado });
    alert("Envío agregado correctamente");
    addForm.reset();
    cargarEnvios();
  } catch (err) {
    alert("Error al agregar envío");
  }
});

// 🔹 CARGAR LISTA DE ENVÍOS
async function cargarEnvios() {
  enviosList.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "envios"));
  querySnapshot.forEach((docu) => {
    const data = docu.data();
    const div = document.createElement("div");
    div.className = "envio-item";
    div.innerHTML = `
      <p><b>Código:</b> ${data.codigo}</p>
      <p><b>Cliente:</b> ${data.cliente}</p>
      <p><b>Destino:</b> ${data.destino}</p>
      <p><b>Estado:</b> ${data.estado}</p>
      <button data-id="${docu.id}" class="del-btn">Eliminar</button>
      <hr>
    `;
    enviosList.appendChild(div);
  });

  document.querySelectorAll(".del-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      await deleteDoc(doc(db, "envios", id));
      cargarEnvios();
    });
  });
}

// 🔹 LOGOUT
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});
