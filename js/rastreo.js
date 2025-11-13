import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { app } from "./firebase.js";

const db = getFirestore(app);

const form = document.getElementById("rastreo-form");
const mensaje = document.getElementById("mensaje");
const resultado = document.getElementById("resultado");
const detalles = document.getElementById("detalles");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const codigo = document.getElementById("codigo").value.trim().toUpperCase();

  mensaje.textContent = "Buscando envío...";
  resultado.style.display = "none";
  detalles.innerHTML = "";

  try {
    const querySnapshot = await getDocs(collection(db, "envios"));
    let encontrado = false;

    querySnapshot.forEach((docu) => {
      const data = docu.data();
      if (data.codigo.toUpperCase() === codigo) {
        encontrado = true;
        mensaje.textContent = "";
        resultado.style.display = "block";
        detalles.innerHTML = `
          <p><b>Código:</b> ${data.codigo}</p>
          <p><b>Cliente:</b> ${data.cliente}</p>
          <p><b>Destino:</b> ${data.destino}</p>
          <p><b>Estado:</b> ${data.estado}</p>
        `;
      }
    });

    if (!encontrado) {
      mensaje.textContent = "⚠️ No se encontró ningún envío con ese código.";
    }
  } catch (error) {
    console.error(error);
    mensaje.textContent = "Error al conectar con la base de datos.";
  }
});
